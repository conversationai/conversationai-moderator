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

import { Iterable, List, Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';
import { ICategoryModel, ModelId } from '../../models';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'categories'];
const INDEX = [...STATE_ROOT, 'index'];

export const categoriesLoaded = createAction<List<ICategoryModel>>('global/CATEGORIES_LOADED');
export const categoriesUpdated = createAction<List<ICategoryModel>>('global/CATEGORIES_UPDATED');

export function getCategoryMap(state: IAppStateRecord): Map<ModelId, ICategoryModel> {
  return state.getIn(INDEX);
}

export function getCategories(state: IAppStateRecord): Iterable.Indexed<ICategoryModel> {
  return getCategoryMap(state).valueSeq();
}

export function getActiveCategories(state: IAppStateRecord): Array<ICategoryModel> {
  return getCategories(state).filter((c) => c.isActive);
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
  for (const c of categories.toArray()) {
    counts.unmoderatedCount += c.unmoderatedCount;
    counts.moderatedCount += c.moderatedCount;
    counts.deferredCount += c.deferredCount;
    counts.approvedCount += c.approvedCount;
    counts.highlightedCount += c.highlightedCount;
    counts.rejectedCount += c.rejectedCount;
    counts.flaggedCount += c.flaggedCount;
    counts.batchedCount += c.batchedCount;
  }
  return counts;
}

export interface ICategoriesState {
  index: Map<ModelId, ICategoryModel>;
}

export interface ICategoriesStateRecord extends TypedRecord<ICategoriesStateRecord>, ICategoriesState {}

const CategoriesStateFactory = makeTypedFactory<ICategoriesState, ICategoriesStateRecord>({
  index: Map<ModelId, ICategoryModel>(),
});

export const reducer = handleActions<ICategoriesStateRecord, List<ICategoryModel>| ICategoryModel>( {
  [categoriesLoaded.toString()]: (state: ICategoriesStateRecord, { payload }: Action<List<ICategoryModel>>) => {
    const index = Map<ModelId, ICategoryModel>(payload.map((v) => ([v.id, v])));
    return state.set('index', index);
  },
  [categoriesUpdated.toString()]: (state: ICategoriesStateRecord, { payload }: Action<List<ICategoryModel>>) => {
    return state.set('index', state.get('index').merge(payload.map((v) => ([v.id, v]))));
  },
}, CategoriesStateFactory());
