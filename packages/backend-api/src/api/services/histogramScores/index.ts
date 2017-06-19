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
import { validateAndSendResponse } from '../../util/validation';

import {
  getHistogramScoresForArticle,
  getHistogramScoresForArticleByDate,
  getHistogramScoresForCategory,
  getHistogramScoresForCategoryByDate,
  getMaxSummaryScoreForArticle,
  getMaxSummaryScoreForCategory,
  ICommentDated,
  ICommentScored,
  renderScoresToPNG,
  sortComments,
} from '../../../api/services/histogramScores/util';

export interface ICommentScoredOrDatedWithStringId {
  commentId: string;
}

export interface ICommentScoredWithStringId extends ICommentScoredOrDatedWithStringId {
  score: number;
}

export interface ICommentDatedWithStringId extends ICommentScoredOrDatedWithStringId {
  date: string;
}

const validateScoredCommentsAndSendResponse = validateAndSendResponse<Array<ICommentScoredWithStringId>>(
  Joi.array().items(
    Joi.object().keys({
      commentId: Joi.string().required(),
      score: Joi.number().required(),
    }),
  ),
);

const validateDatedCommentsAndSendResponse = validateAndSendResponse<Array<ICommentDatedWithStringId>>(
  Joi.array().items(
    Joi.object().keys({
      commentId: Joi.string().required(),
      date: Joi.string().isoDate().required(),
    }),
  ),
);

function stringifyIds(arr: Array<ICommentScored>): Array<ICommentScoredWithStringId>;
function stringifyIds(arr: Array<ICommentDated>): Array<ICommentDatedWithStringId>;
function stringifyIds(arr: Array<any>): Array<any> {
  return arr.map((a) => {
    return Object.assign({}, a, {
      commentId: a.commentId.toString(),
    });
  });
}

async function scoresToChart(
  groupBy: 'date' | 'score',
  getter: () => Promise<Array<any>>,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  try {
    const data = await getter();

    const { query: { width, height, columnCount, showAll } } = req;

    const parsedWidth = width ? parseInt(width, 10) : undefined;
    const parsedHeight = height ? parseInt(height, 10) : undefined;
    const parsedColumnCount = columnCount ? parseInt(columnCount, 10) : undefined;
    const parsedShowAll = showAll ? (showAll === 'true') : false;

    res.setHeader('Content-Type', 'image/png');
    renderScoresToPNG(
      data,
      groupBy,
      parsedWidth,
      parsedHeight,
      parsedColumnCount,
      parsedShowAll,
    ).pngStream().pipe(res);
  } catch (e) {
    if (e instanceof JSONAPI.NotFoundError) {
      res.status(404).send(e.message);
      next();
    } else {
      next(e);
    }
  }
}

export function createHistogramScoresService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.get('/categories/:id/byDate', async ({ params: { id }, query: { sort }}, res, next) => {
    try {
      const data = await getHistogramScoresForCategoryByDate(id);
      const sortedData = await sortComments(data, sort);

      validateDatedCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof JSONAPI.NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  router.get('/categories/:id/byDate/chart', async (req, res, next) => {
    scoresToChart('date', () => {
      const { params: { id }} = req;

      return getHistogramScoresForCategoryByDate(id);
    }, req, res, next);
  });

  router.get('/categories/:id/tags/:tagId', async ({ params: { id, tagId }, query: { sort }}, res, next) => {
    try {
      const tagIdNumber = parseInt(tagId, 10);
      const data = await getHistogramScoresForCategory(id, tagIdNumber);
      const sortedData = await sortComments(data, sort);

      validateScoredCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof JSONAPI.NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  router.get('/categories/:id/summaryScore', async ({ params: { id }, query: { sort }}, res, next) => {
    try {
      const data = await getMaxSummaryScoreForCategory(id);
      const sortedData = await sortComments(data, sort);

      validateScoredCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof JSONAPI.NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  router.get('/categories/:id/tags/:tagId/chart', async (req, res, next) => {
    scoresToChart('score', () => {
      const { params: { id, tagId }} = req;

      if (tagId === 'SUMMARY_SCORE') {
        return getMaxSummaryScoreForCategory(id);
      }

      const tagIdNumber = parseInt(tagId, 10);

      return getHistogramScoresForCategory(id, tagIdNumber);

    }, req, res, next);
  });

  router.get('/articles/:id/byDate', async ({ params: { id }, query: { sort }}, res, next) => {
    try {
      const data = await getHistogramScoresForArticleByDate(id);
      const sortedData = await sortComments(data, sort);

      validateDatedCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof JSONAPI.NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  router.get('/articles/:id/byDate/chart', async (req, res, next) => {
    scoresToChart('date', () => {
      const { params: { id } } = req;

      return getHistogramScoresForArticleByDate(id);
    }, req, res, next);
  });

  router.get('/articles/:id/tags/:tagId', async ({ params: { id, tagId }, query: { sort }}, res, next) => {
    const tagIdNumber = parseInt(tagId, 10);

    try {
      const data = await getHistogramScoresForArticle(id, tagIdNumber);
      const sortedData = await sortComments(data, sort);

      validateScoredCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof JSONAPI.NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  router.get('/articles/:id/tags/:tagId/chart', async (req, res, next) => {
    scoresToChart('score', () => {
      const { params: { id, tagId } } = req;
      if (tagId === 'SUMMARY_SCORE') {
        return getMaxSummaryScoreForArticle(id);
      }

      if (tagId === 'DATE') {
        return getHistogramScoresForArticleByDate(id);
      }

      const tagIdNumber = parseInt(tagId, 10);

      return getHistogramScoresForArticle(id, tagIdNumber);
    }, req, res, next);
  });

  router.get('/articles/:id/summaryScore', async ({ params: { id }, query: { sort }}, res, next) => {
    try {
      const data = await getMaxSummaryScoreForArticle(id);
      const sortedData = await sortComments(data, sort);

      validateScoredCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof JSONAPI.NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  return router;
}
