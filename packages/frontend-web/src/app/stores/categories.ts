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

import { fromJS, List, Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { combineReducers } from 'redux-immutable';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { ICategoryModel } from '../../models';
import { getUser as getCurrentUser } from '../auth';
import {
  countAssignedArticleComments,
  countDeferredArticleComments,
  IRecordListStateRecord,
  listModels,
  makeAJAXAction,
  makeRecordListReducer,
} from '../util';
import { IAppStateRecord, IThunkAction } from './index';

const STATE_ROOT = ['global', 'categories'];
const CATEGORIES_PREFIX = [...STATE_ROOT, 'categories'];
const CATEGORIES_HAS_DATA = [...CATEGORIES_PREFIX, 'hasData'];
const CATEGORIES_IS_LOADING = [...CATEGORIES_PREFIX, 'isFetching'];
const CATEGORIES_DATA = [...CATEGORIES_PREFIX, 'items'];
const CATEGORY_COUNTS_DATA = [...STATE_ROOT, 'categoryCounts', 'items'];
const ASSIGNMENTS_PREFIX = [...STATE_ROOT, 'assignments'];
const ASSIGNMENTS_DATA = [...ASSIGNMENTS_PREFIX, 'items'];
const DEFERRED_PREFIX = [...STATE_ROOT, 'deferred'];
const DEFERRED_DATA = [...DEFERRED_PREFIX, 'items'];

const loadCategoriesStart = createAction('global/LOAD_CATEGORIES_START');
const loadCategoriesComplete = createAction<object>('global/LOAD_CATEGORIES_COMPLETE');

type ICountCompletePayload = {
  count: number;
};
const countAssignmentsComplete = createAction<ICountCompletePayload>('global/COUNT_ASSIGNMENTS_COMPLETE');
const countDeferredComplete = createAction<ICountCompletePayload>('global/COUNT_DEFERRED_COMPLETE');

export function getCategories(state: IAppStateRecord): List<ICategoryModel> {
  return state.getIn(CATEGORIES_DATA);
}

export function getCategoryCounts(state: IAppStateRecord): Map<string, number> {
  return state.getIn(CATEGORY_COUNTS_DATA);
}

export function loadCategories(): IThunkAction<void> {
  return makeAJAXAction(
    () => listModels<ICategoryModel>('categories', { page: { limit: - 1 } }),
    loadCategoriesStart,
    loadCategoriesComplete,
    (state: IAppStateRecord) => state.getIn(CATEGORIES_HAS_DATA) && getCategories(state),
  );
}

export function getCategoriesIsLoading(state: IAppStateRecord): boolean {
  return state.getIn(CATEGORIES_IS_LOADING);
}

const {
  reducer: categoriesReducer,
} = makeRecordListReducer<ICategoryModel & { id: string }>(
  loadCategoriesStart.toString(),
  loadCategoriesComplete.toString(),
);

export function loadAssignmentCounts(): IThunkAction<void> {
  return async (dispatch, getState) => {
    const user = getCurrentUser(getState());
    const count = await countAssignedArticleComments(user.get('id'));

    return await dispatch(countAssignmentsComplete({ count }));
  };
}

export function loadDeferredCounts(): IThunkAction<void> {
  return async (dispatch) => {
    const count = await countDeferredArticleComments();

    return await dispatch(countDeferredComplete({ count }));
  };
}

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
  void                  | // loadCategoriesStart
  object                | // loadCategoriesComplete
  ICountCompletePayload   // countAssignmentsComplete, countDeferredComplete
>({
  [loadCategoriesStart.toString()]: (state) => (
    state
        .set('isFetching', true)
  ),

  [loadCategoriesComplete.toString()]: (state, { payload }: Action<object>) => {
    const result = fromJS(payload);

    const counts = result.get('data').reduce((sum: any, category: ICategoryModel) => {
      return sum.set(category.get('id').toString(), category.getIn(['attributes', 'unmoderatedCount']));
    }, Map<string, number>());

    return state
        .set('hasData', true)
        .set('isFetching', false)
        .update('items', (i: any) => i.merge(counts));
  },

  [countAssignmentsComplete.toString()]: (state, { payload: { count } }: Action<ICountCompletePayload>) => {
    return state.setIn(
      ['items', 'assignments'],
      count,
    );
  },

  [countDeferredComplete.toString()]: (state, { payload: { count } }: Action<ICountCompletePayload>) => {
    return state.setIn(
      ['items', 'deferred'],
      count,
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
