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

import * as Joi from 'joi';

export const articleUpdateSchema = Joi.object({
  attributes: Joi.object().keys({
    categoryId: Joi.string().optional(),
    title: Joi.string().optional(),
    text: Joi.string().optional(),
    url: Joi.string().optional(),
    extra: Joi.object().optional(),
  }).required(),
});

export const articleSchema = Joi.object({
  sourceId: Joi.string().required(),
  categoryId: Joi.string().required(),
  title: Joi.string().required(),
  text: Joi.string().required(),
  url: Joi.string().optional(),
  createdAt: Joi.string().isoDate().required(),
  extra: Joi.object().optional(),
});

export const commentSchema = Joi.object({
  sourceId: Joi.string().required(),
  articleId: Joi.string().required(),
  replyToSourceId: Joi.string().optional(),
  authorSourceId: Joi.string().required(),
  text: Joi.string().required(),
  author: Joi.object().keys({
    email: Joi.string().optional(),
    location: Joi.string().optional(),
    name: Joi.string().required(),
    avatar: Joi.string().optional(),
  }).unknown().required(),
  createdAt: Joi.string().isoDate().required(),
  extra: Joi.object().optional(),
});

export const tagSchema = Joi.object({
  type: Joi.string().valid(['recommendation', 'flag']).required(),
  sourceUserId: Joi.string().required(),
  sourceCommentId: Joi.string().required(),
  extra: Joi.object().optional(),
});

export const revokeTagSchema = Joi.object({
  type: Joi.string().valid(['recommendation', 'flag']).required(),
  sourceUserId: Joi.string().required(),
  sourceCommentId: Joi.string().required(),
});
