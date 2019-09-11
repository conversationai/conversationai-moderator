/*
Copyright 2019 Google Inc.

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

import axios from 'axios';
import { fromJS, List, Map } from 'immutable';
import { pick } from 'lodash';
import qs from 'qs';

import {
  INewResource,
  IParams,
} from './types';

import {
  IAuthorCountsModel,
  ICommentDatedModel,
  ICommentModel,
  ICommentScoredModel,
  ICommentSummaryScoreModel,
  IUserModel,
  ModelId,
} from '../../models';
import {
  CommentDatedModel,
  CommentScoredModel,
  UserModel,
} from '../../models';
import { ITopScore, ServerStates } from '../../types';
import { API_URL } from '../config';
import { convertArrayFromJSONAPI } from '../util';
import { convertFromJSONAPI } from '../util';

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

// TODO: API shouldn't rely on us telling it who we are.  It should get that information from the authentication request
//   But API currently does rely on this.
//   Until we fix this, store userId here.  It gets set during authentication.
let userId: string;
export function setUserId(id: string) {
  userId = id;
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
  delete params.filters;
  if (originalParams.filters) {
    params.filter = originalParams.filters;
  }

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
 * The URL of a model related.
 */
export function relatedURL(type: IValidModelNames, id: string, relationship: string, params?: Partial<IParams>): string {
  validateModelName(type);
  return `${API_URL}${REST_URL}/${type}/${id}/${relationship}${serializeParams(params)}`;
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
  const response: any = await axios.get(
    serviceURL('histogramScores', `/articles/${articleId}/tags/${tagId}`, { sort }),
  );

  return List(
    (response.data.data as Array<any>).map(CommentScoredModel),
  );
}

export async function listMaxSummaryScoreByArticle(
  articleId: string,
  sort: Array<string>,
): Promise<List<ICommentScoredModel>> {
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
  const response: any = await axios.get(
    serviceURL('histogramScores', `/categories/${categoryId}/tags/${tagId}`, { sort }),
  );

  return List(
    (response.data.data as Array<any>).map(CommentScoredModel),
  );
}

export async function listMaxHistogramScoresByCategory(
  categoryId: string | 'all',
  sort: Array<string>,
): Promise<List<ICommentScoredModel>> {
  const response: any = await axios.get(
    serviceURL('histogramScores', `/categories/${categoryId}/summaryScore`, { sort }),
  );

  return List(
    (response.data.data as Array<any>).map(CommentScoredModel),
  );
}

