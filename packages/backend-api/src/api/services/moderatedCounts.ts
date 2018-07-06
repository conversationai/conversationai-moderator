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

import { Article, Category, Comment } from '@conversationai/moderator-backend-core';
import * as express from 'express';
import * as Joi from 'joi';
import { mapValues } from 'lodash';
import { sort } from '../util/SequelizeHandler';
import { validateAndSendResponse } from '../util/validation';

interface IModeratedCounts {
  approved: Array<number>;
  highlighted: Array<number>;
  rejected: Array<number>;
  deferred: Array<number>;
  flagged: Array<number>;
  recommended: Array<number>;
  batched: Array<number>;
  automated: Array<number>;
}

interface IModeratedCountsAsStrings {
  approved: Array<string>;
  highlighted: Array<string>;
  rejected: Array<string>;
  deferred: Array<string>;
  flagged: Array<string>;
  recommended: Array<string>;
  batched: Array<string>;
  automated: Array<string>;
}

const validateCountsAndSendResponse = validateAndSendResponse<IModeratedCountsAsStrings>(
  Joi.object({
    approved: Joi.array().items(Joi.string()).required(),
    highlighted: Joi.array().items(Joi.string()).required(),
    rejected: Joi.array().items(Joi.string()).required(),
    deferred: Joi.array().items(Joi.string()).required(),
    flagged: Joi.array().items(Joi.string()).required(),
    recommended: Joi.array().items(Joi.string()).required(),
    batched: Joi.array().items(Joi.string()).required(),
    automated: Joi.array().items(Joi.string()).required(),
  }).required(),
);

async function getModeratedCounts(model: any, sortQuery: string, getWhere: (model: any, params: any) => Promise<any>): Promise<IModeratedCounts> {
  const results = await Promise.all([
    // approved
    getWhere(model, { isModerated: true, isAccepted: true }),

    // highlighted
    getWhere(model, { isModerated: true, isHighlighted: true }),

    // rejected
    getWhere(model, { isModerated: true, isAccepted: false }),

    // deferred
    getWhere(model, { isModerated: true, isDeferred: true }),

    // flagged
    getWhere(model, { isModerated: true, flaggedCount: { $gt: 0 } }),

    // recommended
    getWhere(model, { isModerated: true, recommendedCount: { $gt: 0 } }),

    // batched
    getWhere(model, { isModerated: true, isBatchResolved: true }),

    // automated
    getWhere(model, { isModerated: true, isAutoResolved: true }),
  ]);

  const output = [];

  for (const r of results) {
    const ids = r.map((c: any) => c.id);

    if (sortQuery) {
      const sortedIds = await sort(
        'comments',
        ids,
        sortQuery.split(','),
      );

      output.push(sortedIds);
    } else {
      output.push(ids);
    }
  }

  return {
    approved: output[0],
    highlighted: output[1],
    rejected: output[2],
    deferred: output[3],
    flagged: output[4],
    recommended: output[5],
    batched: output[6],
    automated: output[7],
  };
}

export function createModeratedCountsService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.get('/articles/:id', async ({ params: { id }, query: { sort }}, res, next) => {
    let model;

    try {
      model = await Article.findById(id);
    } catch (e) {
      return Promise.reject({ error: 404 });
    }

    const data = await getModeratedCounts(model, sort, (article, where) => {
      return article.getComments({
        where,
        attributes: ['id'],
      });
    });

    const countsOfStrings: IModeratedCountsAsStrings = mapValues(data, (ids) => {
      return ids.map((i: number) => i.toString());
    }) as any;

    validateCountsAndSendResponse(countsOfStrings, res, next);
  });

  router.get('/categories/:id', async ({ params: { id }, query: { sort }}, res, next) => {
    let data;

    if (id !== 'all') {
      let model;

      try {
        model = await Category.findById(id);
      } catch (e) {
        return Promise.reject({ error: 404 });
      }

      data = await getModeratedCounts(model, sort, async (_article, where) => {
        return await Comment.findAll({
          where,

          include: {
            model: Article,
            where: { categoryId: id },
            attributes: ['id'],
          } as any,

          attributes: ['id'],
        });
      });
    } else {
      data = await getModeratedCounts(null, sort, async (_, where) => {
        return await Comment.findAll({
          where,
          attributes: ['id'],
        });
      });
    }

    const countsOfStrings: IModeratedCountsAsStrings = mapValues(data, (ids) => {
      return ids.map((i: number) => i.toString());
    }) as any;

    validateCountsAndSendResponse(countsOfStrings, res, next);
  });

  return router;
}
