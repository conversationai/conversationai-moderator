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
import { mapValues } from 'lodash';

import { Tag } from '../../models';
import { sequelize as sequelizeInstance } from '../../sequelize';
import * as JSONAPI from '../jsonapi';
import { filterTopScoresByTaggingSensitivity } from '../util/queryComments';
import { validateAndSendResponse, validateRequest } from '../util/validation';

const validateTopScoresRequest = validateRequest(Joi.object({
  data: Joi.array().items(Joi.string()).required(),
}));

const validateSummaryRequest = validateRequest(Joi.object({
  data: Joi.array().items(Joi.object().keys({
    commentId: Joi.string(),
    tagId: Joi.string(),
  })).required(),
}));

interface ITopScoreWithStringID {
  commentId: string;
  score: number;
}

interface ITopScoresWithStringIDs {
  [key: string]: ITopScoreWithStringID;
}

const validateTopScoresAndSendResponse = validateAndSendResponse<ITopScoresWithStringIDs>(
  Joi.object({
    arg: Joi.string(),
    value: Joi.object({
      approvedCount: Joi.number().required(),
      rejectedCount: Joi.number().required(),
    }),
  }).unknown().required(),
);

export function createTopScoresService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.post(
    '/tag/:tagId',
    validateTopScoresRequest,
    async (req, res, next) => {
      try {
        const { body, params } = req;
        const commentIds = body.data.map((s: any) => parseInt(s, 10));
        const { tagId } = params;

        const tagIdNumber = parseInt(tagId, 10);

        const tag = await Tag.findByPk(tagIdNumber);
        if (!tag) { throw new JSONAPI.NotFoundError(`Could not find tag ${tagId}`); }

        if (commentIds.length <= 0) {
          validateTopScoresAndSendResponse({}, res, next);

          return;
        }

        const results = await sequelizeInstance.query(
          'SELECT comment_scores.score AS score, comment_scores.annotationStart AS start, comment_scores.annotationEnd AS end, comments.id as commentId ' +
          'FROM comments ' +
          'JOIN comment_top_scores ON comment_top_scores.commentId = comments.id ' +
          'AND comment_top_scores.tagId = :tagId ' +
          'JOIN comment_scores ON comment_scores.id = comment_top_scores.commentScoreId ' +
          'WHERE comments.id IN (:commentIds) ',
          {
            replacements: {
              tagId,
              commentIds,
            },
            type: sequelizeInstance.QueryTypes.SELECT,
          },
        );

        const scores = (results as Array<any>).reduce((sum, { score, start, end, commentId }) => {
          sum[commentId] = { score, start, end, commentId };

          return sum;
        }, {});

        const topScores = await filterTopScoresByTaggingSensitivity(scores, tagIdNumber);

        const topScoresForStringIds: ITopScoresWithStringIDs = mapValues(topScores, (score) => {
          return Object.assign({}, score, {
            commentId: score.commentId.toString(),
          });
        }) as any;

        validateTopScoresAndSendResponse(topScoresForStringIds, res, next);
      } catch (e) {
        if (e instanceof JSONAPI.NotFoundError) {
          res.status(404).send(e.message);
          next();
        } else {
          next(e);
        }
      }
    },
  );

  router.post(
    '/summaryScores',
    validateSummaryRequest,
    async (req, res, next) => {
      try {
        const { body } = req;
        const summaryScores: Array<{
          commentId: number;
          tagId: number;
        }> = body.data.map((s: any) => ({
          commentId: parseInt(s.commentId, 10),
          tagId: parseInt(s.tagId, 10),
        }));

        if (summaryScores.length <= 0) {
          validateTopScoresAndSendResponse({}, res, next);
          next();

          return;
        }

        const commentIds = summaryScores.map((score) => score.commentId);

        const results = await sequelizeInstance.query(
          'SELECT comment_scores.score AS score, comment_scores.annotationStart AS start, ' +
          'comment_scores.annotationEnd AS end, comments.id as commentId ' +
          'FROM comments ' +
          'JOIN comment_top_scores ON comment_top_scores.commentId = comments.id ' +
          'AND comment_top_scores.tagId = comments.maxSummaryScoreTagId ' +
          'JOIN comment_scores ON comment_scores.id = comment_top_scores.commentScoreId ' +
          'WHERE comments.id IN (:commentIds) ',
          {
            replacements: {
              commentIds,
            },
            type: sequelizeInstance.QueryTypes.SELECT,
          },
        );

        const scores = (results as Array<any>).reduce((sum, { score, start, end, commentId }) => {
          sum[commentId] = { score, start, end, commentId };

          return sum;
        }, {});

        const topScores = await filterTopScoresByTaggingSensitivity(scores);

        const topScoresForStringIds: ITopScoresWithStringIDs = mapValues(topScores, (score) => {
          return Object.assign({}, score, {
            commentId: score.commentId.toString(),
          });
        }) as any;

        validateTopScoresAndSendResponse(topScoresForStringIds, res, next);
      } catch (e) {
        if (e instanceof JSONAPI.NotFoundError) {
          res.status(404).send(e.message);
          next();
        } else {
          next(e);
        }
      }
    },
  );

  return router;
}
