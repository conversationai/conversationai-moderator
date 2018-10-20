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

import { IndexRedirect, IndexRoute, Route, Router } from 'react-router';
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
import {
  Dashboard,
  DashboardArticles,
  reducer as dashboardReducer,
} from './Dashboard';
import { Root } from './Root';
import { reducer as rootReducer } from './Root';
import { Search, SearchResults } from './Search';
import { reducer as searchReducer } from './Search';
import { Settings } from './Settings';

export const reducer: any = combineReducers({
  dashboard: dashboardReducer,
  commentsIndex: commentsIndexReducer,
  search: searchReducer,
  root: rootReducer,
});

const commentsRoutes = (path: string) => (
  <Route path={path} component={Comments}>
    <IndexRedirect to="new" />
    <Route path="new">
      <IndexRedirect to="SUMMARY_SCORE" />
      <Route path=":tag" component={NewComments}/>
    </Route>
    <Route path="moderated">
      <IndexRedirect to="approved" />
      <Route path=":tag" component={ModeratedComments}/>
    </Route>
    <Route path="tagselector" component={TagSelector} />
    <Route path="comments/:commentId" component={CommentDetail} />
    <Route path="comments/:commentId/:originatingCommentId/replies" component={ThreadedCommentDetail} />
  </Route>
);

export const scenes = (history: any) => (
  <Router history={history}>
    <Route path="/" component={Root}>
      <IndexRedirect to="dashboard/all" />
      <Route path="dashboard" component={Dashboard}>
        <IndexRedirect to="all" />
        <Route path=":categoryId" component={DashboardArticles} />
      </Route>
      <Route path="search" component={Search}>
        <IndexRoute component={SearchResults} />
        <Route path="articles/:articleId/comments/:commentId" component={CommentDetail} />
      </Route>
      <Route path="settings" component={Settings} />
      <Route path="articles">
        {commentsRoutes(':articleId')}
      </Route>
      <Route path="categories">
        <IndexRedirect to="all" />
        {commentsRoutes(':categoryId')}
      </Route>
    </Route>
  </Router>
);
