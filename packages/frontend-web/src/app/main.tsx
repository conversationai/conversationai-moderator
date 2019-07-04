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
import { isEmpty } from 'lodash';
import qs from 'query-string';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import {
  applyMiddleware,
  compose,
  createStore,
} from 'redux';
import { combineReducers } from 'redux-immutable';
import thunk from 'redux-thunk';

import {
  handleToken,
  reducer as authReducer,
  startAuthentication,
} from './auth';
import { APP_NAME } from './config';
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
    // (window as any)['devToolsExtension'] ? (window as any)['devToolsExtension']() : (f: any) => f,
  ),
);

const { dispatch } = store;

const routes = makeRoutes();

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
const queryString = qs.parse(window.location.search);

if (queryString && queryString['token']) {
  (async () => {
    try {
      await dispatch(handleToken(queryString['token'] as string, queryString['csrf'] as string));

      // If we've saved off a pathname and search string, use that instead.
      // The original link - derived from the http referrer of the original request - doesn't
      // have the necessary search info.
      const returnURL = getReturnURL();
      // TODO: We'd really like to do this via the router so we don't refresh the page
      if (returnURL && !isEmpty(returnURL)) {
        // Forward to the saved URL
        window.location.href = `${returnURL.pathname}${returnURL.search}`;
      }
      else {
        // Strip off the CSRF stuff
        window.location.href = window.location.pathname;
      }
      clearReturnURL();
    } catch (e) {
      console.error(e);
      renderError(document.getElementById('app'), e.message);
    }
  })();
}
else {
  (async () => {
    await dispatch(startAuthentication() as any);
    render(document.getElementById('app'));
  })();
}
