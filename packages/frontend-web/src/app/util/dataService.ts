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

import {
  INewResource,
  IParams,
} from '@conversationai/moderator-jsonapi/src/types';
import axios from 'axios';
import { fromJS, List, Map } from 'immutable';
import { isNaN, pick } from 'lodash';
import qs from 'qs';
import {
  CommentDatedModel,
  CommentScoredModel,
  IArticleModel,
  IAuthorCountsModel,
  ICommentDatedModel,
  ICommentModel,
  ICommentScoredModel,
  ICommentSummaryScoreModel,
} from '../../models';
import { ITopScore } from '../../types';
import { API_URL } from '../config';
import { convertArrayFromJSONAPI } from './makeRecordListReducer';
import { convertFromJSONAPI } from './makeSingleRecordReducer';

export type IValidModelNames =
    'articles' |
    'categories' |
    'comment_scores' |
    'comment_summary_scores' |
    'comments' |
    'moderation_rules' |
    'moderator_assignments' |
    'preselects' |
    'tagging_sensitivities' |
    'tags' |
    'users' |
    'user_category_assignments';

const VALID_MODEL_NAMES_LOOKUP: {
  [key: string]: boolean;
} = {
  articles: true,
  categories: true,
  comment_scores: true,
  comment_summary_scores: true,
  comments: true,
  moderation_rules: true,
  moderator_assignments: true,
  preselects: true,
  tagging_sensitivities: true,
  tags: true,
  users: true,
  user_category_assignments: true,
};

function validateModelName(name: string): void {
  if (!VALID_MODEL_NAMES_LOOKUP[name]) {
    throw new Error(`Tried to perform a task on a model named ${name} which wasn't in the list of valid values. Might be an attempted exploit.`);
  }
}

function validateID(id: any, valueName: string): void {
  // We allow articleIds to be non-numeric so they can be the same as the publisher's
  // upstream asset ids
  if (valueName == "articleId") {
    // a legal id contains only alphanumeric characters, hyphens or dashes
    if (/^[a-z0-9_\-]+$/i.test(id) == false) {
      throw new Error(`Invalid ${valueName} ${id}. Only alphanumeric characters, dashes and underscores are allowed in ${valueName}. Might be an attempted exploit.`)
    }

  // All other ids must be integers
  } else if (isNaN(parseInt(id, 10))) {
    throw new Error(`Invalid ${valueName} (${parseInt(id, 10)} typeof ${typeof id}) was not a number as expected. Might be an attempted exploit.`);
  }
}

export interface ISingleResponse<T> {
  model: T;
  response: any;
}

export interface IMultipleResponse<T> {
  models: List<T>;
  response: any;
}

/**
 * Convert Partial<IParams> type to a query string.
 */
function serializeParams(originalParams?: Partial<IParams> | null): string {
  if (!originalParams) { return ''; }

  // Clone to avoid mutability issues.
  const params = { ...originalParams } as any;

  if (originalParams.sort) {
    params.sort = originalParams.sort.join(',');
  }

  // Type calls it filters, JSONAPI calls it filter. :(
  params.filter = originalParams.filters;
  delete params.filters;

  // JSONAPI spec says "include" is comma separated.
  if (originalParams.include) {
    params.include = params.include.join(',');
  }

  return '?' + qs.stringify(params, { encode: false });
}

/**
 * Base REST API Path
 */
const REST_URL = `/rest`;

/**
 * Base Services API Path
 */
const SERVICES_URL = `/services`;

/**
 * The URL of a service.
 */
export function serviceURL(service: string, path?: string | null, params?: Partial<IParams>): string {
  return `${API_URL}${SERVICES_URL}/${service}${path ? path : ''}${serializeParams(params)}`;
}

/**
 * The URL of a model array listing.
 */
function listURL(type: IValidModelNames, params?: Partial<IParams>): string {
  validateModelName(type);

  return `${API_URL}${REST_URL}/${type}${serializeParams(params)}`;
}

/**
 * The URL of a single model result.
 */
