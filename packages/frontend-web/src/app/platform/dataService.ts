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
import { List } from 'immutable';
import { pick } from 'lodash';
import qs from 'qs';

import {
  IParams,
} from './types';

import {
  ArticleModel,
  CommentFlagModel,
  CommentModel,
  CommentScoreModel,
  IArticleModel,
  IAuthorCountsModel,
  ICommentDate,
  ICommentFlagModel,
  ICommentModel,
  ICommentScore,
  ICommentScoreModel, IPreselectModel, IRuleModel, ITaggingSensitivityModel,
  ITagModel,
  IUserModel,
  ModelId,
  UserModel,
} from '../../models';
import { ServerStates } from '../../types';
import { API_URL } from '../config';

export type IValidModelNames =
    'moderation_rule' |
    'preselect' |
    'tagging_sensitivity' |
    'tag';

/**
 * Convert Partial<IParams> type to a query string.
 */
function serializeParams(originalParams?: Partial<IParams> | null): string {
  if (!originalParams) {
    return '';
  }

  // Clone to avoid mutability issues.
  const params = { ...originalParams } as any;

  if (originalParams.sort) {
    params.sort = originalParams.sort.join(',');
  }

  return '?' + qs.stringify(params, { encode: false });
}

const BASE_RANGE_ATTRIBUTES = ['categoryId', 'tagId', 'lowerThreshold', 'upperThreshold'];

/**
 * Base AUTH API Path
 */
const AUTH_URL = `/auth`;

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

export async function listTextSizesByIds(
  ids: Array<string>,
  width: number,
): Promise<Map<string, number>> {
  const response: any = await axios.post(
    serviceURL('textSizes', null, { width } as Partial<IParams>),
    { data: ids },
  );

  const data = response.data.data;
  return new Map<ModelId, number>(Object.entries(data));
}

function packCommentScoreData(data: Array<{ commentId: ModelId, score: number }>): Array<ICommentScore> {
  return data.map(({commentId, score}) => ({commentId, score}));
}

function packCommentDateData(data: Array<{ commentId: ModelId, date: string }>): Array<ICommentDate> {
  return data.map(({date, commentId}) => ({
    commentId,
    date: new Date(date),
  }));
}

export async function listHistogramScoresByArticle(
  articleId: string,
  tagId: string | 'DATE',
  sort: Array<string>,
): Promise<Array<ICommentScore>> {
  const response: any = await axios.get(
    serviceURL('histogramScores', `/articles/${articleId}/tags/${tagId}`, { sort }),
  );

  return packCommentScoreData(response.data.data);
}

export async function listMaxSummaryScoreByArticle(
  articleId: string,
  sort: Array<string>,
): Promise<Array<ICommentScore>> {
  const response: any = await axios.get(
    serviceURL('histogramScores', `/articles/${articleId}/summaryScore`, { sort }),
  );

  return packCommentScoreData(response.data.data);
}

export async function listHistogramScoresByArticleByDate(
  articleId: ModelId,
  sort: Array<string>,
): Promise<Array<ICommentDate>> {
  const response: any = await axios.get(
    serviceURL('histogramScores', `/articles/${articleId}/byDate`, { sort }),
  );

  return packCommentDateData(response.data.data);
}

export async function listHistogramScoresByCategory(
  categoryId: string | 'all',
  tagId: string,
  sort: Array<string>,
): Promise<Array<ICommentScore>> {
  const response: any = await axios.get(
    serviceURL('histogramScores', `/categories/${categoryId}/tags/${tagId}`, { sort }),
  );

  return packCommentScoreData(response.data.data);
}

export async function listMaxHistogramScoresByCategory(
  categoryId: string | 'all',
  sort: Array<string>,
): Promise<Array<ICommentScore>> {
  const response: any = await axios.get(
    serviceURL('histogramScores', `/categories/${categoryId}/summaryScore`, { sort }),
  );

  return packCommentScoreData(response.data.data);
}

