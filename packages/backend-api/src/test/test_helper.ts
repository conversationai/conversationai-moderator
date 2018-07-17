/*
Copyright 2017 Google Inc.

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

import {
  Article,
  Category,
  Comment,
  CommentScore,
  CommentSummaryScore,
  IArticleInstance,
  ICategoryInstance,
  ICommentInstance,
  ICommentScoreInstance,
  ICommentSummaryScoreAttributes,
  ICommentSummaryScoreInstance,
  ITaggingSensitivityInstance,
  ITagInstance,
  IUserInstance,
  logger,
  sequelize,
  Tag,
  TaggingSensitivity,
  User,
} from '@conversationai/moderator-backend-core';

const TEST_ENVS = ['test', 'circle_ci'];

function isTestEnv() {
  return TEST_ENVS.indexOf(process.env.NODE_ENV || '') > -1;
}

logger.setTestMode(isTestEnv());

function cleanDatabase(done: any) {
  if (!isTestEnv()) {
    throw new Error('Refusing to destroy database if NODE_ENV is not `test`.');
  }

  sequelize.sync({ force: true }).then(() => done(), (e) => done(e));
}

function dropDatabase(done: any) {
  if (!isTestEnv()) {
    throw new Error('Refusing to destroy database if NODE_ENV is not `test`.');
  }
  sequelize.drop().then(done(), (e) => done(e));
}

before(cleanDatabase);
beforeEach(cleanDatabase);
after(dropDatabase);

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
    unprocessedCount: 0,
    unmoderatedCount: 0,
    moderatedCount: 0,
    highlightedCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    deferedCount: 0,
    flaggedCount: 0,
    batchedCount: 0,
    recommendedCount: 0,
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
    author: {},
    flaggedCount: 0,
    recommendedCount: 0,
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
    deferedCount: 0,
    flaggedCount: 0,
    batchedCount: 0,
    recommendedCount: 0,
    ...obj,
  });
}
