/*
Copyright 2019 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  approveCommentsRequest,
  approveFlagsAndCommentsRequest,
  rejectCommentsRequest,
  rejectFlagsAndCommentsRequest,
  updateArticle,
  updateArticleModerators,
} from '../app/platform/dataService';
import { ModelId } from '../models';
import { articleData } from './notificationChecks';

export async function listenForMessages(
  action: () => Promise<void>,
  resultCheck: (type: string, message: any) => void,
): Promise<void> {
  let id: NodeJS.Timer;

  const timeout = new Promise<void>((resolve) => {
    id = setTimeout(() => {
      console.log('Timed out while waiting for notification');
      resolve();
    }, 1000);
  });

  const readyPromise = new Promise<void>((resolve) => {
    articleData.updateHappened = (type: string , message: any) => {
      resultCheck(type, message);
      resolve();
    };
  });

  action();

  await Promise.race([
    timeout,
    readyPromise,
  ]);

  clearTimeout(id!);
  delete articleData.updateHappened;
}

function checkTypeIsUpdate(type: string) {
  if (type !== 'article-update') {
    console.log(`ERROR: returned message not an article update: ${type}`);
  }
}

function checkExpectations(
  message: any,
  categoryExpectations: {[key: string]: number},
  articleExpectations: {[key: string]: number},
) {
  for (const k of Object.keys(categoryExpectations)) {
    if (message.categories[0][k] !== categoryExpectations[k]) {
      console.log(`ERROR: category ${k} not updated correctly: ${message.categories[0][k]} should be ${categoryExpectations[k]}`);
    }
  }
  for (const k of Object.keys(articleExpectations)) {
    if (message.articles[0][k] !== articleExpectations[k]) {
      console.log(`ERROR: article ${k} not updated correctly: ${message.articles[0][k]} should be ${articleExpectations[k]}`);
    }
  }
}

export async function approveComment(
  commentId: ModelId,
  resolveFlags: boolean,
  categoryExpectations: {[key: string]: number},
  articleExpectations: {[key: string]: number},
) {
  await listenForMessages(
    () => (resolveFlags ? approveFlagsAndCommentsRequest : approveCommentsRequest)([commentId]),
    (type, message) => {
      checkTypeIsUpdate(type);
      checkExpectations(message, categoryExpectations, articleExpectations);
    });
}

export async function rejectComment(
  commentId: ModelId,
  resolveFlags: boolean,
  categoryExpectations: {[key: string]: number},
  articleExpectations: {[key: string]: number},
) {
  await listenForMessages(
    () => (resolveFlags ? rejectFlagsAndCommentsRequest : rejectCommentsRequest)([commentId]),
    (type, message) => {
      checkTypeIsUpdate(type);
      checkExpectations(message, categoryExpectations, articleExpectations);
    });
}

export async function setArticleState(
  articleId: ModelId,
  isCommentingEnabled: boolean,
  isAutoModerated: boolean,
) {
  console.log(`  setting article ${articleId} to ${isCommentingEnabled} / ${isAutoModerated}`);
  await listenForMessages(
    () => updateArticle(articleId, isCommentingEnabled, isAutoModerated),
    (type, message) => {
      checkTypeIsUpdate(type);
      if (message.articles[0].isCommentingEnabled !== isCommentingEnabled) {
        console.log(`ERROR: article.isCommentingEnabled is not in correct state after op: new state: ${message.article.isCommentingEnabled}`);
      }
      if (message.articles[0].isAutoModerated !== isAutoModerated) {
        console.log(`ERROR: article.isAutoModerated is not in correct state after op: new state: ${message.article.isAutoModerated}`);
      }
    });
}

export async function setArticleModerators(
  articleId: ModelId,
  moderators: Array<ModelId>,
) {
  console.log(`  setting moderators for article ${articleId}:`, moderators);
  await listenForMessages(
    () => updateArticleModerators(articleId, moderators),
    (type, message) => {
      checkTypeIsUpdate(type);
      if (moderators.length !== message.articles[0].assignedModerators.length) {
        console.log(`ERROR: Article moderators doesn't have expected number of entries`);
        return;
      }

      const testSet = new Set(moderators);
      for (const m of message.articles[0].assignedModerators) {
        if (!testSet.has(m)) {
          console.log(`ERROR: Unexpected article moderator ${m}`);
        }
      }
    });
}
