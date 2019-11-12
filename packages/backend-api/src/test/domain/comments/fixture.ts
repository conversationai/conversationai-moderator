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
  IArticleAttributes,
  IArticleInstance,
  ICategoryAttributes,
  ICategoryInstance,
  ICommentAttributes,
  ICommentInstance,
  ICommentScoreAttributes,
  ICommentScoreInstance,
  ICommentScoreRequestAttributes,
  ICommentScoreRequestInstance,
  ICommentSummaryScoreAttributes,
  ICommentSummaryScoreInstance,
  IModerationRuleAttributes,
  IModerationRuleInstance,
  ITagAttributes,
  ITagInstance,
  IUserAttributes,
  IUserInstance,
} from '../../../models';
import {
  ENDPOINT_TYPE_PROXY,
  MODERATION_RULE_ACTION_TYPES,
  SCORE_SOURCE_TYPES,
  USER_GROUP_MODERATOR,
  USER_GROUP_SERVICE,
} from '../../../models';
import { sequelize } from '../../../sequelize';

// Category
export function getCategoryData(data: Partial<ICategoryAttributes> = {}): ICategoryAttributes {
  return {
    label: faker.lorem.words(1),
    ...RESET_COUNTS,
    ...data,
  };
}

export async function createCategory(obj: Partial<ICategoryAttributes> = {}): Promise<ICategoryInstance> {
  return await Category.create(getCategoryData(obj));
}

// Articles
export function getArticleData(data: Partial<IArticleAttributes> = {}): IArticleAttributes {
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

export async function createArticle(obj: Partial<IArticleAttributes> = {}): Promise<IArticleInstance> {
  return await Article.create(getArticleData(obj));
}

export function getCommentData(data: Partial<ICommentAttributes> = {}): ICommentAttributes {
  return {
    sourceId: faker.random.uuid(),
    authorSourceId: faker.random.uuid(),
    text: faker.lorem.words(20),
    author: {},
    sourceCreatedAt: sequelize.fn('now'),
    ...data,
  } as ICommentAttributes;
}

export async function createComment(data?: any): Promise<ICommentInstance> {
  return await Comment.create(getCommentData(data));
}

// Comment score requests

export function getCommentScoreRequestData(data: Partial<ICommentScoreRequestAttributes> = {}): ICommentScoreRequestAttributes {
  return {
    commentId: faker.random.number(),
    userId: faker.random.number(),
    sentAt: sequelize.fn('now'),

    ...data,
  };
}

export async function createCommentScoreRequest(data?: object): Promise<ICommentScoreRequestInstance> {
  return await CommentScoreRequest.create(getCommentScoreRequestData(data));
}

// Users

export async function createUser(data: Partial<IUserAttributes> = {}): Promise<IUserInstance> {
  return await User.create({
    group: 'general',
    email: faker.internet.email(),
    name: faker.name.firstName(),
    isActive: true,
    ...data,
  });
}

export async function createServiceUser(data: Partial<IUserAttributes> = {}): Promise<IUserInstance> {
  return await User.create({
    group: USER_GROUP_SERVICE,
    name: faker.name.firstName(),
    isActive: true,
    ...data,
  });
}

export async function createModeratorUser(data: Partial<IUserAttributes> = {}): Promise<IUserInstance> {
  return await User.create({
    group: USER_GROUP_MODERATOR,
    name: faker.name.firstName(),
    isActive: true,
    extra: {
      endpointType: ENDPOINT_TYPE_PROXY,
      endpoint: 'http://www.google.com',
    },
    ...data,
  });
}

// Comment scores

export function getCommentScoreData(data: Partial<ICommentScoreAttributes> = {}): ICommentScoreAttributes {
  return {
    commentId: faker.random.number(),
    tagId: faker.random.number(),
    sourceType: sample(SCORE_SOURCE_TYPES),
    score: (random(0, 100) / 100),
    ...data,
    // TODO(ldixon): fix typehack.
  } as any;
}

export async function createCommentScore(data?: object): Promise<ICommentScoreInstance> {
  return await CommentScore.create(getCommentScoreData(data));
}

// Comment summary scores

export function getCommentSummaryScoreData(data: Partial<ICommentSummaryScoreAttributes> = {}): ICommentSummaryScoreAttributes {
  return {
    commentId: faker.random.number(),
    tagId: faker.random.number(),
    score: (random(0, 100) / 100),
    ...data,
  };
}

export async function createCommentSummaryScore(data?: object): Promise<ICommentSummaryScoreInstance> {
  return await CommentSummaryScore.create(getCommentSummaryScoreData(data));
}

// Moderation rules

export function getModerationRuleData(data: Partial<IModerationRuleAttributes> = {}): IModerationRuleAttributes {
  const lowerThreshold = (random(0, 100) / 100);
  const upperThreshold = (random(lowerThreshold * 100, 100) / 100);

  return {
    tagId: faker.random.number(),
    action: sample(MODERATION_RULE_ACTION_TYPES),
    lowerThreshold,
    upperThreshold,
    ...data,
    // TODO(ldixon): fix typehack.
  } as any;
}

export async function createModerationRule(data?: object): Promise<IModerationRuleInstance> {
  return await ModerationRule.create(getModerationRuleData(data));
}

// Tags

export function getTagData(data: Partial<ITagAttributes> = {}): ITagAttributes {
  const tagLabel = faker.lorem.words(2);
  const tagKey = underscored(tagLabel);

  return {
    key: tagKey,
    label: tagLabel,
    ...data,
  };
}

export async function createTag(data?: object): Promise<ITagInstance> {
  return await Tag.create(getTagData(data));
}
