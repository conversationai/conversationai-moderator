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

import Immutable from 'immutable';
import { isEmpty, pick } from 'lodash';
import qs from 'qs';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { browserHistory, match } from 'react-router';
import { trigger } from 'redial';
import {
  applyMiddleware,
  compose,
  createStore,
} from 'redux';
import { combineReducers } from 'redux-immutable';
import thunk from 'redux-thunk';
import { IRedialLocals } from '../types';

import {
  handleToken,
  reducer as authReducer,
  startAuthentication,
} from './auth';
import { APP_NAME } from './config';
import { validateID } from './platform/dataService';
import { reducer as scenesReducer, scenes as makeRoutes } from './scenes';
import { ErrorRoot } from './scenes/Root/components/ErrorRoot';
import { reducer as globalReducer } from './stores';
import { clearReturnURL, getReturnURL } from './util';

// Add the reducer to your store on the `routing` key
const store = createStore(
  combineReducers({
    scenes: scenesReducer,
    global: globalReducer,
    auth: authReducer,
  }),
  Immutable.Map(),
  compose(
    applyMiddleware(thunk),
    // TODO: Make this toggle based on environment
    //(window as any)['devToolsExtension'] ? (window as any)['devToolsExtension']() : (f: any) => f,    
  ),
);

const { dispatch, getState } = store;

const routes = makeRoutes(browserHistory);

export function startHistoryListener() {
  // Listen for route changes on the browser history instance:
  browserHistory.listen((location: any) => {
    // Match routes based on location object:
    match(
      { routes, location } as any,
      (_error, _redirectLocation, renderProps: any) => {
        if (!renderProps) { return; }

        // Get array of route handler components:
        const { components, params } = renderProps;

        // Validate URL to avoid security issues.
        Object.keys(params || {})
            .forEach((key) => {
              if (!key.endsWith('Id')) { return; }
              if (['all', 'deferred', 'assignments'].indexOf(params[key]) !== -1) { return; }

              validateID(params[key], key);
            });

        // Define locals to be provided to all lifecycle hooks:
        const locals: IRedialLocals = {
          path: renderProps.location.pathname,
          query: renderProps.location.query,
          params,

          // Allow lifecycle hooks to dispatch Redux actions:
          dispatch,
          getState,
        };

        // Don't fetch data for initial route, server has already done the work:
        if ((window as any)['INITIAL_STATE']) {
          // Delete initial data so that subsequent data fetches can occur:
          delete (window as any)['INITIAL_STATE'];
        } else {
          // Fetch mandatory data dependencies for 2nd route change onwards:
          trigger<IRedialLocals>('fetch', components, locals);
        }

        // Fetch deferred, client-only data dependencies:
        trigger<IRedialLocals>('defer', components, locals);
      },
    );
  });
}

function render(elem: HTMLElement) {
  ReactDOM.render(
    (
      <Provider store={store}>
        {routes}
      </Provider>
    ),
    elem,
  );
}

function renderError(elem: HTMLElement, errorMessage: string) {
  ReactDOM.render(<ErrorRoot errorMessage={errorMessage}/>, elem);
}

// Set window title.
window.document.title = APP_NAME;

// Let's rock
const queryString = window.location.search && qs.parse(window.location.search.replace(/^\?/, ''));

if (queryString && queryString['token']) {
  (async () => {
    try {
      await dispatch(handleToken(queryString['token'], queryString['csrf']) as any);

      const returnURL = getReturnURL();

      if (returnURL && !isEmpty(returnURL)) {
        clearReturnURL();
        window.location.href = `/#${returnURL.pathname}?${qs.stringify(returnURL.query)}`;
      } else {
        const returnDetails = pick(window.location, ['pathname', 'query']) as any;
        returnDetails.query = returnDetails.query || {};
        delete returnDetails.query.token;
        delete returnDetails.query.csrf;

        window.location.href = `/#${returnDetails.pathname}?${qs.stringify(returnDetails.query)}`;
      }
    } catch (e) {
      console.error(e);
      renderError(document.getElementById('app'), e.message);
    }
  })();
} else {
  (async () => {
    await dispatch(startAuthentication() as any);
    startHistoryListener();
    render(document.getElementById('app'));
  })();
}
