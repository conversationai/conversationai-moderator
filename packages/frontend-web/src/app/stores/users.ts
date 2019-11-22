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

import { IUserModel, ModelId } from '../../models';
import { IAppState } from '../appstate';
import { getMyUserId } from '../auth';

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

export function getUsers(state: IAppState): Map<ModelId, IUserModel> {
  return state.global.users.humans;
}

export function getUser(state: IAppState, id: ModelId): IUserModel | null {
  return getUsers(state).get(id);
}

export function getCurrentUser(state: IAppState): IUserModel | null {
  const id = getMyUserId();
  if (!id) {
    return null;
  }
  return getUser(state, id);
}

export function userIsAdmin(user: IUserModel | null): boolean {
  return user && user.group === 'admin';
}

export function getCurrentUserIsAdmin(state: IAppState): boolean {
  return userIsAdmin(getCurrentUser(state));
}

export function getSystemUsers(type: string, state: IAppState): List<IUserModel> {
  if (type === USER_GROUP_SERVICE ||
    type === USER_GROUP_MODERATOR ||
    type === USER_GROUP_YOUTUBE) {
    return state.global.users[type];
  }
  return List<IUserModel>();
}

export interface IUsersState {
  humans: Map<ModelId, IUserModel>;
  [USER_GROUP_SERVICE]: List<IUserModel>;
  [USER_GROUP_MODERATOR]: List<IUserModel>;
  [USER_GROUP_YOUTUBE]: List<IUserModel>;
}

const reducer = handleActions<Readonly<IUsersState>, List<IUserModel> | ILoadSystemUsers>( {
  [usersUpdated.toString()]: (state: Readonly<IUsersState>, { payload }: Action<List<IUserModel>>) => {
    const users = Map<ModelId, IUserModel>(payload.map((v) => ([v.id, v])));
    return {...state, humans: users};
  },
  [systemUsersLoaded.toString()]: (state: Readonly<IUsersState>, { payload }: Action<ILoadSystemUsers>) => {
    if (payload.type === USER_GROUP_SERVICE ||
      payload.type === USER_GROUP_MODERATOR ||
      payload.type === USER_GROUP_YOUTUBE) {
      return {...state, [payload.type]: payload.users};
    }
    return state;
  },
}, {
  humans: Map<ModelId, IUserModel>(),
  [USER_GROUP_SERVICE]: List<IUserModel>(),
  [USER_GROUP_MODERATOR]: List<IUserModel>(),
  [USER_GROUP_YOUTUBE]: List<IUserModel>(),
});

export { reducer };