function modelURL(type: IValidModelNames, id: string, params?: Partial<IParams>): string {
  validateModelName(type);

  return `${listURL(type)}/${id}${serializeParams(params)}`;

}

/**
 * The URL of a model relationship.
 */
export function relationURL(type: IValidModelNames, id: string, relationship: string, params?: Partial<IParams>): string {
  validateModelName(type);

  return `${API_URL}${REST_URL}/${type}/${parseInt(id, 10)}/relationships/${relationship}${serializeParams(params)}`;
}

/**
 * The URL of a model related.
 */
export function relatedURL(type: IValidModelNames, id: string, relationship: string, params?: Partial<IParams>): string {
  validateModelName(type);
  const parsedId = id !== 'all' ? parseInt(id, 10) : id;

  return `${API_URL}${REST_URL}/${type}/${parsedId}/${relationship}${serializeParams(params)}`;
}

/**
 * Create a new instance of a model.
 */
export async function createModel<T>(
  type: IValidModelNames,
  model: INewResource,
): Promise<ISingleResponse<T>> {
  validateModelName(type);

  const { data } = await axios.post(listURL(type), {
    data: {
      attributes: fromJS(model).delete('id').toJS(),
      type,
    },
  });

  return {
    model: convertFromJSONAPI<T>(data),
    response: data,
  };
}

export async function listTextSizesByIds(
  ids: Array<string>,
  width: number,
): Promise<Map<string, number>> {
  const response: any = await axios.post(
    serviceURL('textSizes', null, { width } as Partial<IParams>),
    { data: ids },
  );

  const data = response.data.data;

  return Object.keys(data).reduce((sum, key) => {
    return sum.set(key, data[key]);
  }, Map<string, number>());
}

export async function listHistogramScoresByArticle(
  articleId: string,
  tagId: string | 'DATE',
  sort: Array<string>,
): Promise<List<ICommentScoredModel>> {
  validateID(articleId, `articleId`);
  validateID(tagId, `tagId`);

  const response: any = await axios.get(
    serviceURL('histogramScores', `/articles/${articleId}/tags/${parseInt(tagId, 10)}`, { sort }),

  );

  return List(
    (response.data.data as Array<any>).map(CommentScoredModel),
  );
}

export async function listMaxSummaryScoreByArticle(
  articleId: string,
  sort: Array<string>,
): Promise<List<ICommentScoredModel>> {
  validateID(articleId, `articleId`);

  const response: any = await axios.get(
    serviceURL('histogramScores', `/articles/${articleId}/summaryScore`, { sort }),

  );

  return List(
    (response.data.data as Array<any>).map(CommentScoredModel),
  );
}

export async function listHistogramScoresByArticleByDate(
  articleId: string,
  sort: Array<string>,
): Promise<List<ICommentDatedModel>> {
  validateID(articleId, `articleId`);

  const response: any = await axios.get(
    serviceURL('histogramScores', `/articles/${articleId}/byDate`, { sort }),

  );

  return List(
    (response.data.data as Array<any>).map(({ date, commentId }) => CommentDatedModel({
      date: new Date(date),
      commentId,
    })),
  );
}

export async function listHistogramScoresByCategory(
  categoryId: string | 'all',
  tagId: string,
  sort: Array<string>,
): Promise<List<ICommentScoredModel>> {
  const parsedCategoryId = categoryId !== 'all' ? parseInt(categoryId, 10) : categoryId;

  if (categoryId !== 'all') {
    validateID(categoryId, `categoryId`);
  }

  validateID(tagId, `tagId`);

  const response: any = await axios.get(
    serviceURL('histogramScores', `/categories/${parsedCategoryId}/tags/${parseInt(tagId, 10)}`, { sort }),
  );

  return List(
    (response.data.data as Array<any>).map(CommentScoredModel),
  );
}