export async function listHistogramScoresByCategoryByDate(
  categoryId: string | 'all',
  sort: Array<string>,
): Promise<List<ICommentDatedModel>> {
  const response: any = await axios.get(
    serviceURL('histogramScores', `/categories/${categoryId}/byDate`, { sort }),
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
): Promise<List<ICommentModel>> {
  const { data } = await axios.post(
    serviceURL(
      'commentsById',
      null,
      null,
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
  const { data }: any = await axios.post(
    serviceURL(
      'topScores',
      `/tag/${tagId}`,
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

export async function updateCategoryModerators(categoryId: ModelId, moderatorIds: Array<ModelId>): Promise<void> {
  const url = serviceURL('assignments', `/categories/${categoryId}`);
  await axios.post(url, { data: moderatorIds });
}

export async function updateArticleModerators(articleId: ModelId, moderatorIds: Array<ModelId>): Promise<void> {
  const url = serviceURL('assignments', `/article/${articleId}`);
  await axios.post(url, { data: moderatorIds });
}

export interface IModeratedComments {
  approved: Array<ModelId>;
  highlighted: Array<ModelId>;
  rejected: Array<ModelId>;
  deferred: Array<ModelId>;
  flagged: Array<ModelId>;
  batched: Array<ModelId>;
  automated: Array<ModelId>;
}

export async function getModeratedCommentIdsForArticle(
  articleId: string,
  sort: Array<string>,
): Promise<IModeratedComments> {
  const { data }: any = await axios.get(
    serviceURL('moderatedCounts', `/articles/${articleId}`, { sort }),
  );

  return data.data;
}

export async function getModeratedCommentIdsForCategory(
  categoryId: string | 'all',
  sort: Array<string>,
): Promise<IModeratedComments> {
  const { data }: any = await axios.get(
    serviceURL('moderatedCounts', `/categories/${categoryId}`, { sort }),
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

export async function getArticleText(id: string) {
  const url = serviceURL('simple', `/article/${id}/text`);
  const response = await axios.get(url);
  return response.data.text;
}

export async function getComment(id: string) {
  return await getModel('comments', id, { include: ['replyTo'] });
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

export async function updateArticle(id: string, isCommentingEnabled: boolean, isAutoModerated: boolean) {
  const url = serviceURL('simple', `/article/update/${id}`);
  await axios.post(url, {isCommentingEnabled, isAutoModerated});
}

export async function updateUser(user: IUserModel) {
  const url = serviceURL('simple', `/user/update/${user.id}`);
  const attributes = pick(user, ['name', 'email', 'group', 'isActive']);
  await axios.post(url, attributes);
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
async function listRelationshipModels<T>(
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

export function getCommentScores(commentId: string) {
  return listRelationshipModels('comments', commentId, 'commentScores', {page: {offset: 0, limit: -1}});
}

export function getCommentFlags(commentId: string) {
  return listRelationshipModels('comments', commentId, 'commentFlags', {page: {offset: 0, limit: -1}});
}

export async function checkServerStatus(): Promise<ServerStates> {
  const response = await axios.get(
    `${API_URL}/auth/healthcheck`,
  );
  if (response.status === 218) {
    if (response.data === 'init_first_user') {
      return 's_init_first_user';
    }
  }
  return 's_gtg';
}

/**
 * Ping the backend to see if the auth succeeds.
 */
export async function checkAuthorization(): Promise<void> {
  await axios.get(
    `${API_URL}/auth/test`,
  );
}

async function makeCommentAction(path: string, ids: Array<string>): Promise<void> {
  if (ids.length <= 0) { return; }
  const idUserArray =  ids.map((commentId) => {
    return {
      commentId,
      userId,
    };
  });

  const url = serviceURL('commentActions', path);
  await axios.post(url, { data: idUserArray, runImmediately: true });
}

async function makeCommentActionForId(path: string, commentId: string): Promise<void> {
  const url = serviceURL('commentActions', path);
  await axios.post(url, { data: { commentId, userId } });
}

export async function deleteCommentTagRequest(commentId: string, commentScoreId: string): Promise<void> {
  const url = serviceURL('commentActions', `/${commentId}/scores/${commentScoreId}`);
  await axios.delete(url);
}

export function highlightCommentsRequest(ids: Array<string>): Promise<void> {
  return makeCommentAction('/highlight', ids);
}

export function resetCommentsRequest(ids: Array<string>): Promise<void> {
  return makeCommentAction('/reset', ids);
}

export function approveCommentsRequest(ids: Array<string>): Promise<void> {
  return makeCommentAction('/approve', ids);
}

export function approveFlagsAndCommentsRequest(ids: Array<string>): Promise<void> {
  return makeCommentAction('/approve-flags', ids);
}

export function resolveFlagsRequest(ids: Array<string>): Promise<void> {
  return makeCommentAction('/resolve-flags', ids);
}

export function deferCommentsRequest(ids: Array<string>): Promise<void> {
  return makeCommentAction('/defer', ids);
}

export function rejectCommentsRequest(ids: Array<string>): Promise<void> {
  return makeCommentAction('/reject', ids);
}

export function rejectFlagsAndCommentsRequest(ids: Array<string>): Promise<void> {
  return makeCommentAction('/reject-flags', ids);
}

export function tagCommentsRequest(ids: Array<string>, tagId: string): Promise<void> {
  return makeCommentAction(`/tag/${tagId}`, ids);
}

export function tagCommentSummaryScoresRequest(ids: Array<string>, tagId: string): Promise<void> {
  return makeCommentAction(`/tagCommentSummaryScores/${tagId}`, ids);
}

export async function confirmCommentSummaryScoreRequest(commentId: string, tagId: string): Promise<void> {
  return makeCommentActionForId(
    `/${commentId}/tagCommentSummaryScores/${tagId}/confirm`, commentId);
}

export async function rejectCommentSummaryScoreRequest(commentId: string, tagId: string): Promise<void> {
  return makeCommentActionForId(`/${commentId}/tagCommentSummaryScores/${tagId}/reject`, commentId);
}

export async function tagCommentsAnnotationRequest(commentId: string, tagId: string, start: number, end: number): Promise<void> {
  const url = serviceURL('commentActions', `/${commentId}/scores`);

  await axios.post(url, {
    data: {
      tagId,
      annotationStart: start,
      annotationEnd: end,
    },
  });
}

export async function confirmCommentScoreRequest(commentId: string, commentScoreId: string): Promise<void> {
  const url = serviceURL('commentActions', `/${commentId}/scores/${commentScoreId}/confirm`);
  await axios.post(url);
}

export async function rejectCommentScoreRequest(commentId: string, commentScoreId: string): Promise<void> {
  const url = serviceURL('commentActions', `/${commentId}/scores/${commentScoreId}/reject`);
  await axios.post(url);
}

export async function resetCommentScoreRequest(commentId: string, commentScoreId: string): Promise<void> {
  const url = serviceURL('commentActions', `/${commentId}/scores/${commentScoreId}/reset`);
  await axios.post(url);
}

export async function listAuthorCounts(
  authorSourceIds: Array<string | number>,
): Promise<Map<string | number, IAuthorCountsModel>> {
  const response: any = await axios.post(
    serviceURL('authorCounts'),
    { data: authorSourceIds },
  );

  return Map<string, IAuthorCountsModel>(response.data.data);
}

export async function listSystemUsers(type: string): Promise<List<IUserModel>> {
  const response: any = await axios.get(serviceURL('simple', `/systemUsers/${type}`));
  return List<IUserModel>(response.data.users.map((u: any) => {
    u.id = u.id.toString();
    return UserModel(u);
  }));
}

export async function kickProcessor(type: string): Promise<void> {
  await axios.get(serviceURL('processing', `/trigger/${type}`));
}

export async function activateCommentSource(categoryId: ModelId, activate: boolean): Promise<void> {
  await axios.post(serviceURL('comment_sources', `/activate/${categoryId}`), { data: {activate} });
}

export async function syncCommentSource(categoryId: ModelId): Promise<void> {
  await axios.get(serviceURL('comment_sources', `/sync/${categoryId}`));
}
