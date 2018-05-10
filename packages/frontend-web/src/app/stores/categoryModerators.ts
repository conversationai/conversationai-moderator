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

import { fromJS, Map } from 'immutable';
import { List } from 'immutable';
import { createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { ICategoryModel, IUserModel } from '../../models';
import {
  convertItemFromJSONAPI,
  listRelationshipModels,
} from '../util';
import { IAppStateRecord, IThunkAction } from './index';
import { updateCategoryModeratorsComplete } from './moderators';

const loadCategoryModeratorsStart =
  createAction('category-moderators/LOAD_CATEGORY_MODERATORS_START');

const loadCategoryModeratorsComplete =
  createAction<Array<object>>('category-moderators/LOAD_CATEGORY_MODERATORS_COMPLETE');

type ISaveCategoryPayload = {
  category: ICategoryModel;
  moderators: List<IUserModel>;
};
export const saveCategory =
  createAction<ISaveCategoryPayload>('category-moderators/SAVE_CATEGORY');

const STATE_ROOT = ['global', 'categoryModerators'];
const CATEGORY_MODERATORS_DATA = [...STATE_ROOT, 'items'];

export interface ICategoryModeratorsState {
  hasData: boolean;
  isFetching: boolean;
  items: Map<string, List<IUserModel>>;
}

export interface ICategoryModeratorsStateRecord extends TypedRecord<ICategoryModeratorsStateRecord>, ICategoryModeratorsState {}

const StateFactory = makeTypedFactory<ICategoryModeratorsState, ICategoryModeratorsStateRecord>({
  hasData: false,
  isFetching: false,
  items: Map<string, List<IUserModel>>(),
});

export const reducer = handleActions<
  ICategoryModeratorsStateRecord,
  void                 | // loadCategoryModeratorsStart
  Array<object>        | // loadCategoryModeratorsComplete
  ISaveCategoryPayload   // saveCategory, updateCategoryModeratorsComplete
>({
  [loadCategoryModeratorsStart.toString()]: (state) => (
    state
        .set('isFetching', true)
  ),

  [loadCategoryModeratorsComplete.toString()]: (state, { payload }: { payload: Array<object> }) => (
    state
        .set('hasData', true)
        .set('isFetching', false)
        .set('items', fromJS(payload).reduce((sum: Map<string, List<IUserModel>>, s: Map<string, any>) => (
          sum.set(
            s.get('categoryId').toString(),
            s.get('moderators').map((m: object) => convertItemFromJSONAPI<IUserModel>(m)),
          )
        ), Map<string, List<IUserModel>>()))
  ),

  [saveCategory.toString()]: (state, { payload: { category, moderators } }: { payload: ISaveCategoryPayload}) => (
    state.setIn(['items', category.id.toString()], List(moderators))
  ),

  [updateCategoryModeratorsComplete.toString()]: (state, { payload: { category, moderators } }: { payload: ISaveCategoryPayload }) => (
    state.setIn(['items', category.id.toString()], List(moderators))
  ),
}, StateFactory());

export function getCategoryModerators(state: IAppStateRecord): List<IUserModel> {
  return state.getIn(CATEGORY_MODERATORS_DATA);
}

export function loadCategoryModerators(id: string): IThunkAction<Promise<void>> {
  return async (dispatch) => {
    dispatch(loadCategoryModeratorsStart());

    const result = await listRelationshipModels<IUserModel>('categories', id, 'assignedModerators', {
      page: { limit: -1 },
    });

    dispatch(loadCategoryModeratorsComplete([{
      categoryId: id,
      moderators: result.response.data,
    }]));
  };
}
