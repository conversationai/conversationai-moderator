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

const { Canvas } = require('canvas');

import {
  Article,
  Category,
  sequelize as sequelizeInstance,
  Tag,
} from '@conversationai/moderator-backend-core';
import { DotChartRenderer, groupByDateColumns, groupByScoreColumns } from '@conversationai/moderator-frontend-web';

import * as JSONAPI from '../../jsonapi';
import { sort } from '../../util/SequelizeHandler';

export interface ICommentScoredOrDated {
  commentId: number;
}

export interface ICommentScored extends ICommentScoredOrDated {
  score: number;
}

export interface ICommentDated extends ICommentScoredOrDated {
  date: string;
}

export async function sortComments(data: Array<ICommentScored>, sortQuery?: string): Promise<Array<ICommentScored>>;
export async function sortComments(data: Array<ICommentDated>, sortQuery?: string): Promise<Array<ICommentDated>>;
export async function sortComments<T extends ICommentScoredOrDated>(data: Array<T>, sortQuery?: string): Promise<Array<T>> {
  if ((sortQuery === 'score') || (sortQuery === '-score')) {
    // Any here, because the above check already proves its a ICommentScored
    let sortedByScore = data.sort((a: any, b: any) => a.score - b.score);

    if (sortQuery === '-score') {
      sortedByScore = sortedByScore.reverse();
    }

    return sortedByScore;
  }

  if (!sortQuery) {
    return data;
  }

  const sortedIds = await sort(
    'comments',
    data.map((d) => d.commentId),
    sortQuery.split(','),
  );

  return data.sort((a, b) => {
    return sortedIds.indexOf(a.commentId) - sortedIds.indexOf(b.commentId);
  });
}

/**
 * Get the max score for each comment across all categories given a tag.
 */
