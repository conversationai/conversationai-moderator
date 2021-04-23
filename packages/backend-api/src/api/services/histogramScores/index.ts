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

import {SUMMARY_SCORE_TAG} from '../../../models';
import { validateAndSendResponse } from '../../util/validation';
import {
  getHistogramScoresForArticle,
  getHistogramScoresForArticleByDate,
  getHistogramScoresForCategory,
  getHistogramScoresForCategoryByDate,
  getMaxSummaryScoreForArticle,
  getMaxSummaryScoreForCategory,
  ICommentDated,
  ICommentScored, NotFoundError,
  renderScoresToPNG,
  sortComments,
} from './util';

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
      date: Joi.date().required(),
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

    const parsedWidth = width ? parseInt(width as string, 10) : undefined;
    const parsedHeight = height ? parseInt(height as string, 10) : undefined;
    const parsedColumnCount = columnCount ? parseInt(columnCount as string, 10) : undefined;
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
    if (e instanceof NotFoundError) {
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
      const categoryId = id === 'all' ? id : parseInt(id, 10);
      const data = await getHistogramScoresForCategoryByDate(categoryId);
      const sortedData = await sortComments(data, sort as string);

      validateDatedCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  router.get('/categories/:id/byDate/chart', async (req, res, next) => {
    return scoresToChart('date', () => {
      const { params: { id }} = req;
      const categoryId = id === 'all' ? id : parseInt(id, 10);
      return getHistogramScoresForCategoryByDate(categoryId);
    }, req, res, next);
  });

  router.get('/categories/:id/tags/:tagId', async ({ params: { id, tagId }, query: { sort }}, res, next) => {
    try {
      const categoryId = id === 'all' ? id : parseInt(id, 10);
      const tagIdNumber = parseInt(tagId, 10);
      const data = await getHistogramScoresForCategory(categoryId, tagIdNumber);
      const sortedData = await sortComments(data, sort as string);

      validateScoredCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  router.get('/categories/:id/summaryScore', async ({ params: { id }, query: { sort }}, res, next) => {
    try {
      const categoryId = id === 'all' ? id : parseInt(id, 10);
      const data = await getMaxSummaryScoreForCategory(categoryId);
      const sortedData = await sortComments(data, sort as string);

      validateScoredCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  router.get('/categories/:id/tags/:tagId/chart', async (req, res, next) => {
    return scoresToChart('score', () => {
      const { params: { id, tagId }} = req;
      const categoryId = id === 'all' ? id : parseInt(id, 10);
      if (tagId === SUMMARY_SCORE_TAG) {
        return getMaxSummaryScoreForCategory(categoryId);
      }

      const tagIdNumber = parseInt(tagId, 10);
      return getHistogramScoresForCategory(categoryId, tagIdNumber);

    }, req, res, next);
  });

  router.get('/articles/:id/byDate', async ({ params: { id }, query: { sort }}, res, next) => {
    try {
      const data = await getHistogramScoresForArticleByDate(parseInt(id, 10));
      const sortedData = await sortComments(data, sort as string);

      validateDatedCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  router.get('/articles/:id/byDate/chart', async (req, res, next) => {
    return scoresToChart('date', () => {
      const { params: { id } } = req;

      return getHistogramScoresForArticleByDate(parseInt(id, 10));
    }, req, res, next);
  });

  router.get('/articles/:id/tags/:tagId', async ({ params, query}, res, next) => {
    const { id, tagId } = params;
    const sort = query.sort as string;
    const tagIdNumber = parseInt(tagId, 10);

    try {
      const data = await getHistogramScoresForArticle(parseInt(id, 10), tagIdNumber);
      const sortedData = await sortComments(data, sort);

      validateScoredCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  router.get('/articles/:id/tags/:tagId/chart', async (req, res, next) => {
    return scoresToChart('score', () => {
      const { params: { id, tagId } } = req;
      const articleId = parseInt(id, 10);
      if (tagId === SUMMARY_SCORE_TAG) {
        return getMaxSummaryScoreForArticle(articleId);
      }

      if (tagId === 'DATE') {
        return getHistogramScoresForArticleByDate(articleId);
      }

      const tagIdNumber = parseInt(tagId, 10);
      return getHistogramScoresForArticle(articleId, tagIdNumber);
    }, req, res, next);
  });

  router.get('/articles/:id/summaryScore', async ({ params, query}, res, next) => {
    try {
      const { id } = params;
      const sort = query.sort as string;
      const data = await getMaxSummaryScoreForArticle(parseInt(id, 10));
      const sortedData = await sortComments(data, sort);

      validateScoredCommentsAndSendResponse(stringifyIds(sortedData), res, next);
    } catch (e) {
      if (e instanceof NotFoundError) {
        res.status(404).send(e.message);
        next();
      } else {
        next(e);
      }
    }
  });

  return router;
}
