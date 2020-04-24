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
  ArticleModel,
  CommentDatedModel,
  CommentFlagModel,
  CommentModel,
  CommentScoredModel,
  CommentScoreModel,
  IArticleModel,
  IAuthorCountsModel,
  ICommentDatedModel,
  ICommentFlagModel,
  ICommentModel,
  ICommentScoredModel,
  ICommentScoreModel,
  IUserModel,
  ModelId,
  UserModel,
} from '../../models';
import { ServerStates } from '../../types';
import { API_URL } from '../config';

export type IValidModelNames =
    'articles' |
    'categories' |
    'comment_scores' |
    'comments' |
    'moderation_rules' |
    'preselects' |
    'tagging_sensitivities' |
    'tags' |
    'users';

const VALID_MODEL_NAMES_LOOKUP: {
  [key: string]: boolean;
} = {
  articles: true,
  categories: true,
  comment_scores: true,
  comments: true,
  moderation_rules: true,
  preselects: true,
  tagging_sensitivities: true,
  tags: true,
  users: true,
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
 * Base AUTH API Path
 */
const AUTH_URL = `/auth`;

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
 * Create a new instance of a model.
 */
export async function createModel(
  type: IValidModelNames,
  model: INewResource,
): Promise<void> {
  validateModelName(type);

  await axios.post(listURL(type), {
    data: {
      attributes: fromJS(model).delete('id').toJS(),
      type,
    },
  });
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

export async function getComments(
  commentIds: Array<ModelId>,
): Promise<Array<ICommentModel>> {
  const url = serviceURL('simple', `/comment/get`);
  const response = await axios.post(url, commentIds);
  return response.data.map((a: any) => (CommentModel(a)));
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
export async function editAndRescoreCommentRequest(
  commentId: string,
  text: string,
  authorName: string,
  authorLocation: string,
): Promise<void> {
  await axios.patch(
    serviceURL(
      'editComment',
      null,
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

export async function getArticles(ids: Array<ModelId>): Promise<Array<IArticleModel>> {
  const url = serviceURL('simple', `/article/get`);
  const response = await axios.post(url, ids);
  return response.data.map((a: any) => (ArticleModel(a)));
}

export async function getArticleText(id: ModelId) {
  const url = serviceURL('simple', `/article/${id}/text`);
  const response = await axios.get(url);
  return response.data.text;
}

/**
 * Update a model.
 */
export async function updateModel(
  type: IValidModelNames,
  id: string,
  model: INewResource,
  onlyAttributes?: Array<string>,
): Promise<void> {
  validateModelName(type);

  let attributes = fromJS(model).delete('id').toJS();

  if (onlyAttributes) {
    attributes = pick(attributes, onlyAttributes);
  }

  await axios.patch(modelURL(type, id), {
    data: {
      attributes,
      type,
      id,
    },
  });
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

export async function getCommentScores(commentId: string): Promise<Array<ICommentScoreModel>> {
  const url = serviceURL('simple', `/comment/${commentId}/scores`);
  const response = await axios.get(url);
  return response.data.map((s: any) => (CommentScoreModel(s)));
}

export async function getCommentFlags(commentId: string): Promise<Array<ICommentFlagModel>> {
  const url = serviceURL('simple', `/comment/${commentId}/flags`);
  const response = await axios.get(url);
  return response.data.map((s: any) => (CommentFlagModel(s)));
}

export async function checkServerStatus(): Promise<ServerStates> {
  const response = await axios.get(
    `${API_URL}${AUTH_URL}/healthcheck`,
  );
  if (response.status === 218) {
    switch (response.data) {
      case 'init_oauth':
        return 's_init_oauth';
      case 'init_first_user':
        return 's_init_first_user';
      case 'init_check_oauth':
        return 's_init_check_oauth';
    }
  }
  return 's_gtg';
}

/**
 * Ping the backend to see if the auth succeeds.
 */
export async function checkAuthorization(): Promise<void> {
  await axios.get(
    `${API_URL}${AUTH_URL}/test`,
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
  authorSourceIds: Array<string>,
): Promise<Map<string, IAuthorCountsModel>> {
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

export interface IApiConfiguration {
  id: string;
  secret: string;
}

export async function getOAuthConfig(): Promise<IApiConfiguration> {
  const response: any = await axios.get(`${API_URL}${AUTH_URL}/config`);
  return response.data.google_oauth_config as IApiConfiguration;
}

export async function updateOAuthConfig(config: IApiConfiguration): Promise<void> {
  await axios.post(`${API_URL}${AUTH_URL}/config`, {data: config});
}
