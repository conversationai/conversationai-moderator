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

import { Set } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { IArticleModel, ICategoryModel, ModelId } from '../../models';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'moderators'];
const ARTICLE_MODERATOR_IDS_DATA = [...STATE_ROOT, 'articleModerators'];
const CATEGORY_MODERATOR_IDS_DATA = [...STATE_ROOT, 'categoryModerators'];
const ARTICLE_DATA = [...STATE_ROOT, 'article'];

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

export const addModeratorToCategory: (payload: IAddRemoveModeratorPayload) => Action<IAddRemoveModeratorPayload> =
  createAction<IAddRemoveModeratorPayload>(
    'assign-moderators/ADD_MODERATOR_TO_CATEGORY',
  );

export const removeModeratorFromCategory: (payload: IAddRemoveModeratorPayload) => Action<IAddRemoveModeratorPayload> =
  createAction<IAddRemoveModeratorPayload>(
    'assign-moderators/REMOVE_MODERATOR_FROM_CATEGORY',
  );

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
  IAddRemoveModeratorPayload   // addModeratorToArticle, removeModeratorFromArticle, addModeratorToCategory, removeModeratorFromCategory
>({
  [addModeratorToArticle.toString()]: (state, { payload }: Action<IAddRemoveModeratorPayload>) => (
    state.update('articleModerators', (s: any) => s.add(payload.userId))
  ),

  [removeModeratorFromArticle.toString()]: (state, { payload }: Action<IAddRemoveModeratorPayload>) => (
    state.update('articleModerators', (s: any) => s.delete(payload.userId))
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

export function getArticle(state: IAppStateRecord): IArticleModel {
  return state.getIn(ARTICLE_DATA);
}