export async function listMaxHistogramScoresByCategory(
  categoryId: string | 'all',
  sort: Array<string>,
): Promise<List<ICommentScoredModel>> {
  if (categoryId !== 'all') {
    validateID(categoryId, `categoryId`);
  }
  const parsedCategoryId = categoryId !== 'all' ? parseInt(categoryId, 10) : categoryId;

  const response: any = await axios.get(
    serviceURL('histogramScores', `/categories/${parsedCategoryId}/summaryScore`, { sort }),
  );

  return List(
    (response.data.data as Array<any>).map(CommentScoredModel),
  );
}

export async function listHistogramScoresByCategoryByDate(
  categoryId: string | 'all',
  sort: Array<string>,
): Promise<List<ICommentDatedModel>> {
  if (categoryId !== 'all') {
    validateID(categoryId, `categoryId`);
  }
  const parsedCategoryId = categoryId !== 'all' ? parseInt(categoryId, 10) : categoryId;

  const response: any = await axios.get(
    serviceURL('histogramScores', `/categories/${parsedCategoryId}/byDate`, { sort }),
  );

  return List(
    (response.data.data as Array<any>).map(({ date, commentId }) => CommentDatedModel({
      date: new Date(date),
      commentId,
    })),
  );
}

export async function listCommentsById(
  commentIds: List<string>,
  params?: Partial<IParams>,
): Promise<List<ICommentModel>> {
  commentIds.forEach((commentId, index) => validateID(commentId, `comment Id ${index}`));

  const { data } = await axios.post(
    serviceURL(
      'commentsById',
      null,
      params,
    ),
    {
      data: commentIds.toArray(),
    },
  );

  return convertArrayFromJSONAPI<ICommentModel>(data);
}

export async function listCommentSummaryScoresById(
  commentId: string,
  params?: Partial<IParams>,
): Promise<List<ICommentSummaryScoreModel>> {
  validateID(commentId, `comment Id ${parseInt(commentId, 10)}`);
  const { data } = await axios.get(
    listURL(
      'comment_summary_scores',
      {
        ...params,
        page: { limit: -1 },
        filters: {
          commentId,
        },
      },
    ),
  );

  return convertArrayFromJSONAPI<ICommentSummaryScoreModel>(data);
}

export async function loadTopScoresForTag(
  commentIds: List<string>,
  tagId: string,
): Promise<Map<number, ITopScore>> {
  commentIds.forEach((commentId, index) => validateID(parseInt(commentId, 10), `comment Id ${index}`));
  validateID(tagId, `tagId`);

  const { data }: any = await axios.post(
    serviceURL(
      'topScores',
      `/tag/${parseInt(tagId, 10)}`,
    ),
    {
      data: commentIds.toArray(),
    },
  );

  const objectOfData = data.data;

  return Object.keys(objectOfData).reduce((sum, key) => {
    return sum.set(parseInt(key, 10), objectOfData[key]);
  }, Map<number, ITopScore>());
}

export async function loadTopScoresForSummaryScores(
  summaryScores: Array<{
    commentId: string,
  }>,
): Promise<Map<number, ITopScore>> {
  summaryScores.forEach((summaryScore, index) => {
    validateID(parseInt(summaryScore.commentId, 10), `comment Id ${index}`);
  });

  const { data }: any = await axios.post(
    serviceURL(
      'topScores',
      `/summaryScores`,
    ),
    {
      data: summaryScores,
    },
  );

  const objectOfData = data.data;

  return Object.keys(objectOfData).reduce((sum, key) => {
    return sum.set(parseInt(key, 10), objectOfData[key]);
  }, Map<number, ITopScore>());
}

/**
 * List (and filter) a model.
 */
export async function listModels<T>(
  type: IValidModelNames,
  params?: Partial<IParams>,
): Promise<IMultipleResponse<T>> {
  validateModelName(type);

  const { data } = await axios.get(listURL(type, params));

  return {
    models: convertArrayFromJSONAPI<T>(data),
    response: data,
  };
}

/**
 * Search comment models.
 */
export async function search(
  query: string,
  params?: Partial<IParams>,
): Promise<Array<string>> {
  const requestParams = {
    ...params,
    term: query,
  };

  const { data }: any = await axios.get(serviceURL('search', null, requestParams));

  return data.data;
}

