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

import * as JSONAPI from '@conversationai/moderator-jsonapi';
import * as express from 'express';
import * as Joi from 'joi';
import { handleQueryComments } from '../util/queryComments';
import { validateRequest } from '../util/validation';

const validateCommentsByIdRequest = validateRequest(Joi.object({
  data: Joi.array().items(Joi.string()).required(),
}));

export function createCommentsByIdService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.post(
    '/',
    validateCommentsByIdRequest,
    async (req, res, next) => {
      try {
        const { body } = req;
        const commentIds = body.data.map((s: any) => parseInt(s, 10));

        JSONAPI.handleGet(
          async (_: any, _paging: JSONAPI.IPagingParams, include: Array<string>, _filters: JSONAPI.IFilters, sort: Array<string>, fields: JSONAPI.IFields) => {
            return handleQueryComments(commentIds, include, sort, fields);
          },
          JSONAPI.renderListResults,
          () => `/services/commentsById`,
        )(req, res, next);
      } catch (e) {
        next(e);
      }
    },
  );

  return router;
}
