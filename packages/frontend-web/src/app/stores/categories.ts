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

import { List } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';
import { ICategoryModel } from '../../models';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'categories'];
const CATEGORIES_DATA = [...STATE_ROOT, 'items'];

export const categoriesUpdated = createAction<List<ICategoryModel>>('global/CATEGORIES_UPDATED');

export function getCategories(state: IAppStateRecord): List<ICategoryModel> {
  return state.getIn(CATEGORIES_DATA);
}

export function getCategory(state: IAppStateRecord, id: string): ICategoryModel {
  return getCategories(state).find((c: ICategoryModel) => c.id === id);
}

export interface ICategoriesState {
  items: List<ICategoryModel>;
}

export interface ICategoriesStateRecord extends TypedRecord<ICategoriesStateRecord>, ICategoriesState {}

const CategoriesStateFactory = makeTypedFactory<ICategoriesState, ICategoriesStateRecord>({
  items: List<ICategoryModel>(),
});

export const reducer = handleActions<ICategoriesStateRecord, List<ICategoryModel>>( {
  [categoriesUpdated.toString()]: (state: ICategoriesStateRecord, { payload }: Action<List<ICategoryModel>>) => {
    return state.set('items', payload);
  },
}, CategoriesStateFactory());