export async function listHistogramScoresByCategoryByDate(
  categoryId: ModelId | 'all',
  sort: Array<string>,
): Promise<Array<ICommentDate>> {
  const response: any = await axios.get(
    serviceURL('histogramScores', `/categories/${categoryId}/byDate`, { sort }),
  );

  return packCommentDateData(response.data.data);
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

export type IModeratedComments = Readonly<{
  approved: Array<ModelId>;
  highlighted: Array<ModelId>;
  rejected: Array<ModelId>;
  deferred: Array<ModelId>;
  flagged: Array<ModelId>;
  batched: Array<ModelId>;
  automated: Array<ModelId>;
  [key: string]: Array<ModelId>;
}>;

export async function getModeratedCommentIdsForArticle(
  articleId: ModelId,
  sort: Array<string>,
): Promise<IModeratedComments> {
  const { data }: any = await axios.get(
    serviceURL('moderatedCounts', `/articles/${articleId}`, { sort }),
  );

  return data.data;
}

export async function getModeratedCommentIdsForCategory(
  categoryId: ModelId | 'all',
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

export async function updateArticle(id: string, isCommentingEnabled: boolean, isAutoModerated: boolean) {
  const url = serviceURL('simple', `/article/update/${id}`);
  await axios.post(url, {isCommentingEnabled, isAutoModerated});
}

async function createThing(url: string, attributes: {[key: string]: string | number | boolean}) {
  try {
    await axios.post(url, attributes);
  } catch (e) {
    if (e.response) {
      throw new Error(e.response.data);
    }
    throw e;
  }
}

async function updateThing(url: string, attributes: {[key: string]: string | number | boolean}) {
  try {
    await axios.patch(url, attributes);
  } catch (e) {
    if (e.response) {
      throw new Error(e.response.data);
    }
    throw e;
  }
}

export async function createUser(user: IUserModel) {
  const url = serviceURL('simple', `/user`);
  const attributes = pick(user, ['name', 'email', 'group', 'isActive']);
  return createThing(url, attributes);
}

export async function createTag(tag: ITagModel) {
  const url = serviceURL('simple', `/tag`);
  const attributes = pick(tag, ['color', 'description', 'key', 'label',
    'isInBatchView', 'inSummaryScore', 'isTaggable']);
  return createThing(url, attributes);
}

export async function createRule(rule: IRuleModel) {
  const url = serviceURL('simple', `/moderation_rule`);
  const attributes = pick(rule, [...BASE_RANGE_ATTRIBUTES, 'action']);
  return createThing(url, attributes);
}

export async function createPreselect(preselect: IPreselectModel) {
  const url = serviceURL('simple', `/preselect`);
  const attributes = pick(preselect, BASE_RANGE_ATTRIBUTES);
  return createThing(url, attributes);
}

export async function createSensitivity(sensitivity: ITaggingSensitivityModel) {
  const url = serviceURL('simple', `/tagging_sensitivity`);
  const attributes = pick(sensitivity, BASE_RANGE_ATTRIBUTES);
  return createThing(url, attributes);
}

export async function updateUser(user: IUserModel) {
  const url = serviceURL('simple', `/user/update/${user.id}`);
  const attributes = pick(user, ['name', 'email', 'group', 'isActive']);
  await axios.post(url, attributes);
}

export async function updateTag(tag: ITagModel) {
  const url = serviceURL('simple', `/tag/${tag.id}`);
  const attributes = pick(tag, ['color', 'description', 'key', 'label',
    'isInBatchView', 'inSummaryScore', 'isTaggable']);
  return updateThing(url, attributes);
}

export async function updateRule(rule: IRuleModel) {
  const url = serviceURL('simple', `/moderation_rule/${rule.id}`);
  const attributes = pick(rule, [...BASE_RANGE_ATTRIBUTES, 'action']);
  return updateThing(url, attributes);
}

export async function updatePreselect(preselect: IPreselectModel) {
  const url = serviceURL('simple', `/preselect/${preselect.id}`);
  const attributes = pick(preselect, BASE_RANGE_ATTRIBUTES);
  return updateThing(url, attributes);
}

export async function updateSensitivity(sensitivity: ITaggingSensitivityModel) {
  const url = serviceURL('simple', `/tagging_sensitivity/${sensitivity.id}`);
  const attributes = pick(sensitivity, BASE_RANGE_ATTRIBUTES);
  return updateThing(url, attributes);
}

/**
 * Destroy a model.
 */
export async function destroyModel(
  type: IValidModelNames,
  id: string,
): Promise<void> {
  await axios.delete(serviceURL('simple', `/${type}/${id}`));
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
    };
  });
  const url = serviceURL('commentActions', path);
  await axios.post(url, { data: idUserArray, runImmediately: true });
}

async function makeCommentActionForId(path: string, commentId: string): Promise<void> {
  const url = serviceURL('commentActions', path);
  await axios.post(url, { data: { commentId } });
}

export async function deleteCommentScoreRequest(commentId: string, commentScoreId: string): Promise<void> {
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

  return new Map<string, IAuthorCountsModel>(Object.entries(response.data.data));
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