export async function getHistogramScoresForAllCategories(tagId: number): Promise<Array<ICommentScored>> {
  const tag = await Tag.findById(tagId);
  if (!tag) { throw new JSONAPI.NotFoundError(`Could not find tag ${tagId}`); }

  return sequelizeInstance.query(
    'SELECT comment_summary_scores.score AS score, comment_summary_scores.commentId ' +
    'FROM comments ' +
    'JOIN comment_summary_scores ON comment_summary_scores.commentId = comments.id ' +
    `AND comment_summary_scores.tagId = :tagId ` +
    'WHERE comments.isScored = true ' +
    'AND comments.isModerated = false ' +
    'ORDER BY score DESC',
    {
      replacements: {
        tagId,
      },
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get the max score for each comment across all categories.
 */
export async function getHistogramScoresForAllCategoriesByDate(): Promise<Array<ICommentDated>> {
  return sequelizeInstance.query(
    'SELECT comments.id as commentId, comments.sourceCreatedAt as date ' +
    'FROM comments ' +
    'WHERE comments.isModerated = false ',
    {
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get the max score for each comment in a category given a tag. If `categoryId` is the
 * string value "all", then this just calls `getHistogramScoresForAllCategories`.
 */
export async function getHistogramScoresForCategory(categoryId: number | 'all', tagId: number): Promise<Array<ICommentScored>> {
  if (categoryId === 'all') {
    return getHistogramScoresForAllCategories(tagId);
  }

  const category = await Category.findById(categoryId);
  if (!category) { throw new JSONAPI.NotFoundError(`Could not find category ${categoryId}`); }

  const tag = await Tag.findById(tagId);
  if (!tag) { throw new JSONAPI.NotFoundError(`Could not find tag ${tagId}`); }

  return sequelizeInstance.query(
    'SELECT comment_summary_scores.score AS score, comment_summary_scores.commentId ' +
    'FROM comments ' +
    'JOIN articles ON articles.id = comments.articleId ' +
    'JOIN comment_summary_scores ON comment_summary_scores.commentId = comments.id ' +
    `AND comment_summary_scores.tagId = :tagId ` +
    'WHERE articles.categoryId = :categoryId ' +
    'AND comments.isScored = true ' +
    'AND comments.isModerated = false ' +
    'ORDER BY score DESC',
    {
      replacements: {
        categoryId,
        tagId,
      },
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get the max score for each comment in a category. If `categoryId` is the
 * string value "all", then this just calls `getHistogramScoresForAllCategoriesByDate`.
 */
export async function getHistogramScoresForCategoryByDate(categoryId: number | 'all'): Promise<Array<ICommentDated>> {
  if (categoryId === 'all') {
    return getHistogramScoresForAllCategoriesByDate();
  }

  const category = await Category.findById(categoryId);
  if (!category) { throw new JSONAPI.NotFoundError(`Could not find category ${categoryId}`); }

  return sequelizeInstance.query(
    'SELECT comments.id as commentId, comments.sourceCreatedAt as date ' +
    'FROM comments ' +
    'JOIN articles ON articles.id = comments.articleId ' +
    'WHERE articles.categoryId = :categoryId ' +
    'AND comments.isModerated = false ',
    {
      replacements: {
        categoryId,
      },
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get comment ids across all categories.
 */
export async function getAllCommentsForAllCategories(): Promise<Array<ICommentScored>> {
  return sequelizeInstance.query(
    'SELECT NULL AS score, comments.id AS commentId ' +
    'FROM comments',
    {
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get all comments for a category.
 */
export async function getAllCommentsForCategory(categoryId: number | 'all'): Promise<Array<ICommentScored>> {
  if (categoryId === 'all') {
    return getAllCommentsForAllCategories();
  }

  const category = await Category.findById(categoryId);
  if (!category) { throw new JSONAPI.NotFoundError(`Could not find category ${categoryId}`); }

  return sequelizeInstance.query(
    'SELECT NULL AS score, comments.id AS commentId ' +
    'FROM comments ' +
    'JOIN articles ON articles.id = comments.articleId ' +
    'WHERE articles.categoryId = :categoryId',
    {
      replacements: {
        categoryId,
      },
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get the max score for each comment in an article given a tag.
 */
export async function getHistogramScoresForArticle(articleId: number, tagId: number): Promise<Array<ICommentScored>> {
  const article = await Article.findById(articleId);
  if (!article) { throw new JSONAPI.NotFoundError(`Could not find article ${articleId}`); }

  const tag = await Tag.findById(tagId);
  if (!tag) { throw new JSONAPI.NotFoundError(`Could not find tag ${tagId}`); }

  return sequelizeInstance.query(
    'SELECT comment_summary_scores.score AS score, comment_summary_scores.commentId ' +
    'FROM comments ' +
    'JOIN comment_summary_scores ON comment_summary_scores.commentId = comments.id ' +
    `AND comment_summary_scores.tagId = :tagId ` +
    'WHERE comments.articleId = :articleId ' +
    'AND comments.isScored = true ' +
    'AND comments.isModerated = false ' +
    'ORDER BY score DESC',
    {
      replacements: {
        articleId,
        tagId,
      },
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get the max score for each comment in an article, regardless of state or tag.
 */
export async function getHistogramScoresForArticleByDate(articleId: number): Promise<Array<ICommentDated>> {
  const article = await Article.findById(articleId);
  if (!article) { throw new JSONAPI.NotFoundError(`Could not find article ${articleId}`); }

  return sequelizeInstance.query(
    'SELECT comments.id as commentId, comments.sourceCreatedAt as date ' +
    'FROM comments ' +
    'WHERE comments.articleId = :articleId ' +
    'AND comments.isModerated = false ',
    {
      replacements: {
        articleId,
      },
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get all comment ids that are in an article.
 */
export async function getAllCommentsForArticle(articleId: number): Promise<Array<ICommentScored>> {
  const article = await Article.findById(articleId);
  if (!article) { throw new JSONAPI.NotFoundError(`Could not find article ${articleId}`); }

  return sequelizeInstance.query(
    'SELECT NULL AS score, comments.id AS commentId ' +
    'FROM comments ' +
    'WHERE comments.articleId = :articleId',
    {
      replacements: {
        articleId,
      },
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get the max summary score for each comment in an article, regardless of state or tag.
 */
export async function getMaxSummaryScoreForArticle(articleId: number): Promise<Array<ICommentScored>> {
  const article = await Article.findById(articleId);
  if (!article) { throw new JSONAPI.NotFoundError(`Could not find article ${articleId}`); }

  return sequelizeInstance.query(
    'SELECT comments.id as commentId, comments.maxSummaryScore as score ' +
    'FROM comments ' +
    'WHERE comments.articleId = :articleId ' +
    'AND comments.isScored = true ' +
    'AND comments.isModerated = false ' +
    'AND comments.maxSummaryScore IS NOT NULL',
    {
      replacements: {
        articleId,
      },
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get the max score for each comment across all categories given a tag.
 */
export async function getMaxHistogramScoresForAllCategories(): Promise<Array<ICommentScored>> {

  return sequelizeInstance.query(
    'SELECT comments.id as commentId, comments.maxSummaryScore as score ' +
    'FROM comments ' +
    'WHERE comments.isScored = true ' +
    'AND comments.isModerated = false ' +
    'AND comments.maxSummaryScore IS NOT NULL ' +
    'ORDER BY score DESC',
    {
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

/**
 * Get the max score for each comment in a category given a tag. If `categoryId` is the
 * string value "all", then this just calls `getHistogramScoresForAllCategories`.
 */
export async function getMaxSummaryScoreForCategory(categoryId: number | 'all'): Promise<Array<ICommentScored>> {
  if (categoryId === 'all') {
    return getMaxHistogramScoresForAllCategories();
  }

  const category = await Category.findById(categoryId);
  if (!category) { throw new JSONAPI.NotFoundError(`Could not find category ${categoryId}`); }

  return sequelizeInstance.query(
    'SELECT comments.id as commentId, comments.maxSummaryScore as score ' +
    'FROM comments ' +
    'JOIN articles ON articles.id = comments.articleId ' +
    'WHERE articles.categoryId = :categoryId ' +
    'AND comments.isScored = true ' +
    'AND comments.isModerated = false ' +
    'AND comments.maxSummaryScore IS NOT NULL ' +
    'ORDER BY score DESC',
    {
      replacements: {
        categoryId,
      },
      type: sequelizeInstance.QueryTypes.SELECT,
    },
  );
}

const DEFAULT_IMAGE_WIDTH = 400;
const DEFAULT_IMAGE_HEIGHT = 200;
const DEFAULT_COLUMN_COUNT = 100;

export function renderScoresToPNG(
  scores: Array<any>,
  groupBy: 'date' | 'score',
  width?: number,
  height?: number,
  columnCount?: number,
  showAll?: boolean,
) {
  const w = width || DEFAULT_IMAGE_WIDTH;
  const h = height || DEFAULT_IMAGE_HEIGHT;
  const colCount = columnCount || DEFAULT_COLUMN_COUNT;

  const commentsByColumn = groupBy === 'date'
      ? groupByDateColumns(scores, colCount)
      : groupByScoreColumns(scores, colCount);

  const canvas = new Canvas(w, h);

  const renderer = new DotChartRenderer(
    (canvasWidth, canvasHeight) => new Canvas(canvasWidth, canvasHeight),
  );

  renderer.setProps({
    canvas,
    commentsByColumn,
    width: w,
    height: h,
    columnCount: colCount,
    selectedRangeStart: 0,
    selectedRangeEnd: 1,
    showAll,
  });

  return canvas;
}
