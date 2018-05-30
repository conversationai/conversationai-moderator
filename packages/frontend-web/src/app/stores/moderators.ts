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

import { List, Set } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { IArticleModel, ICategoryModel, IUserModel } from '../../models';
import { IAppStateRecord, IThunkAction } from './index';

import { getLoadedArticles } from '../scenes/Dashboard/components/DashboardArticles/store';
import { listRelationshipModels, updateCategoryAssignments, updateRelationshipModels } from '../util';

const STATE_ROOT = ['global', 'moderators'];
const MODERATORS_IS_READY = [...STATE_ROOT, 'isReady'];
const ARTICLE_MODERATOR_IDS_DATA = [...STATE_ROOT, 'articleModerators'];
const CATEGORY_MODERATOR_IDS_DATA = [...STATE_ROOT, 'categoryModerators'];
const ARTICLE_DATA = [...STATE_ROOT, 'article'];

export type ILoadArticleStartPayload = IArticleModel;
export const loadArticleStart: (payload: ILoadArticleStartPayload) => Action<ILoadArticleStartPayload> =
  createAction<ILoadArticleStartPayload>(
    'assign-moderators/LOAD_ARTICLE_START',
  );

export type ILoadCompletePayload = List<IUserModel>;
export const loadArticleComplete: (payload: ILoadCompletePayload) => Action<ILoadCompletePayload> =
  createAction<ILoadCompletePayload>(
    'assign-moderators/LOAD_ARTICLE_COMPLETE',
  );

export type IAddRemoveModeratorPayload = {
  userId: string;
};
export const addModeratorToArticle: (payload: IAddRemoveModeratorPayload) => Action<IAddRemoveModeratorPayload> = createAction<IAddRemoveModeratorPayload>(
  'assign-moderators/ADD_MODERATOR_TO_ARTICLE',
);
export const removeModeratorFromArticle: (payload: IAddRemoveModeratorPayload) => Action<IAddRemoveModeratorPayload> =
  createAction<IAddRemoveModeratorPayload>(
    'assign-moderators/REMOVE_MODERATOR_FROM_ARTICLE',
  );

export type ILoadCategoryStartPayload = ICategoryModel;
export const loadCategoryStart: (payload: ILoadCategoryStartPayload) => Action<ILoadCategoryStartPayload> =
  createAction<ILoadCategoryStartPayload>(
    'assign-moderators/LOAD_CATEGORY_START',
  );

export const loadCategoryComplete: (payload: ILoadCompletePayload) => Action<ILoadCompletePayload> =
  createAction<ILoadCompletePayload>(
    'assign-moderators/LOAD_CATEGORY_COMPLETE',
  );

export const addModeratorToCategory: (payload: IAddRemoveModeratorPayload) => Action<IAddRemoveModeratorPayload> =
  createAction<IAddRemoveModeratorPayload>(
    'assign-moderators/ADD_MODERATOR_TO_CATEGORY',
  );

export const removeModeratorFromCategory: (payload: IAddRemoveModeratorPayload) => Action<IAddRemoveModeratorPayload> =
  createAction<IAddRemoveModeratorPayload>(
    'assign-moderators/REMOVE_MODERATOR_FROM_CATEGORY',
  );

export function loadArticleModerators(article: IArticleModel): IThunkAction<void> {
  return async (dispatch) => {
    dispatch(loadArticleStart(article));

    const { models } = await listRelationshipModels<IUserModel>(
      'articles',
      article.id,
      'assignedModerators',
      {
        page: { limit: -1 },
      },
    );

    dispatch(loadArticleComplete(models));
  };
}

export function loadCategoryModerators(category: ICategoryModel): IThunkAction<Promise<void>> {
  return async (dispatch) => {
    await dispatch(loadCategoryStart(category));

    const { models } = await listRelationshipModels<IUserModel>(
      'categories',
      category.id,
      'assignedModerators',
      {
        page: { limit: -1 },
      },
    );

    await dispatch(loadCategoryComplete(models));
  };
}

export type ModelId = number | string;

export interface IModeratorsState {
  isReady: boolean;
  article: IArticleModel | null;
  category: ICategoryModel | null;
  articleModerators: Set<ModelId>;
  categoryModerators: Set<ModelId>;
}

export interface IModeratorsStateRecord extends TypedRecord<IModeratorsStateRecord>, IModeratorsState {}

const StateFactory = makeTypedFactory<IModeratorsState, IModeratorsStateRecord>({
  isReady: false,
  article: null,
  category: null,
  articleModerators: Set<ModelId>(),
  categoryModerators: Set<ModelId>(),
});

export const reducer = handleActions<
  IModeratorsStateRecord,
  ILoadArticleStartPayload   | // loadArticleStart
  ILoadCategoryStartPayload  | // loadCategoryStart
  ILoadCompletePayload       | // loadArticleComplete, loadCategoryComplete
  IAddRemoveModeratorPayload   // addModeratorToArticle, removeModeratorFromArticle, addModeratorToCategory, removeModeratorFromCategory
