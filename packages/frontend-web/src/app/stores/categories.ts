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

import { List, Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';
import { ICategoryModel, ModelId } from '../../models';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'categories'];
const DATA = [...STATE_ROOT, 'items'];
const INDEX = [...STATE_ROOT, 'index'];

export const categoriesLoaded = createAction<List<ICategoryModel>>('global/CATEGORIES_LOADED');
export const categoryUpdated = createAction<ICategoryModel>('global/CATEGORY_UPDATED');

export function getCategories(state: IAppStateRecord): List<ICategoryModel> {
  return state.getIn(DATA);
}

export function getCategory(state: IAppStateRecord, categoryId: ModelId): ICategoryModel {
  const categories: List<ICategoryModel> = state.getIn(DATA);
  const index: Map<ModelId, number> = state.getIn(INDEX);
  return categories.get(index.get(categoryId));
}

export interface ICategoriesState {
  items: List<ICategoryModel>;
  index: Map<ModelId, number>;
}

export interface ICategoriesStateRecord extends TypedRecord<ICategoriesStateRecord>, ICategoriesState {}

const CategoriesStateFactory = makeTypedFactory<ICategoriesState, ICategoriesStateRecord>({
  items: List<ICategoryModel>(),
  index: Map<ModelId, number>(),
});

export const reducer = handleActions<ICategoriesStateRecord, List<ICategoryModel>| ICategoryModel>( {
  [categoriesLoaded.toString()]: (state: ICategoriesStateRecord, { payload }: Action<List<ICategoryModel>>) => {
    const index = payload.map((v, i) => ([v.id, i]));
    return state
      .set('items', payload)
      .set('index', index);
  },
  [categoryUpdated.toString()]: (state: ICategoriesStateRecord, { payload }: Action<ICategoryModel>) => {
    const index = state.get('index').get(payload.id);
    if (index) {
      return state.set('items', state.get('items').set(index, payload));
    }
    return state
      .set('items', state.get('items').append(payload))
      .set('index', state.get('index').set(payload.id, payload));
  },
}, CategoriesStateFactory());
