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

import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';
import { ICategoryModel, ModelId } from '../../models';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'categories'];
const INDEX = [...STATE_ROOT, 'index'];
const ARRAY = [...STATE_ROOT, 'array'];
const ACTIVE = [...STATE_ROOT, 'active'];

export const categoriesLoaded = createAction<Array<ICategoryModel>>('global/CATEGORIES_LOADED');
export const categoriesUpdated = createAction<Array<ICategoryModel>>('global/CATEGORIES_UPDATED');

export function getCategoryMap(state: IAppStateRecord): Map<ModelId, ICategoryModel> {
  return state.getIn(INDEX);
}

export function getCategories(state: IAppStateRecord): Array<ICategoryModel> {
  return state.getIn(ARRAY);
}

export function getActiveCategories(state: IAppStateRecord): Array<ICategoryModel> {
  return state.getIn(ACTIVE);
}

export function getCategory(state: IAppStateRecord, categoryId: ModelId): ICategoryModel {
  return getCategoryMap(state).get(categoryId);
}

export interface ISummaryCounts {
  unmoderatedCount: number;
  moderatedCount: number;
  deferredCount: number;
  approvedCount: number;
  highlightedCount: number;
  rejectedCount: number;
  flaggedCount: number;
  batchedCount: number;
}

export function getGlobalCounts(state: IAppStateRecord): ISummaryCounts {
  const categories = getCategories(state);
  const counts: ISummaryCounts = {
    unmoderatedCount: 0,
    moderatedCount: 0,
    deferredCount: 0,
    approvedCount: 0,
    highlightedCount: 0,
    rejectedCount: 0,
    flaggedCount: 0,
    batchedCount: 0,
  };

  for (const category of categories) {
    counts.unmoderatedCount += category.unmoderatedCount;
    counts.moderatedCount += category.moderatedCount;
    counts.deferredCount += category.deferredCount;
    counts.approvedCount += category.approvedCount;
    counts.highlightedCount += category.highlightedCount;
    counts.rejectedCount += category.rejectedCount;
    counts.flaggedCount += category.flaggedCount;
    counts.batchedCount += category.batchedCount;
  }
  return counts;
}

export interface ICategoriesState {
  index: Map<ModelId, ICategoryModel>;
  array: Array<ICategoryModel>;
  active: Array<ICategoryModel>;
}

export interface ICategoriesStateRecord extends TypedRecord<ICategoriesStateRecord>, ICategoriesState {}

const CategoriesStateFactory = makeTypedFactory<ICategoriesState, ICategoriesStateRecord>({
  index: new Map<ModelId, ICategoryModel>(),
  array: [],
  active: [],
});

export const reducer = handleActions<ICategoriesStateRecord, Array<ICategoryModel>>( {
  [categoriesLoaded.toString()]: (state: ICategoriesStateRecord, { payload }: Action<Array<ICategoryModel>>) => {
    const index = new Map<ModelId, ICategoryModel>(payload.map((v) => ([v.id, v])));
    const array = Array.from(index.values());
    return state.set('index', index)
      .set('array', array)
      .set('active', array.filter((c) => c.isActive));
  },
  [categoriesUpdated.toString()]: (state: ICategoriesStateRecord, { payload }: Action<Array<ICategoryModel>>) => {
    const index: Map<ModelId, ICategoryModel> = state.get('index');
    for (const category of payload) {
      index.set(category.id, category);
    }
    const array = Array.from(index.values());
    return state.set('index', index).set('array', array)
      .set('active', array.filter((c) => c.isActive));
  },
}, CategoriesStateFactory());