>({
  [loadArticleStart.toString()]: (state, { payload }: Action<ILoadArticleStartPayload>) => (
    state
        .set('isReady', false)
        .set('article', payload)
  ),

  [loadArticleComplete.toString()]: (state, { payload }: Action<ILoadCompletePayload>) => (
    state
        .set('isReady', true)
        .set('articleModerators', Set<ModelId>(payload.map((u) => u.id)))
  ),

  [addModeratorToArticle.toString()]: (state, { payload }: Action<IAddRemoveModeratorPayload>) => (
    state.update('articleModerators', (s: any) => s.add(payload.userId))
  ),

  [removeModeratorFromArticle.toString()]: (state, { payload }: Action<IAddRemoveModeratorPayload>) => (
    state.update('articleModerators', (s: any) => s.delete(payload.userId))
  ),

  [loadCategoryStart.toString()]: (state, { payload }: Action<ILoadCategoryStartPayload>) => (
    state
        .set('isReady', false)
        .set('category', payload)
  ),

  [loadCategoryComplete.toString()]: (state, { payload }: Action<ILoadCompletePayload>) => (
    state
        .set('isReady', true)
        .set('categoryModerators', Set<ModelId>(payload.map((u) => u.id)))
  ),

  [addModeratorToCategory.toString()]: (state, { payload }: Action<IAddRemoveModeratorPayload>) => (
    state.update('categoryModerators', (s: any) => s.add(payload.userId))
  ),

  [removeModeratorFromCategory.toString()]: (state, { payload }: Action<IAddRemoveModeratorPayload>) => (
    state.update('categoryModerators', (s: any) => s.delete(payload.userId))
  ),
}, StateFactory());

export function getArticleModeratorIds(state: IAppStateRecord): Set<string> {
  return state.getIn(ARTICLE_MODERATOR_IDS_DATA);
}

export function getCategoryModeratorIds(state: IAppStateRecord): Set<string> {
  return state.getIn(CATEGORY_MODERATOR_IDS_DATA);
}

export function getIsReady(state: IAppStateRecord): boolean {
  return state.getIn(MODERATORS_IS_READY);
}

export function getArticle(state: IAppStateRecord): IArticleModel {
  return state.getIn(ARTICLE_DATA);
}

export type IUpdateArticleModeratorsStartPayload = {
  article: IArticleModel;
};
export const updateArticleModeratorsStart: (payload: IUpdateArticleModeratorsStartPayload) => Action<IUpdateArticleModeratorsStartPayload> =
  createAction<IUpdateArticleModeratorsStartPayload>('dashboard/UPDATE_ARTICLE_MODERATORS_START');

export type IUpdateArticleModeratorsCompletePayload = {
  article: IArticleModel;
  moderators: Array<IUserModel>;
};
export const updateArticleModeratorsComplete: (payload: IUpdateArticleModeratorsCompletePayload) => Action<IUpdateArticleModeratorsCompletePayload> =
  createAction<IUpdateArticleModeratorsCompletePayload>('dashboard/UPDATE_ARTICLE_MODERATORS_COMPLETE');

export type IUpdateArticleModeratorsByIdCompletePayload = {
  moderators: Array<IUserModel>;
};
export const updateArticleModeratorsById: (payload: IUpdateArticleModeratorsByIdCompletePayload) => Action<IUpdateArticleModeratorsByIdCompletePayload> =
  createAction<IUpdateArticleModeratorsByIdCompletePayload>('dashboard/UPDATE_ARTICLE_MODERATORS_BY_ID_COMPLETE');

export function updateArticleModerators(article: IArticleModel, moderators: Array<IUserModel>): IThunkAction<Promise<void>> {
  return async (dispatch) => {
    await dispatch(updateArticleModeratorsStart({ article }));

    await updateRelationshipModels(
      'articles',
      article.id,
      'assignedModerators',
      moderators.map((u) => u.id),
    );

    await dispatch(updateArticleModeratorsComplete({ article, moderators }));
  };
}

export function updateArticleModeratorsByIds(moderatorIds: Array<string>, removedModeratorIds?: Array<string>): IThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    const users = state.getIn(['global', 'users', 'items']);
    const articleModerators = users.filter((u: IUserModel) => moderatorIds.some((id) => id === u.id));
    const articles = getLoadedArticles(state);
    articles.forEach((article) => {
      const existingModerators = (removedModeratorIds && article.assignedModerators) ?
          article.assignedModerators.filter((user) => !removedModeratorIds.some((id) => id === user.id)) :
          article.assignedModerators;
      dispatch(updateArticleModeratorsComplete({ article, moderators: [...existingModerators, ...articleModerators] as Array<IUserModel> }));
    });
    articles.forEach((article) => dispatch(loadArticleModerators(article)));
  };
}

export type IUpdateCategoryModeratorsStartPayload = {
  category: ICategoryModel;
};
export const updateCategoryModeratorsStart: (payload: IUpdateCategoryModeratorsStartPayload) => Action<IUpdateCategoryModeratorsStartPayload> =
  createAction<IUpdateCategoryModeratorsStartPayload>('dashboard/UPDATE_CATEGORY_MODERATORS_START');

export type IUpdateCategoryModeratorsCompletePayload = {
  category: ICategoryModel;
  moderators: Array<IUserModel>;
};
export const updateCategoryModeratorsComplete: (payload: IUpdateCategoryModeratorsCompletePayload) => Action<IUpdateCategoryModeratorsCompletePayload> =
  createAction<IUpdateCategoryModeratorsCompletePayload>('dashboard/UPDATE_CATEGORY_MODERATORS_COMPLETE');

export function updateCategoryModerators(category: ICategoryModel, moderators: Array<IUserModel>): IThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    await dispatch(updateCategoryModeratorsStart({ category }));
    const moderatorIds = moderators.length > 0 ? moderators.map((u) => u.id) : [];
    const removedModeratorIds = getCategoryModeratorIds(getState())
        .toArray().filter((id) => !moderatorIds.some((modId) => modId === id));

    if (typeof(parseInt(category.id)) === 'number') {
      // post to service that adds/removes moderators to all articles for the category
      await updateCategoryAssignments(category.id, moderatorIds);
      // Go update state for the articles.
      await dispatch(updateArticleModeratorsByIds(moderatorIds, removedModeratorIds));
      const articles = getLoadedArticles(getState());
      articles.forEach((article) => dispatch(loadArticleModerators(article)));
    }
    await dispatch(updateCategoryModeratorsComplete({ category, moderators }));
  };
}