/**
 * List (and filter) assigned articles for a user.
 */
export async function listAssignedArticles(
  userId: string,
  params?: Partial<IParams>,
): Promise<IMultipleResponse<IArticleModel>> {
  validateID(userId, `userId`);

  const { data } = await axios.get(
    serviceURL(
      'assignments',
      `/users/${parseInt(userId, 10)}`,
      params,
    ),
  );

  return {
    models: convertArrayFromJSONAPI<IArticleModel>(data),
    response: data,
  };
}

/**
 * Send updated comment text and rescore comment.
 */
export async function editAndRescoreComment(
  commentId: string,
  text: string,
  authorName: string,
  authorLocation: string,
  params?: Partial<IParams>,
): Promise<void> {

  await axios.patch(
    serviceURL(
      'editComment',
      null,
      params,
    ), {
    data: {
      commentId,
      text,
      authorName,
      authorLocation,
    },
  });
}

/**
 * Update article assignment when users are assigned to categories
 */
export async function updateCategoryAssignments(categoryId: string, userIds: Array<string>): Promise<void> {
  const url = serviceURL('assignments', `/categories/${parseInt(categoryId, 10)}`);
  await axios.post(url, { data: userIds });
}

/**
 * List deferred articles. Doing this in lieu of having an actual service that can return
 * a list of articles that contains at least 1 comment that is 'deferred'
 */
export async function listDeferredArticles(
  params?: Partial<IParams>,
): Promise<IMultipleResponse<IArticleModel>> {
  const requestParams = {
    filters: {
      comments: {
        isDeferred: true,
      },
    },

    ...params,
  };

  return listModels<IArticleModel>('articles', requestParams);
}

/**
 * Count the number of unmoderated comments currently assigned to a user.
 */
export async function countAssignedArticleComments(
  userId: string,
): Promise<number> {
  validateID(userId, `userId`);

  const { data }: any = await axios.get(
    serviceURL('assignments', `/users/${parseInt(userId, 10)}/count`),
  );

  return data.count;
}

/**
 * Count the number of deferred comments currently assigned to a user.
 */
export async function countDeferredArticleComments(): Promise<number> {
  const { data }: any = await axios.get(
    listURL(
      'comments',
      {
        filters: { isDeferred: true },
        page: { limit: 0, offset: 0 },
      },
    ),
  );

  return data.meta.page.total;
}

export interface IModeratedComments {
  approved: Array<number>;
  highlighted: Array<number>;
  rejected: Array<number>;
  deferred: Array<number>;
  flagged: Array<number>;
  recommended: Array<number>;
  batched: Array<number>;
  automated: Array<number>;
}

export async function getModeratedCommentIdsForArticle(
  articleId: string,
  sort: Array<string>,
): Promise<IModeratedComments> {
  validateID(articleId, `articleId`);

  const { data }: any = await axios.get(
    serviceURL('moderatedCounts', `/articles/${articleId}`, { sort }),
  );

  return data.data;
}

export async function getModeratedCommentIdsForCategory(
  categoryId: string | 'all',
  sort: Array<string>,
): Promise<IModeratedComments> {
  const parsedCategoryId = categoryId !== 'all' ? parseInt(categoryId, 10) : categoryId;
  if (categoryId !== 'all') {
    validateID(categoryId, `categoryId`);
  }

  const { data }: any = await axios.get(
    serviceURL('moderatedCounts', `/categories/${parsedCategoryId}`, { sort }),
  );

  return data.data;
}

/**
 * Get a single model.
 */
export async function getModel<T>(
  type: IValidModelNames,
  id: string,
  params?: Partial<IParams>,
): Promise<ISingleResponse<T>> {
  validateModelName(type);

  const { data } = await axios.get(modelURL(type, id, params));

  return {
    model: convertFromJSONAPI<T>(data),
    response: data,
  };
}

/**
 * Update a model.
 */
