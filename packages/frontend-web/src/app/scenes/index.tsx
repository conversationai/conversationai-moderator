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

import { IndexRedirect, Redirect, Route, Router } from 'react-router';
import { combineReducers } from 'redux-immutable';

import {
  CommentDetail,
  Comments,
  ModeratedComments,
  NewComments,
  reducer as commentsIndexReducer,
  TagSelector,
  ThreadedCommentDetail,
} from './Comments';
import { Root } from './Root';
import { reducer as rootReducer } from './Root';
import * as routes from './routes';
import { Search } from './Search';
import { searchReducer } from './Search';
import { Settings } from './Settings';
import { ArticleTable, TableFrame } from './Tables';

export const reducer: any = combineReducers({
  commentsIndex: commentsIndexReducer,
  search: searchReducer,
  root: rootReducer,
});

export const scenes = (history: any) => (
  <Router history={history}>
    <Route path="/" component={Root}>
      <IndexRedirect to={routes.dashboardBase} />
      <Route path="/" component={TableFrame}>
        <Route path={routes.dashboardBase} component={ArticleTable}/>
        <Route path={`${routes.dashboardBase}/:filter/:sort`} component={ArticleTable}/>
        <Route path={`${routes.dashboardBase}/:filter`} component={ArticleTable}/>
      </Route>
      <Route path={routes.searchBase} component={Search}/>
      <Route path={routes.settingsBase} component={Settings} />
      <Redirect from={`/${routes.categoryBase}`} to={`/${routes.categoryBase}/all/new`}/>
      <Route path={':context'}>
        <Route path=":contextId" component={Comments}>
          <IndexRedirect to="new" />
          <Route path="new">
            <IndexRedirect to={routes.NEW_COMMENTS_DEFAULT_TAG} />
            <Route path=":tag" component={NewComments}/>
          </Route>
          <Route path="moderated">
            <IndexRedirect to="approved" />
            <Route path=":disposition" component={ModeratedComments}/>
          </Route>
          <Route path="comments/:commentId" component={CommentDetail} />
          <Route path="comments/:commentId/:originatingCommentId/replies" component={ThreadedCommentDetail} />
        </Route>
      </Route>
      <Route path={`${routes.tagSelectorBase}/:context/:contextId/:tag`} component={TagSelector} />
    </Route>
  </Router>
);
