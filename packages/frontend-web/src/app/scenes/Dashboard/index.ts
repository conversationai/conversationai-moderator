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

import { List } from 'immutable';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { provideHooks } from 'redial';
import { compose } from 'redux';
import { combineReducers } from 'redux-immutable';
import { createStructuredSelector } from 'reselect';
import { CategoryModel } from '../../../models';
import { IRedialLocals } from '../../../types';
import { getIsAdmin, getUser as getCurrentUser } from '../../auth';
import { IAppStateRecord } from '../../stores';
import {
  getCategories,
  getCategoriesIsLoading,
  loadCategories,
} from '../../stores/categories';
import { getUsersIsLoading, loadUsers } from '../../stores/users';
import { reducer as articlesReducer } from './components/DashboardArticles';
import { Dashboard as PureDashboard } from './Dashboard';

export const reducer: any = combineReducers({
  articles: articlesReducer,
});

export { DashboardArticles } from './components/DashboardArticles';

export const Dashboard = compose(
  withRouter,
  connect(createStructuredSelector({
    user: getCurrentUser,
    isAdmin: getIsAdmin,
    workload: () => (List([
      CategoryModel({
        id: 'assignments',
        label: 'Assignments',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      }),
      CategoryModel({
        id: 'deferred',
        label: 'Deferred',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      }),
    ])),
    isLoading: (state: IAppStateRecord) => getCategoriesIsLoading(state) || getUsersIsLoading(state),
    categories: (state: IAppStateRecord) => (List([
      CategoryModel({
        id: 'all',
        label: 'All',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      }),
    ]).concat(getCategories(state))),
    articles: (state: IAppStateRecord) => state.getIn([
      'scenes',
      'dashboard',
      'articles',
      'items',
    ]),
  })) as any,
  provideHooks<IRedialLocals>({
    fetch: ({ dispatch }) => Promise.all([
      dispatch(loadCategories()),
      dispatch(loadUsers()),
    ]),
  }),
)(PureDashboard) as any;
