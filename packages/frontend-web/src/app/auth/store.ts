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

const jwtDecode = require('jwt-decode');
import axios from 'axios';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';

import { checkAuthorization, disconnectNotifier } from '../platform/dataService';
import { getToken, saveToken } from '../platform/localStore';
import { IAppDispatch, IAppStateRecord, IThunkAction } from '../stores';
import { initialiseClientModel } from '../stores';
import { clearCSRF, getCSRF } from '../util';

import { IUserModel } from '../../models';

const startedAuthentication =
  createAction('auth/STARTED_AUTHENTICATION');
const failedAuthentication =
  createAction('auth/FAILED_AUTHENTICATION');
const completedAuthentication =
  createAction<number>('auth/COMPLETED_AUTHENTICATION');

export const logout: () => Action<void> = createAction('auth/LOGOUT');

export function setAxiosToken(token: string): void {
  // Use query string for auth.
  axios.interceptors.request.use((config) => {
    config.params = {
      token,
      ...(config.params || {}),
    };

    return config;
  });

  // Use header for auth.
  // axios.defaults.headers.common['Authorization'] = 'JWT ' + token;
}

{
  const token = getToken();
  if (token) {
    setAxiosToken(token);
  }
}

export function decodeToken(token: string): any {
  return jwtDecode(token);
}

async function completeAuthentication(token: string, dispatch: IAppDispatch): Promise<void> {
  saveToken(token);
  setAxiosToken(token);

  const data = decodeToken(token);
  await dispatch(completedAuthentication(data['user'] as number));
  await initialiseClientModel(dispatch);
}

export function handleToken(token: string, csrf: string): IThunkAction<void> {
  return async (dispatch) => {
    dispatch(startedAuthentication());

    verifyCSRF(csrf);

    setAxiosToken(token);

    await checkAuthorization();
    await completeAuthentication(token, dispatch);
  };
}

function verifyCSRF(csrf?: string): void {
  if (!csrf) {
    throw new Error(`CSRF not returned from backend`);
  }

  const storedCSRF = getCSRF();

  if (storedCSRF !== csrf) {
    throw new Error(`CSRF returned from backend did not match stored local version`);
  }

  clearCSRF();
}

function refreshToken(): IThunkAction<void> {
  return async (dispatch) => {
    await completeAuthentication(
      getToken(),
      dispatch,
    );
  };
}

export function startAuthentication(): IThunkAction<void> {
  return async (dispatch) => {
    dispatch(startedAuthentication());

    const localKey = getToken();

    if (localKey) {
      // try to validate
      try {
        await dispatch(refreshToken());
      } catch (e) {
        dispatch(failedAuthentication());
        console.error(e);
      }
    } else {
      dispatch(failedAuthentication());
    }
  };
}

export interface IAuthenticationState {
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  userId: number| null;
  user: IUserModel | null;
}

export interface IAuthenticationStateRecord extends TypedRecord<IAuthenticationStateRecord>, IAuthenticationState {}

const StateFactory = makeTypedFactory<IAuthenticationState, IAuthenticationStateRecord>({
  isAuthenticating: false,
  isAuthenticated: false,
  userId: null,
  user: null,
});

const initialState = StateFactory();

export const reducer = handleActions<
  IAuthenticationStateRecord,
  void       | // startedAuthentication, failedAuthentication, logout
  number       // completedAuthentication
>({
  [startedAuthentication.toString()]: (state) => (
    state
      .set('isAuthenticating', true)
  ),

  [failedAuthentication.toString()]: (state) => (
    state
      .set('isAuthenticating', false)
      .set('isAuthenticated', false)
  ),

  [completedAuthentication.toString()]: (state, { payload }: Action<number>) => (
    state
      .set('userId', payload)
      .set('isAuthenticating', false)
      .set('isAuthenticated', true)
  ),

  [logout.toString()]: (state) => {
    saveToken(null);
    disconnectNotifier();

    return state
      .set('isAuthenticating', false)
      .set('isAuthenticated', false)
      .set('userId', null);
  },
}, initialState);

export function getIsAuthenticating(state: IAppStateRecord): boolean {
  return state.getIn(['auth', 'isAuthenticating']);
}

export function getIsAuthenticated(state: IAppStateRecord): boolean {
  return state.getIn(['auth', 'isAuthenticated']);
}

export function getMyUserId(state: IAppStateRecord): string | null {
  const userId = state.getIn(['auth', 'userId']);
  if (!userId) {
    return null;
  }
  return userId.toString();
}
