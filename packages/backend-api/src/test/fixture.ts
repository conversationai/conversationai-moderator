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

import * as chai from 'chai';
import * as WebSocket from 'ws';

import {
  MODERATION_ACTION_ACCEPT,
} from '../models';
import {
  IArticleInstance,
  ICategoryInstance,
  ICommentFlagInstance,
  ICommentInstance,
  ICommentScoreInstance,
  ICommentSummaryScoreAttributes,
  ICommentSummaryScoreInstance,
  IModerationRuleInstance,
  IPreselectInstance,
  ITaggingSensitivityInstance,
  ITagInstance,
  IUserInstance,
} from '../models';
import {
  Article,
  Category,
  Comment,
  CommentFlag,
  CommentScore,
  CommentSummaryScore,
  ModerationRule,
  Preselect,
  Tag,
  TaggingSensitivity,
  User,
} from '../models';

const expect = chai.expect;
export { expect };

let articleCounter = 0;
export async function makeArticle(obj = {}): Promise<IArticleInstance> {
  return await Article.create({
    sourceId: `something ${articleCounter++}`,
    title: 'An article',
    text: 'Text',
    url: 'https://example.com',
    sourceCreatedAt: '2012-10-29T21:54:07.609Z',
    isCommentingEnabled: true,
    isAutoModerated: true,
    unprocessedCount: 0,
    unmoderatedCount: 0,
    moderatedCount: 0,
    highlightedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    deferredCount: 0,
    flaggedCount: 0,
    batchedCount: 0,
    ...obj,
  });
}

export async function makeUser(obj = {}): Promise<IUserInstance> {
  return await User.create({
    group: 'general',
    name: 'Name',
    email: 'email@example.com',
    ...obj,
  });
}

export async function makeTag(obj = {}): Promise<ITagInstance> {
  return await Tag.create({
    key: 'test',
    label: 'Test',
    ...obj,
  });
}

export async function makeTaggingSensitivity(obj = {}): Promise<ITaggingSensitivityInstance> {
  return await TaggingSensitivity.create({
    lowerThreshold: 0,
    upperThreshold: 1,
    ...obj,
  });
}

let commentCounter = 0;
export async function makeComment(obj = {}): Promise<ICommentInstance> {
  return await Comment.create({
    articleId: null,
    sourceId: `something ${commentCounter++}`,
    authorSourceId: 'something',
    text: 'words',
    author: {
      name: 'Joe Bloggs',
    },
    unresolvedFlagsCount: 0,
    sourceCreatedAt: '2012-10-29T21:54:07.609Z',
    isScored: true,
    ...obj,
  });
}

export async function makeCommentScore(obj = {}): Promise<ICommentScoreInstance> {
  return await CommentScore.create({
    commentId: null,
    tagId: null,
    score: 1,
    sourceType: 'Machine',
    annotationStart: null,
    annotationEnd: null,
    ...obj,
  });
}

export async function makeCommentSummaryScore(obj: Pick<ICommentSummaryScoreAttributes, 'commentId' | 'tagId' | 'score' | 'isConfirmed'>): Promise<ICommentSummaryScoreInstance> {
  return await CommentSummaryScore.create({
    score: 1,
    ...obj,
  });
}

export async function makeCategory(obj = {}): Promise<ICategoryInstance> {
  return await Category.create({
    label: 'something',
    unprocessedCount: 0,
    unmoderatedCount: 0,
    moderatedCount: 0,
    highlightedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    deferredCount: 0,
    flaggedCount: 0,
    batchedCount: 0,
    ...obj,
  });
}

export async function makeRule(tag: ITagInstance, obj = {}): Promise<IModerationRuleInstance> {
  return await ModerationRule.create({
    tagId: tag.id,
    lowerThreshold: 0,
    upperThreshold: 1,
    action: MODERATION_ACTION_ACCEPT,
    ...obj,
  });
}

export async function makePreselect(obj = {}): Promise<IPreselectInstance> {
  return await Preselect.create({
    lowerThreshold: 0,
    upperThreshold: 1,
    ...obj,
  });
}

export async function makeFlag(obj: {}): Promise<ICommentFlagInstance> {
  return await CommentFlag.create({
    label: 'test flag',
    isResolved: false,
    ...obj,
  } as any);
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function assertSystemMessage(body: any) {
  expect(body.type).eq('system');
}
export function assertAllArticlesMessage(body: any) {
  expect(body.type).eq('global');
}
export function assertArticleUpdateMessage(body: any) {
  expect(body.type).eq('article-update');
}
export function assertUserMessage(body: any) {
  expect(body.type).eq('user');
}

export async function listenForMessages(
  action: () => Promise<void>,
  results: Array<(message: any) => void>,
): Promise<void> {
  let id: NodeJS.Timer;

  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => {
      reject(new Error('Timed out while waiting for notification'));
    }, 1000);
  });

  const p = new Promise((resolve, reject) => {
    const socket = new WebSocket('ws://localhost:3000/services/updates/summary');

    socket.onclose = () => {
      if (results.length !== 0) {
        reject('Not received enough messages');
      }
    };

    socket.onmessage = (m: any) => {
      try {
        const body: any = JSON.parse(m.data as string);
        const r = results.shift();
        if (r) {
          r(body);
        }
        if (results.length === 0) {
          resolve();
        }
      }
      catch (e) {
        reject(e);
      }
    };
  });

  await sleep(100);
  await action();

  await Promise.race([
    timeout,
    p,
  ]);
  clearTimeout(id!);
}
