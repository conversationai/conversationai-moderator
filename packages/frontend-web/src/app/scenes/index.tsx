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

import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router';
import { combineReducers } from 'redux-immutable';

import { FocusRoot, focusRootReducer, SplashRoot} from '../components';
import { IAppStateRecord } from '../stores';
import { getCurrentUserIsAdmin } from '../stores/users';
import {
  Comments,
  reducer as commentsIndexReducer,
  TagSelector,
} from './Comments';
import {
  dashboardBase,
  searchBase,
  settingsBase,
  tagSelectorBase,
} from './routes';
import { Search } from './Search';
import { searchReducer } from './Search';
import { Settings } from './Settings';
import { TableFrame } from './Tables';

export const reducer: any = combineReducers({
  commentsIndex: commentsIndexReducer,
  search: searchReducer,
  root: focusRootReducer,
});

function redirect(to: string) {
  return () => {
    return <Redirect to={to}/>;
  };
}

function _AppRoot(props: {isAdmin: boolean}) {
  return (
    <FocusRoot>
      <Switch>
        <Route exact path="/" render={redirect(`/${dashboardBase}`)} />
        <Route path={`/${dashboardBase}/:filter?/:sort?`} component={TableFrame}/>
        {props.isAdmin &&
        <Route path={`/${settingsBase}`} component={Settings}/>
        }
        <Route path={`/${searchBase}`} component={Search}/>
        <Route path={`/${tagSelectorBase}/:context/:contextId/:tag`} component={TagSelector} />
        <Route path={'/:context/:contextId'} component={Comments}/>
        <Route path={'/'} component={SplashRoot}/>
      </Switch>
    </FocusRoot>
  );
}

// TODO: Replace with a hook when we upgrade react-redux and fixed type errors.
export const AppRoot = connect((state: IAppStateRecord) => {
  return {
    isAdmin: getCurrentUserIsAdmin(state),
  };
})(_AppRoot);
