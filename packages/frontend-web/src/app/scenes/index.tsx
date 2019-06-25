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
import { Root } from './Root';
import { reducer as rootReducer } from './Root';
import * as routes from './routes';
import { Search, SearchResults } from './Search';
import { reducer as searchReducer } from './Search';
import { Settings } from './Settings';
import { ArticleTable, TableFrame } from './Tables';

export const reducer: any = combineReducers({
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
    <Route path="comments/:commentId" component={CommentDetail} />
    <Route path="comments/:commentId/:originatingCommentId/replies" component={ThreadedCommentDetail} />
  </Route>
);

export const scenes = (history: any) => (
  <Router history={history}>
    <Route path="/" component={Root}>
      <IndexRedirect to={routes.dashboardBase} />
      <Route path="/" component={TableFrame}>
        <Route path={routes.dashboardBase} component={ArticleTable}/>
        <Route path={`${routes.dashboardBase}/:filter/:sort`} component={ArticleTable}/>
        <Route path={`${routes.dashboardBase}/:filter`} component={ArticleTable}/>
      </Route>
      <Route path={routes.searchBase} component={Search}>
        <IndexRoute component={SearchResults} />
      </Route>
      <Route path={routes.settingsBase} component={Settings} />
      <Route path={routes.articleBase}>
        {commentsRoutes(':articleId')}
      </Route>
      <Route path={routes.categoryBase}>
        <IndexRedirect to="all" />
        {commentsRoutes(':categoryId')}
      </Route>
      <Route path={`${routes.tagSelectorBase}/:context/:contextId/:tag`} component={TagSelector} />
    </Route>
  </Router>
);
