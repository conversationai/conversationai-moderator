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
  updateArticle, updateArticleModerators,
} from '../app/platform/dataService';
import { ModelId } from '../models';
import { articleData } from './notificationChecks';

export async function listenForMessages(
  action: () => Promise<void>,
  resultCheck: (type: string, message: any) => void,
): Promise<void> {
  let id: NodeJS.Timer;

  const timeout = new Promise((resolve) => {
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

export async function approveComment(
  commentId: ModelId,
  userId: ModelId,
  oldApprovedCategory: number,
  oldApprovedArticle: number,
) {
  await listenForMessages(
    () => approveCommentsRequest([commentId], userId),
    (type, message) => {
      checkTypeIsUpdate(type);
      if (message.category.approvedCount - oldApprovedCategory !== 1) {
        console.log(`ERROR: category approved count not updated correctly: ${oldApprovedCategory} -> ${message.category.approvedCount}`);
      }
      if (message.article.approvedCount - oldApprovedArticle !== 1) {
        console.log(`ERROR: article approved count not updated correctly: ${oldApprovedArticle} -> ${message.article.approvedCount}`);
      }
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
      if (message.article.isCommentingEnabled !== isCommentingEnabled) {
        console.log(`ERROR: article.isCommentingEnabled is not in correct state after op: new state: ${message.article.isCommentingEnabled}`);
      }
      if (message.article.isAutoModerated !== isAutoModerated) {
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
      if (moderators.length !== message.article.assignedModerators.length) {
        console.log(`ERROR: Article moderators doesn't have expected number of entries`);
        return;
      }

      const testSet = new Set(moderators);
      for (const m of message.article.assignedModerators) {
        if (!testSet.has(m)) {
          console.log(`ERROR: Unexpected article moderator ${m}`);
        }
      }
    });
}
