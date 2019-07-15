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
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import {
  applyMiddleware,
  compose,
  createStore,
} from 'redux';
import { combineReducers } from 'redux-immutable';
import thunk from 'redux-thunk';

import { AuthenticationStates, SystemStates, WebsocketStates } from '../types';
import {
  reducer as authReducer,
  start,
} from './auth/store';
import { ErrorRoot, SPLASH_STYLES, SplashRoot, ThemeRoot } from './components';
import { APP_NAME } from './config';
import { AppRoot, reducer as scenesReducer } from './scenes';
import { Login } from './scenes/Login';
import { reducer as globalReducer} from './stores';
import { COMMON_STYLES } from './stylesx';
import { css } from './utilx';

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

function _Root(props: React.PropsWithChildren<RouteComponentProps<{}>>) {
  const [error, setError] = React.useState<string>(null);
  const [authState, setAuthState] = React.useState<AuthenticationStates>('initialising');
  const [wsState, setWsState] = React.useState<WebsocketStates>('ws_connecting');

  function setState(state: SystemStates) {
    if (state.startsWith('ws_')) {
      setWsState(state as WebsocketStates);
    }
    else {
      setAuthState(state as AuthenticationStates);
    }
  }
  function setRoute(route: string) {
    props.history.replace(route);
  }

  React.useEffect(() => {
    start(store.dispatch, setState, setRoute, setError);
  }, []);

  if (error) {
    function retry() {
      setState('initialising');
      start(store.dispatch, setState, setRoute, setError);
    }
    return <ErrorRoot errorMessage={error} retry={retry}/>;
  }

  function message(msg: string) {
    return (
      <SplashRoot>
        <div key="message" {...css(SPLASH_STYLES.header2Tag, COMMON_STYLES.fadeIn)}>{msg}...</div>
      </SplashRoot>
    );
  }

  switch (authState) {
    case 'initialising':
      return message('Initialising');
    case 'check_token':
      return message('Checking');
    case 'unauthenticated':
      return <Login/>;
  }

  if (wsState === 'ws_connecting') {
    return message('Connecting');
  }
  return <AppRoot/>;
}

const Root = withRouter(_Root);

ReactDOM.render(
  <Provider store={store}>
    <ThemeRoot>
      <BrowserRouter>
        <Root/>;
      </BrowserRouter>
    </ThemeRoot>
  </Provider>,
  document.getElementById('app'),
);

// Set window title.
window.document.title = APP_NAME;
