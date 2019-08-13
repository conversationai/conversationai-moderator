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

import { IUserModel, ModelId } from '../../models';
import { getMyUserId } from '../auth';
import { IAppStateRecord } from './appstate';

const STATE_ROOT = ['global', 'users'];
const USERS_DATA = [...STATE_ROOT, 'humans'];

export const USER_GROUP_GENERAL = 'general';
export const USER_GROUP_ADMIN = 'admin';
export const USER_GROUP_SERVICE = 'service';
export const USER_GROUP_MODERATOR = 'moderator';
export const USER_GROUP_YOUTUBE = 'youtube';

export const usersUpdated = createAction<List<IUserModel>>(
  'all-users/USERS_UPDATED',
);

export interface ILoadSystemUsers { type: string; users: List<IUserModel>; }

export const systemUsersLoaded = createAction<ILoadSystemUsers>(
  'system-users/SYSTEM_USERS_LOADED',
);

export function getUsers(state: IAppStateRecord): Map<ModelId, IUserModel> {
  return state.getIn(USERS_DATA);
}

export function getUser(state: IAppStateRecord, id: ModelId): IUserModel | null {
  return getUsers(state).get(id);
}

export function getCurrentUser(state: IAppStateRecord): IUserModel | null {
  const id = getMyUserId(state);
  if (!id) {
    return null;
  }
  return getUser(state, id);
}

export function userIsAdmin(user: IUserModel | null): boolean {
  return user && user.get('group') === 'admin';
}

export function getCurrentUserIsAdmin(state: IAppStateRecord): boolean {
  return userIsAdmin(getCurrentUser(state));
}

export function getSystemUsers(type: string, state: IAppStateRecord): List<IUserModel> {
  if (type === USER_GROUP_SERVICE ||
    type === USER_GROUP_MODERATOR ||
    type === USER_GROUP_YOUTUBE) {
    return state.getIn([...STATE_ROOT, type]);
  }
  return List<IUserModel>();
}

export interface IUsersState {
  humans: List<IUserModel>;
  [USER_GROUP_SERVICE]: List<IUserModel>;
  [USER_GROUP_MODERATOR]: List<IUserModel>;
  [USER_GROUP_YOUTUBE]: List<IUserModel>;
}

export interface IUsersStateRecord extends TypedRecord<IUsersStateRecord>, IUsersState {}

const StateFactory = makeTypedFactory<IUsersState, IUsersStateRecord>({
  humans: List<IUserModel>(),
  [USER_GROUP_SERVICE]: List<IUserModel>(),
  [USER_GROUP_MODERATOR]: List<IUserModel>(),
  [USER_GROUP_YOUTUBE]: List<IUserModel>(),
});

const reducer = handleActions<IUsersStateRecord, List<IUserModel> | ILoadSystemUsers>( {
  [usersUpdated.toString()]: (state: IUsersStateRecord, { payload }: Action<List<IUserModel>>) => {
    const users = Map<ModelId, IUserModel>(payload.map((v) => ([v.id, v])));
    return state.set('humans', users);
  },
  [systemUsersLoaded.toString()]: (state: IUsersStateRecord, { payload }: Action<ILoadSystemUsers>) => {
    if (payload.type === USER_GROUP_SERVICE ||
      payload.type === USER_GROUP_MODERATOR ||
      payload.type === USER_GROUP_YOUTUBE) {
      state = state.set(payload.type, payload.users);
    }
    return state;
  },
}, StateFactory());

export { reducer };
