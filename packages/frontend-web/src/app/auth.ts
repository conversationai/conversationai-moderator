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

import axios from 'axios';
import JwtDecode from 'jwt-decode';
import { isEmpty } from 'lodash';
import qs from 'query-string';

import { AuthenticationStates, SystemStates, WebsocketStates } from '../types';
import { IAppDispatch } from './appstate';
import { checkAuthorization, checkServerStatus, setUserId } from './platform/dataService';
import { getToken, saveToken } from './platform/localStore';
import { connectNotifier, disconnectNotifier, STATUS_RESET, STATUS_UP }  from './platform/websocketService';
import { articlesLoaded, articlesUpdated } from './stores/articles';
import { categoriesLoaded, categoriesUpdated } from './stores/categories';
import { assignmentCountUpdated } from './stores/counts';
import { preselectsUpdated } from './stores/preselects';
import { rulesUpdated } from './stores/rules';
import { taggingSensitivitiesUpdated } from './stores/taggingSensitivities';
import { tagsUpdated } from './stores/tags';
import { usersUpdated } from './stores/users';
import { clearCSRF, clearReturnURL, getCSRF, getReturnURL } from './util';

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

export function decodeToken(token: string): any {
  return JwtDecode(token);
}

let userId: string | null;

async function connectWebsocket(
  dispatch: IAppDispatch,
  setState: (state: WebsocketStates) => void,
) {
  setState('ws_connecting');
  connectNotifier(
    (status: string) => {
      if (status === STATUS_UP) {
        setState('ws_gtg');
      }
      else {
        setState('ws_connecting');
        if (status === STATUS_RESET) {
          logout();
        }
      }
    },
    (data) => {
      dispatch(usersUpdated(data.users));
      dispatch(tagsUpdated(data.tags));
      dispatch(taggingSensitivitiesUpdated(data.taggingSensitivities));
      dispatch(rulesUpdated(data.rules));
      dispatch(preselectsUpdated(data.preselects));
    },
    (data) => {
      dispatch(categoriesLoaded(data.categories));
      dispatch(articlesLoaded(data.articles));
    },
    (data) => {
      if (data.categories) {
        dispatch(categoriesUpdated(data.categories));
      }
      if (data.articles) {
        dispatch(articlesUpdated(data.articles));
      }
    },
    (data) => {
      dispatch(assignmentCountUpdated(data.assignments));
    },
  );
}

async function completeAuthentication(
  dispatch: IAppDispatch,
  setState: (state: SystemStates) => void,
): Promise<void> {
  const token = getToken();
  setAxiosToken(token);
  await checkAuthorization();

  const data = decodeToken(token);
  userId = (data['user'] as number).toString();
  setUserId(userId);
  await connectWebsocket(dispatch, setState);
  setState('gtg');
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

// Returns the final destination to go to after the redirect.
async function handleLoginRedirect(
  dispatch: IAppDispatch,
  setState: (state: AuthenticationStates) => void,
  queryString: qs.ParsedQuery,
) {
  verifyCSRF(queryString['csrf'] as string);
  saveToken(queryString['token'] as string);
  await completeAuthentication(dispatch, setState);
  const returnURL = getReturnURL();
  clearReturnURL();
  if (returnURL && !isEmpty(returnURL)) {
    // We've saved off a pathname and search string, so use that.
    return `${returnURL.pathname}${returnURL.search}`;
  }
  else {
    // We haven't got anything saved.  So use the current URL (derived from the http
    // referrer of the original request) but strip off the token and csrf stuff first
    return window.location.pathname;
  }
}

let setAuthenticationState: (state: AuthenticationStates) => void = null;

export async function start(
  dispatch: IAppDispatch,
  setState: (state: SystemStates) => void,
  setRoute: (route: string) => void,
  setError: (error: string) => void,
) {
  setAuthenticationState = setState;
  try {
    const status = await checkServerStatus();
    setState(status);
    if (status !== 's_gtg') {
      return;
    }
  }
  catch (e) {
    if (e.response) {
      // Server is there but ignoring/rejecting the healthchek.  Assume gtg
      setState('s_gtg');
    }
    else if (e.request) {
      // Server is not there
      setState('s_unavailable');
      return;
    }
    else {
      // Something else went wrong
      console.log(e);
      setError(`Something went wrong: ${e.message}`);
      return;
    }
  }

  try {
    const queryString = qs.parse(window.location.search);
    if (queryString && queryString['token']) {
      setState('check_token');
      setRoute(await handleLoginRedirect(dispatch, setState, queryString));
    }
    else if (getToken()) {
      setState('check_token');
      await completeAuthentication(dispatch, setState);
    }
    else {
      setState('unauthenticated');
    }
  }
  catch (e) {
    if (e.response) {
      // network error
      if (e.response.status === 401) {
        console.log('Token didn\'t work, so resetting');
        saveToken(null);
        setState('unauthenticated');
      }
      else {
        setError(`API connection error: ${e.response.status}: ${e.response.statusText}`);
      }
    }
    else if (e.message) {
      setError(e.message);
    }
    else {
      console.error(e);
      setError(`Internal error.  See console.`);
    }
  }
}

export function logout() {
  userId = null;
  saveToken(null);
  disconnectNotifier();
  setAuthenticationState('unauthenticated');
}

export function getMyUserId(): string | null {
  return userId;
}
