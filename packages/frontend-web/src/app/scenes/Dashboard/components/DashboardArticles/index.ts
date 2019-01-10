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

import { List, Map } from 'immutable';
import { connect } from 'react-redux';
import { provideHooks } from 'redial';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import { CategoryModel } from '../../../../../models';
import { IRedialLocals } from '../../../../../types';
import { IAppStateRecord } from '../../../../stores';
import { getCategories, getCategoryCounts } from '../../../../stores/categories';
import { articleSortDefinitions } from '../../../../utilx';
import {
  DashboardArticles as PureDashboardArticles,
} from './DashboardArticles';

import {
  changeArticleScope,
  getArticlePages,
  getArticleScope,
  getTotalItems,
  loadArticlePage,
} from './store';

import {
  fetchCurrentColumnSort,
  getCurrentColumnSort,
} from '../../../../stores/columnSorts';

import {
  getArticleModerators,
} from '../../../../stores/articleModerators';

import {
  getCategoryModerators,
  loadCategoryModerators,
} from '../../../../stores/categoryModerators';

export { reducers as reducer } from './store';
export const DashboardArticles = compose(
  connect(createStructuredSelector({
    articleModerators: getArticleModerators,
    categoryModerators: getCategoryModerators,
    articlePages: getArticlePages,
    totalArticleCount: getTotalItems,
    currentScope: getArticleScope,
    categories: (state: IAppStateRecord) => (List([
      CategoryModel({
        id: 'all',
        label: 'All',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      }),
    ]).concat(getCategories(state))),
    categoryCounts: (state: IAppStateRecord) => {
      const categoryCounts = getCategoryCounts(state);

      const combinedCount = categoryCounts.reduce((previousValue, currentValue) => {
        return previousValue + currentValue;
      }, 0);

      return categoryCounts.set('all', combinedCount);
    },
    getCurrentColumnSort: (state: IAppStateRecord) => {
      return (group: string, key: string) => getCurrentColumnSort(state, group, key);
    },
  })) as any,
  provideHooks<IRedialLocals>({
    fetch: async ({
      dispatch,
      params: {
        categoryId,
      },
    }) => {
      const columnSort = await dispatch(fetchCurrentColumnSort('dashboard', categoryId || 'all'));
      const sortDef = articleSortDefinitions[columnSort].sortInfo;

      if (categoryId === 'deferred') {
        return dispatch(changeArticleScope(Map({
          mode: 'deferred',
          sort: sortDef,
        })));
      } else if (categoryId === 'assignments') {
        await dispatch(changeArticleScope(Map({
          mode: 'assignments',
          sort: sortDef,
        })));
      } else {
        const categoryIdOrNull = categoryId === 'all' ? null : categoryId;

        if (categoryIdOrNull) {
          await dispatch(loadCategoryModerators(categoryIdOrNull));
        }

        await dispatch(changeArticleScope(Map({
          mode: 'category',
          categoryId: categoryIdOrNull,
          sort: sortDef,
        })));
      }

      return Promise.all([
        dispatch(loadArticlePage(0)),
      ]);
    },
  }),
)(PureDashboardArticles) as any;
