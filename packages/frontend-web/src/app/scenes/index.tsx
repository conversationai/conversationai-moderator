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

import { useSelector } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router';

import { SplashRoot } from '../components';
import { getCurrentUserIsAdmin } from '../stores/users';
import {
  Comments,
  TagSelector,
} from './Comments';
import {
  dashboardBase,
  rangesBase,
  searchBase,
  settingsBase,
  tagSelectorBase,
} from './routes';
import { Search } from './Search';
import { Ranges } from './Settings';
import { Settings } from './Settings/Settings';
import { TableFrame } from './Tables/TableFrame';

function redirect(to: string) {
  return () => {
    return <Redirect to={to}/>;
  };
}

export function AppRoot() {
  const isAdmin = useSelector(getCurrentUserIsAdmin);
  return (
    <Switch>
      <Route exact path="/" render={redirect(`/${dashboardBase}`)} />
      <Route path={`/${dashboardBase}/:filter?/:sort?`} component={TableFrame}/>
      {isAdmin && <Route path={`/${settingsBase}`} component={Settings}/> }
      {isAdmin && <Route path={`/${rangesBase}`} component={Ranges}/> }
      <Route path={`/${searchBase}`} component={Search}/>
      <Route path={`/${tagSelectorBase}/:context/:contextId/:tag`} component={TagSelector} />
      <Route path={'/:context/:contextId'} component={Comments}/>
      <Route path={'/'} component={SplashRoot}/>
    </Switch>
  );
}
