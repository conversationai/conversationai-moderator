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

import { List, Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { combineReducers } from 'redux-immutable';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';
import { ICategoryModel } from '../../models';
import {
  IRecordListStateRecord,
} from '../util';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'categories'];
const CATEGORIES_PREFIX = [...STATE_ROOT, 'categories'];
const CATEGORIES_DATA = [...CATEGORIES_PREFIX, 'items'];
const CATEGORY_COUNTS_DATA = [...STATE_ROOT, 'categoryCounts', 'items'];
const ASSIGNMENTS_PREFIX = [...STATE_ROOT, 'assignments'];
const ASSIGNMENTS_DATA = [...ASSIGNMENTS_PREFIX, 'items'];
const DEFERRED_PREFIX = [...STATE_ROOT, 'deferred'];
const DEFERRED_DATA = [...DEFERRED_PREFIX, 'items'];

export const categoriesUpdated = createAction<List<ICategoryModel>>('global/CATEGORIES_UPDATED');
export const assignmentCountUpdated = createAction<number>('global/ASSIGNMENT_COUNT_UPDATED');
export const deferredCountUpdated = createAction<number>('global/DEFERRED_COUNT_UPDATED');

export function getCategories(state: IAppStateRecord): List<ICategoryModel> {
  return state.getIn(CATEGORIES_DATA);
}

export function getCategoryCounts(state: IAppStateRecord): Map<string, number> {
  return state.getIn(CATEGORY_COUNTS_DATA);
}

export interface ICategoriesState {
  items: List<ICategoryModel>;
}

export interface ICategoriesStateRecord extends TypedRecord<ICategoriesStateRecord>, ICategoriesState {}

const CategoriesStateFactory = makeTypedFactory<ICategoriesState, ICategoriesStateRecord>({
  items: List<ICategoryModel>(),
});

const categoriesReducer = handleActions<ICategoriesStateRecord, List<ICategoryModel>>( {
  [categoriesUpdated.toString()]: (state: ICategoriesStateRecord, { payload }: Action<List<ICategoryModel>>) => {
    return state.set('items', payload);
  },
}, CategoriesStateFactory());

export function getAssignments(state: IAppStateRecord): any {
  return state.getIn(ASSIGNMENTS_DATA);
}

export function getDeferred(state: IAppStateRecord): any {
  return state.getIn(DEFERRED_DATA);
}

export interface ICategoryCountsState {
  hasData: boolean;
  isFetching: boolean;
  items: Map<string, number>;
}

export interface ICategoryCountsStateRecord extends TypedRecord<ICategoryCountsStateRecord>, ICategoryCountsState {}

const StateFactory = makeTypedFactory<ICategoryCountsState, ICategoryCountsStateRecord>({
  hasData: false,
  isFetching: false,
  items: Map<string, number>(),
});

const categoryCountsReducer = handleActions<
  ICategoryCountsStateRecord,
  List<ICategoryModel> | number
>({
  [categoriesUpdated.toString()]: (state, { payload }: Action<List<ICategoryModel>>) => {
    const counts = payload.reduce((sum, category) => {
      return sum.set(category.id.toString(), category.unmoderatedCount);
    }, Map<string, number>());

    return state
        .set('hasData', true)
        .set('isFetching', false)
        .update('items', (i: any) => i.merge(counts));
  },

  [assignmentCountUpdated.toString()]: (state, { payload }: Action<number>) => {
    return state.setIn(
      ['items', 'assignments'],
      payload,
    );
  },

  [deferredCountUpdated.toString()]: (state, { payload }: Action<number>) => {
    return state.setIn(
      ['items', 'deferred'],
      payload,
    );
  },
}, StateFactory());

export type IState = {
  categories: IRecordListStateRecord<ICategoryModel>;
  categoryCounts: ICategoryCountsStateRecord;
};

export const reducer: any = combineReducers<IState>({
  categories: categoriesReducer,
  categoryCounts: categoryCountsReducer,
});