export async function updateModel<T>(
  type: IValidModelNames,
  id: string,
  model: INewResource,
  onlyAttributes?: Array<string>,
): Promise<ISingleResponse<T>> {
  validateModelName(type);

  let attributes = fromJS(model).delete('id').toJS();

  if (onlyAttributes) {
    attributes = pick(attributes, onlyAttributes);
  }

  const { data } = await axios.patch(modelURL(type, id), {
    data: {
      attributes,
      type,
      id,
    },
  });

  return {
    model: convertFromJSONAPI<T>(data),
    response: data,
  };
}

/**
 * Destroy a model.
 */
export async function destroyModel(
  type: IValidModelNames,
  id: string,
): Promise<void> {
  validateModelName(type);

  await axios.delete(modelURL(type, id));
}

/**
 * List (and filter) a model relationship.
 */
export async function listRelationshipModels<T>(
  type: IValidModelNames,
  id: string,
  relationship: string,
  params?: Partial<IParams>,
): Promise<IMultipleResponse<T>> {
  validateModelName(type);

  const { data } = await axios.get(
    relatedURL(type, id, relationship, params),
  );

  return {
    models: convertArrayFromJSONAPI<T>(data),
    response: data,
  };
}

/**
 * Get a single has-one model relationship.
 */
export async function getRelationshipModel<T>(
  type: IValidModelNames,
  id: string,
  relationship: string,
): Promise<ISingleResponse<T>> {
  validateModelName(type);

  const { data } = await axios.get(relatedURL(type, id, relationship));

  return {
    model: convertFromJSONAPI<T>(data),
    response: data,
  };
}

/**
 * Append 1 or more items to a has-many model relationship.
 */
export async function addRelationshipModels(
  type: IValidModelNames,
  id: string,
  relationship: string,
  relatedIds: Array<string>,
): Promise<void> {
  validateModelName(type);

  await axios.post(relationURL(type, id, relationship), {
    data: relatedIds.map((relatedId) => ({ id: relatedId })),
  });
}

/**
 * Update a model relationship.
 */
export async function updateRelationshipModels(
  type: IValidModelNames,
  id: string,
  relationship: string,
  relatedIds: Array<string>,
): Promise<void> {
  validateModelName(type);

  await axios.patch(relationURL(type, id, relationship), {
    data: relatedIds.map((relatedId) => ({ id: relatedId })),
  });
}

/**
 * Destroy 1 or more items from a has-many model relationship.
 */
export async function destroyRelationshipModels(
  type: IValidModelNames,
  id: string,
  relationship: string,
  relatedIds: Array<string>,
): Promise<void> {
  validateModelName(type);

  await axios.delete(relationURL(type, id, relationship), {
    data: relatedIds.map((relatedId) => ({ id: relatedId })),
  } as Partial<IParams>);
}

/**
 * Ping the backend to see if the auth succeeds.
 */
export async function checkAuthorization(): Promise<void> {
  await axios.get(
    `${API_URL}/auth/test`,
  );
}

async function makeCommentAction(path: string, ids: Array<string>, userId: string): Promise<void> {
  if (ids.length <= 0) { return; }
  // get userid/ or have that passed in?
  const idUserArray =  ids.map((commentId) => {
    validateID(parseInt(commentId, 10), `commentId`);

    return {
      commentId,
      userId,
    };
  });

  const url = serviceURL('commentActions', path);
  await axios.post(url, { data: idUserArray, runImmediately: true });
}

async function makeCommentActionForId(path: string, commentId: string, userId: string): Promise<void> {
  const url = serviceURL('commentActions', path);
  await axios.post(url, { data: { commentId, userId } });
}

export async function deleteCommentTagRequest(commentId: string, commentScoreId: string): Promise<void> {
  validateID(commentId, `commentId`);
  validateID(commentScoreId, `commentScoreId`);

  const url = serviceURL('commentActions', `/${parseInt(commentId, 10)}/scores/${parseInt(commentScoreId, 10)}`);
  await axios.delete(url);
}

export function highlightCommentsRequest(ids: Array<string>, userId: string): Promise<void> {
  ids.forEach((id) => validateID(id, `commentId`));

  return makeCommentAction('/highlight', ids, userId);
}

