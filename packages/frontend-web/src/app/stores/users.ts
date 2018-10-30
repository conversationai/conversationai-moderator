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
import { Dispatch } from 'redux';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';

import { IUserModel } from '../../models';
import { getMyUserId } from '../auth';
import { listModels } from '../util';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'users'];
const USERS_DATA = [...STATE_ROOT, 'moderators'];
const YOUTUBE_USERS_DATA = [...STATE_ROOT, 'youtubeUsers'];

export const USER_GROUP_GENERAL = 'general';
export const USER_GROUP_ADMIN = 'admin';
export const USER_GROUP_SERVICE = 'service';
export const USER_GROUP_YOUTUBE = 'youtube';

export const usersUpdated = createAction<List<IUserModel>>(
  'all-users/USERS_UPDATED',
);

export interface ILoadSystemUsers { type: string; users: List<IUserModel>; }

const systemUsersLoaded = createAction<ILoadSystemUsers>(
  'system-users/SYSTEM_USERS_LOADED',
);

export function getUsers(state: IAppStateRecord): List<IUserModel> {
  return state.getIn(USERS_DATA);
}

export function getUser(state: IAppStateRecord, id: string): IUserModel | null {
  const users = getUsers(state);
  if (!users || users.size === 0) {
    return null;
  }
  return users.find((u) => u.id === id);
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
  if (type === USER_GROUP_YOUTUBE) {
    return state.getIn(YOUTUBE_USERS_DATA);
  }
  return List<IUserModel>();
}

export interface IUsersState {
  moderators: List<IUserModel>;
  youtubeUsers: List<IUserModel>;
}

export interface IUsersStateRecord extends TypedRecord<IUsersStateRecord>, IUsersState {}

const StateFactory = makeTypedFactory<IUsersState, IUsersStateRecord>({
  moderators: List<IUserModel>(),
  youtubeUsers: List<IUserModel>(),
});

const reducer = handleActions<IUsersStateRecord, List<IUserModel> | ILoadSystemUsers>( {
  [usersUpdated.toString()]: (state: IUsersStateRecord, { payload }: Action<List<IUserModel>>) => {
    return state.set('moderators', payload);
  },
  [systemUsersLoaded.toString()]: (state: IUsersStateRecord, { payload }: Action<ILoadSystemUsers>) => {
    if (payload.type === USER_GROUP_YOUTUBE) {
      state = state.set('youtubeUsers', payload.users);
    }
    return state;
  },
}, StateFactory());

export { reducer };

export async function loadSystemUsers(dispatch: Dispatch<IAppStateRecord>, type: string): Promise<void> {
  const result = await listModels<IUserModel>('users', {
    filters: {group: type},
    page: {limit: -1},
  });

  await dispatch(systemUsersLoaded({type, users: result.models}));
}
