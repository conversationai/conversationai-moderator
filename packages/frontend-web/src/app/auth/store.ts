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

const jwtDecode = require('jwt-decode');
import axios from 'axios';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { RESTRICT_TO_SESSION } from '../config';
import { IAppDispatch, IAppStateRecord, IThunkAction } from '../stores';
import { checkAuthorization, clearCSRF, getCSRF, getModel } from '../util';

import { createAction, handleActions } from 'redux-actions';
import { IUserModel } from '../../models';

const LOCAL_STORAGE_TOKEN_KEY = 'moderator/auth_token';
const storage = () => RESTRICT_TO_SESSION ? sessionStorage : localStorage;

const startedAuthentication =
  createAction<void>('auth/STARTED_AUTHENTICATION');
const failedAuthentication =
  createAction<void>('auth/FAILED_AUTHENTICATION');
type ICompletedAuthentificationPayload = IUserModel;
const completedAuthentication =
  createAction<ICompletedAuthentificationPayload>('auth/COMPLETED_AUTHENTICATION');
export const logout = createAction<void>('auth/LOGOUT');

function setAxiosToken(token: string): void {
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

if (storage()[LOCAL_STORAGE_TOKEN_KEY]) {
  setAxiosToken(storage()[LOCAL_STORAGE_TOKEN_KEY]);
}

function decodeToken(token: string): any {
  return jwtDecode(token);
}

export function getToken(): string | undefined {
  return storage()[LOCAL_STORAGE_TOKEN_KEY];
}

function saveToken(token: string): string {
  if (token) {
    storage()[LOCAL_STORAGE_TOKEN_KEY] = token;
  } else {
    delete storage()[LOCAL_STORAGE_TOKEN_KEY];
  }

  return token;
}

async function loadUser(id: string): Promise<IUserModel> {
  const data = await getModel<IUserModel>('users', id);

  return data.model;
}

async function completeAuthentication(token: string, dispatch: IAppDispatch): Promise<void> {
  saveToken(token);
  setAxiosToken(token);

  const data = decodeToken(token);
  const user = await loadUser(data['user']);
  await dispatch(completedAuthentication(user));
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
      storage()[LOCAL_STORAGE_TOKEN_KEY],
      dispatch,
    );
  };
}

export function startAuthentication(): IThunkAction<void> {
  return async (dispatch) => {
    dispatch(startedAuthentication());

    const localKey = storage()[LOCAL_STORAGE_TOKEN_KEY];

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
  user: IUserModel | null;
}

export interface IAuthenticationStateRecord extends TypedRecord<IAuthenticationStateRecord>, IAuthenticationState {}

const StateFactory = makeTypedFactory<IAuthenticationState, IAuthenticationStateRecord>({
  isAuthenticating: false,
  isAuthenticated: false,
  user: null,
});

const initialState = StateFactory();

export const reducer = handleActions<
  IAuthenticationStateRecord,
  void                              | // startedAuthentication, failedAuthentication, logout
  ICompletedAuthentificationPayload   // completedAuthentication
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

  [completedAuthentication.toString()]: (state, { payload }: { payload: ICompletedAuthentificationPayload }) => (
    state
      .set('isAuthenticating', false)
      .set('isAuthenticated', true)
      .set('user', payload)
  ),

  [logout.toString()]: (state) => {
    saveToken(null);

    return state
      .set('isAuthenticating', false)
      .set('isAuthenticated', false)
      .set('user', null);
  },
}, initialState);

export function getIsAuthenticating(state: IAppStateRecord): boolean {
  return state.getIn(['auth', 'isAuthenticating']);
}

export function getIsAuthenticated(state: IAppStateRecord): boolean {
  return state.getIn(['auth', 'isAuthenticated']);
}

export function getUser(state: IAppStateRecord): IUserModel {
  return state.getIn(['auth', 'user']);
}

export function isAdmin(user: IUserModel): boolean {
  return user.get('group') === 'admin';
}

export function getIsAdmin(state: IAppStateRecord): boolean {
  return isAdmin(getUser(state));
}