export function resetCommentsRequest(ids: Array<string>, userId: string): Promise<void> {
  ids.forEach((id) => validateID(id, `commentId`));

  return makeCommentAction('/reset', ids, userId);
}

export function approveCommentsRequest(ids: Array<string>, userId: string): Promise<void> {
  ids.forEach((id) => validateID(id, `commentId`));

  return makeCommentAction('/approve', ids, userId);
}

export function deferCommentsRequest(ids: Array<string>, userId: string): Promise<void> {
  ids.forEach((id) => validateID(id, `commentId`));

  return makeCommentAction('/defer', ids, userId);
}

export function rejectCommentsRequest(ids: Array<string>, userId: string): Promise<void> {
  ids.forEach((id) => validateID(id, `commentId`));

  return makeCommentAction('/reject', ids, userId);
}

export function tagCommentsRequest(ids: Array<string>, tagId: string, userId: string): Promise<void> {
  ids.forEach((id) => validateID(id, `commentId`));

  return makeCommentAction(`/tag/${parseInt(tagId, 10)}`, ids, userId);
}

export function tagCommentSummaryScoresRequest(ids: Array<string>, tagId: string, userId: string): Promise<void> {
  ids.forEach((id) => validateID(id, `commentId`));

  return makeCommentAction(`/tagCommentSummaryScores/${parseInt(tagId, 10)}`, ids, userId);
}

export async function confirmCommentSummaryScoreRequest(commentId: string, tagId: string, userId: string): Promise<void> {
  validateID(commentId, `commentId`);
  validateID(tagId, `tagId`);
  validateID(userId, `userId`);

  return makeCommentActionForId(
    `/${parseInt(commentId, 10)}/tagCommentSummaryScores/${parseInt(tagId, 10)}/confirm`, commentId, userId);
}

export async function rejectCommentSummaryScoreRequest(commentId: string, tagId: string, userId: string): Promise<void> {
  validateID(commentId, `commentId`);
  validateID(tagId, `tagId`);
  validateID(userId, `userId`);

  return makeCommentActionForId(`/${parseInt(commentId, 10)}/tagCommentSummaryScores/${parseInt(tagId, 10)}/reject`, commentId, userId);
}

export async function tagCommentsAnnotationRequest(commentId: string, tagId: string, start: number, end: number): Promise<void> {
  const url = serviceURL('commentActions', `/${parseInt(commentId, 10)}/scores`);

  await axios.post(url, {
    data: {
      tagId,
      annotationStart: start,
      annotationEnd: end,
    },
  });
}

export async function confirmCommentScoreRequest(commentId: string, commentScoreId: string): Promise<void> {
  validateID(commentId, `commentId`);
  validateID(commentScoreId, `commentScoreId`);

  const url = serviceURL('commentActions', `/${parseInt(commentId, 10)}/scores/${parseInt(commentScoreId, 10)}/confirm`);
  await axios.post(url);
}

export async function rejectCommentScoreRequest(commentId: string, commentScoreId: string): Promise<void> {
  validateID(commentId, `commentId`);
  validateID(commentScoreId, `commentScoreId`);

  const url = serviceURL('commentActions', `/${parseInt(commentId, 10)}/scores/${parseInt(commentScoreId, 10)}/reject`);
  await axios.post(url);
}

export async function resetCommentScoreRequest(commentId: string, commentScoreId: string): Promise<void> {
  validateID(commentId, `commentId`);
  validateID(commentScoreId, `commentScoreId`);

  const url = serviceURL('commentActions', `/${parseInt(commentId, 10)}/scores/${parseInt(commentScoreId, 10)}/reset`);
  await axios.post(url);
}

export async function listAuthorCounts(
  authorSourceIds: Array<string | number>,
): Promise<Map<string | number, IAuthorCountsModel>> {

  const response: any = await axios.post(
    serviceURL('authorCounts'),
    { data: authorSourceIds },
  );

  return Map<string | number, IAuthorCountsModel>(response.data.data);
}
