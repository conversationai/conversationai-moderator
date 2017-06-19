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

import { Comment } from '@conversationai/moderator-backend-core';
import * as Bluebird from 'bluebird';
import * as express from 'express';
import * as Joi from 'joi';
import { validateAndSendResponse, validateRequest } from '../util/validation';

const validateInput = validateRequest(Joi.object({
  data: Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string(),
  ).required(),
}));

const validateOutputAndSendResponse = validateAndSendResponse(
  Joi.object({
    arg: Joi.string(),
    value: Joi.object({
      approvedCount: Joi.number().required(),
      rejectedCount: Joi.number().required(),
    }),
  }).unknown().required(),
);

export interface IAuthorCounts {
  approvedCount: number;
  rejectedCount: number;
}

export async function getAuthorCounts(authorSourceId: string): Promise<IAuthorCounts> {
  const [approvedCount, rejectedCount] = await Promise.all([

    // approved
    Comment.count({ where: { authorSourceId, isAccepted: true } }),

    // rejected
    Comment.count({ where: { authorSourceId, isAccepted: false } }),

  ]);

  return {
    approvedCount,
    rejectedCount,
  };
}

export function createAuthorCountsService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.post(
    '/',
    validateInput,
    async ({ body }, res, next) => {
      const dataArray = Array.isArray(body.data) ? body.data : [body.data];

      const data = await Bluebird.mapSeries(dataArray, getAuthorCounts);

      const lookup = dataArray.reduce((sum: any, authorId: string, i: number) => {
        sum[authorId] = data[i];

        return sum;
      }, {});

      validateOutputAndSendResponse(lookup, res, next);
    },
  );

  return router;
}
