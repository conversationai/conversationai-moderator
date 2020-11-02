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

import * as faker from 'faker';
import { random, sample } from 'lodash';
import { fn } from 'sequelize';
import { underscored } from 'underscore.string';

import {
  Article,
  Category,
  Comment,
  CommentScore,
  CommentScoreRequest,
  CommentSummaryScore,
  ModerationRule,
  RESET_COUNTS,
  Tag,
  User,
} from '../../../models';
import {
  ENDPOINT_TYPE_PROXY,
  MODERATION_RULE_ACTION_TYPES,
  SCORE_SOURCE_TYPES,
  USER_GROUP_MODERATOR,
  USER_GROUP_SERVICE,
} from '../../../models';

export interface IAttributes {
  [key: string]: any;
}

// Category
export function getCategoryData(data: IAttributes = {}): IAttributes {
  return {
    label: faker.lorem.words(1),
    ...RESET_COUNTS,
    ...data,
  };
}

export async function createCategory(obj: Partial<IAttributes> = {}): Promise<Category> {
  return Category.create(getCategoryData(obj));
}

// Articles
export function getArticleData(data: Partial<IAttributes> = {}): IAttributes {
  return {
    sourceId: faker.random.uuid(),
    title: faker.lorem.words(20),
    text: faker.lorem.words(20),
    url: faker.internet.url(),
    sourceCreatedAt: new Date('2012-10-29T21:54:07.609Z'),
    isCommentingEnabled: true,
    isAutoModerated: true,
    ...RESET_COUNTS,
    ...data,
  };
}

export async function createArticle(obj: Partial<IAttributes> = {}): Promise<Article> {
  return Article.create(getArticleData(obj));
}

export function getCommentData(data: Partial<IAttributes> = {}): IAttributes {
  return {
    sourceId: faker.random.uuid(),
    authorSourceId: faker.random.uuid(),
    text: faker.lorem.words(20),
    author: {},
    sourceCreatedAt: fn('now'),
    ...data,
  } as IAttributes;
}

export async function createComment(data?: any): Promise<Comment> {
  return Comment.create(getCommentData(data));
}

// Comment score requests

export function getCommentScoreRequestData(data: Partial<IAttributes> = {}): IAttributes {
  return {
    commentId: faker.random.number(),
    userId: faker.random.number(),
    sentAt: fn('now'),

    ...data,
  };
}

export async function createCommentScoreRequest(data?: object): Promise<CommentScoreRequest> {
  return CommentScoreRequest.create(getCommentScoreRequestData(data));
}

// Users

export async function createUser(data: IAttributes = {}): Promise<User> {
  return User.create({
    group: 'general',
    email: faker.internet.email(),
    name: faker.name.firstName(),
    isActive: true,
    ...data,
  });
}

export async function createServiceUser(data: IAttributes = {}): Promise<User> {
  return User.create({
    group: USER_GROUP_SERVICE,
    name: faker.name.firstName(),
    isActive: true,
    ...data,
  });
}

export async function createModeratorUser(data: IAttributes = {}): Promise<User> {
  return User.create({
    group: USER_GROUP_MODERATOR,
    name: faker.name.firstName(),
    isActive: true,
    extra: {
      endpointType: ENDPOINT_TYPE_PROXY,
      endpoint: 'http://www.google.com',
      apiKey: 'sdf',
    },
    ...data,
  });
}

// Comment scores

export function getCommentScoreData(data: IAttributes = {}): IAttributes {
  return {
    commentId: faker.random.number(),
    tagId: faker.random.number(),
    sourceType: sample(SCORE_SOURCE_TYPES),
    score: (random(0, 100) / 100),
    ...data,
    // TODO(ldixon): fix typehack.
  } as any;
}

export async function createCommentScore(data?: object): Promise<CommentScore> {
  return CommentScore.create(getCommentScoreData(data));
}

// Comment summary scores

export function getCommentSummaryScoreData(data: IAttributes = {}): IAttributes {
  return {
    commentId: faker.random.number(),
    tagId: faker.random.number(),
    score: (random(0, 100) / 100),
    ...data,
  };
}

export async function createCommentSummaryScore(data?: object): Promise<CommentSummaryScore> {
  return CommentSummaryScore.create(getCommentSummaryScoreData(data));
}

// Moderation rules

export function getModerationRuleData(data: IAttributes = {}): IAttributes {
  const lowerThreshold = (random(0, 100) / 100);
  const upperThreshold = (random(lowerThreshold * 100, 100) / 100);

  return {
    tagId: faker.random.number(),
    action: sample(MODERATION_RULE_ACTION_TYPES),
    lowerThreshold,
    upperThreshold,
    ...data,
  };
}

export async function createModerationRule(data?: object): Promise<ModerationRule> {
  return ModerationRule.create(getModerationRuleData(data));
}

// Tags

export function getTagData(data: IAttributes = {}): IAttributes {
  const tagLabel = faker.lorem.words(2);
  const tagKey = underscored(tagLabel);

  return {
    key: tagKey,
    label: tagLabel,
    ...data,
  };
}

export async function createTag(data?: object): Promise<Tag> {
  return Tag.create(getTagData(data));
}
