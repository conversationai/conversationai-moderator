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

import { List } from 'immutable';
import { createAction } from 'redux-actions';
import { IUserModel } from '../../models';
import {
  listModels,
  makeAJAXAction,
  makeRecordListReducer,
 } from '../util';
import { IAppStateRecord, IThunkAction } from './index';

const STATE_ROOT = ['global', 'users'];
const USERS_DATA = [...STATE_ROOT, 'items'];
const USERS_LOADING_STATUS = [...STATE_ROOT, 'isFetching'];
const USERS_HAS_DATA = [...STATE_ROOT, 'hasData'];

const loadUsersStart = createAction(
  'all-users/LOAD_USERS_START',
);
const loadUsersComplete = createAction<object>(
  'all-users/LOAD_USERS_COMPLETE',
);

export function getUsers(state: IAppStateRecord): List<IUserModel> {
  return state.getIn(USERS_DATA);
}

export function getUserById(state: IAppStateRecord, userId: string): IUserModel {
  return state.getIn(USERS_DATA).find((user: IUserModel) => user.id === userId);
}

export function getUsersIsLoading(state: IAppStateRecord): boolean {
  return state.getIn(USERS_LOADING_STATUS);
}

export function loadUsers(): IThunkAction<void> {
  return makeAJAXAction(
    () => listModels('users', {
      page: { limit: -1 },
      filters: {
        group: ['admin', 'general'],
      },
    }),
    loadUsersStart,
    loadUsersComplete,
    (state: IAppStateRecord) => state.getIn(USERS_HAS_DATA) && getUsers(state),
  );
}

export type IUsersState = List<IUserModel>;

const { reducer } = makeRecordListReducer<IUserModel>(
  loadUsersStart.toString(),
  loadUsersComplete.toString(),
);

export { reducer };
