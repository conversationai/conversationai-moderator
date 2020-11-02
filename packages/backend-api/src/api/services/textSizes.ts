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

import * as express from 'express';
import * as Joi from 'joi';
import { Op } from 'sequelize';

import { CommentSize } from '../../models';
import { validateAndSendResponse, validateRequest } from '../util/validation';

const validateTextSizesRequest = validateRequest(Joi.object({
  data: Joi.array().items(Joi.string()).required(),
}));

interface ITextSizesResponse {
  [key: string]: number;
}

const validateTextSizesAndSendResponse = validateAndSendResponse<ITextSizesResponse>(
  Joi.object({
    arg: Joi.string(),
    value: Joi.number(),
  }).unknown().required(),
);

export function createTextSizesService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.post('/',
    validateTextSizesRequest,
    async ({ body: { data }, query: { width } }, res, next) => {
      try {
        const widthNum = parseInt(width, 10);

        if (isNaN(widthNum)) {
          res.status(422).json({ status: 'error', errors: [`width query string param must be a number, got ${width}`] });

          return;
        }

        const commentSizes = await CommentSize.findAll({
          where: {
            commentId: {
              [Op.in]: data,
            },
            width: widthNum,
          },
        });

        // Default all values to 60, the average height.
        // This is in case a comment has not yet been cached.
        const defaultData: ITextSizesResponse = data.reduce((sum: any, commentId: number) => {
          sum[commentId] = 60;

          return sum;
        }, {});

        const sizingData = commentSizes.reduce((sum, commentSize: CommentSize) => {
          sum[commentSize.commentId.toString()] = commentSize.height;

          return sum;
        }, defaultData);

        validateTextSizesAndSendResponse(sizingData, res, next);
      } catch (e) {
        next(e);
      }
    },
  );

  return router;
}
