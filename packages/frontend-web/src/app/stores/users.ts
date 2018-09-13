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

import {List} from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

import { IUserModel } from '../../models';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'users'];
const USERS_DATA = [...STATE_ROOT, 'items'];

export const usersUpdated = createAction<List<IUserModel>>(
  'all-users/USERS_UPDATED',
);

export function getUsers(state: IAppStateRecord): List<IUserModel> {
  return state.getIn(USERS_DATA);
}

export function getUserById(state: IAppStateRecord, userId: string): IUserModel {
  return state.getIn(USERS_DATA).find((user: IUserModel) => user.id === userId);
}

export interface IUsersState {
  items: List<IUserModel>;
}

export interface IUsersStateRecord extends TypedRecord<IUsersStateRecord>, IUsersState {}

const StateFactory = makeTypedFactory<IUsersState, IUsersStateRecord>({
  items: List<IUserModel>(),
});

const reducer = handleActions<IUsersStateRecord, List<IUserModel>>( {
  [usersUpdated.toString()]: (state: IUsersStateRecord, { payload }: Action<List<IUserModel>>) => {
    return (
      state
        .set('items', payload)
    );
  },
}, StateFactory());

export { reducer };
