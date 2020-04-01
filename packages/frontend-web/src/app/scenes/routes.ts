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

import qs from 'query-string';

import { ModelId } from '../../models';

export interface IDashboardPathParams {
  filter?: string;
  sort?: string;
}

export const dashboardBase = 'dashboard';
export function dashboardLink(params: IDashboardPathParams) {
  let ret = `/${dashboardBase}`;
  if (params.filter) {
    ret = `${ret}/${params.filter}`;
  }
  else if (params.sort) {
    // Need to add a filter placeholder so we can add sort.
    ret = `${ret}/~/`;
  }

  if (params.sort) {
    ret = `${ret}/${params.sort}`;
  }
  return ret;
}

export const settingsBase = 'settings';
export function settingsLink() {
  return `/${settingsBase}`;
}

export interface ISearchQueryParams {
  articleId?: ModelId;
  searchByAuthor?: boolean;
  term?: string;
  sort?: string;
}

export const searchBase = 'search';
export function searchLink(params: ISearchQueryParams) {
  let gotQuery = false;
  for (const key of Object.keys(params)) {
    const value = (params as any)[key];
    if (!value) {
      delete (params as any)[key];
      continue;
    }
    gotQuery = true;
  }

  if (gotQuery) {
    return `/${searchBase}?${qs.stringify(params)}`;
  }
  return `/${searchBase}`;
}

export interface IContextPathParams {
  context: string;
  contextId: ModelId;
}

export function isArticleContext(params: IContextPathParams) {
  return params.context === articleBase;
}

export interface INewCommentsPathParams extends IContextPathParams {
  tag: string;
}

export interface INewCommentsQueryParams {
  pos1?: string;
  pos2?: string;
  sort?: string;
}

export interface IModeratedCommentsPathParams extends IContextPathParams {
  disposition: string;
}

export interface IModeratedCommentsQueryParams {
  sort?: string;
}

export const articleBase = 'articles';
export const categoryBase = 'categories';
export const NEW_COMMENTS_DEFAULT_TAG = 'SUMMARY_SCORE';
export function newCommentsPageLink(
  {context, contextId, tag}: INewCommentsPathParams,
  query?: INewCommentsQueryParams,
) {
  const queryString = query ? '?' + qs.stringify(query) : '';
  return `/${context}/${contextId}/new/${tag}${queryString}`;
}

export function moderatedCommentsPageLink(
  {context, contextId, disposition}: IModeratedCommentsPathParams,
  query?: IModeratedCommentsQueryParams,
) {
  const queryString = query ? '?' + qs.stringify(query) : '';
  return `/${context}/${contextId}/moderated/${disposition}${queryString}`;
}

export interface ITagSelectorPathParams extends IContextPathParams {
  tag?: string;
}

export const tagSelectorBase = 'tagselector';
export function tagSelectorLink({context, contextId, tag}: ITagSelectorPathParams) {
  return `/${tagSelectorBase}/${context}/${contextId}/${tag}`;
}

export interface ICommentDetailsPathParams extends IContextPathParams {
  commentId: ModelId;
}

export interface ICommentDetailsQueryParams {
  pagingIdentifier: string;
}

export function commentDetailsPageLink (
  {context, contextId, commentId}: ICommentDetailsPathParams,
  query?: ICommentDetailsQueryParams,
) {
  const queryString = query ? `?${qs.stringify(query)}` : '';
  return `/${context}/${contextId}/comments/${commentId}${queryString}`;
}

export function commentRepliesDetailsLink(
  {context, contextId, commentId}: ICommentDetailsPathParams,
) {
  return `/${context}/${contextId}/comments/${commentId}/replies`;
}

export function commentSearchDetailsPageLink(
  commentId: ModelId,
  query?: ICommentDetailsQueryParams,
) {
  const queryString = query ? `?${qs.stringify(query)}` : '';
  return `/${searchBase}/comments/${commentId}${queryString}`;
}
