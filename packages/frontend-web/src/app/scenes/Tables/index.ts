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

import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { getMyUserId } from '../../auth';
import { getWebsocketState, IAppStateRecord } from '../../stores';
import { getArticles } from '../../stores/articles';
import { getCategories, getCategoryMap } from '../../stores/categories';
import { getCurrentUser, getCurrentUserIsAdmin, getUsers } from '../../stores/users';
import { withLoader } from '../../utilx';
import { ArticleTable as PureArticleTable, IIArticleTableProps } from './ArticleTable';
import { TableFrame as PureTableFrame } from './TableFrame';

const baseSelector = createStructuredSelector({
  myUserId: getMyUserId,
  categories: getCategoryMap,
  selectedCategory: (state: IAppStateRecord, { params }: IIArticleTableProps) => {
    const m = /category=(\d+)/.exec(params.filter);
    if (!m) {
      return null;
    }

    return getCategoryMap(state).get(m[1]);
  },
  articles: getArticles,
  users: getUsers,
});

export const ArticleTable: React.ComponentClass<{}> = compose(
  withRouter,
  connect(baseSelector),
)(PureArticleTable);

export const TableFrame: React.ComponentClass<{}> = compose(
  withRouter,
  connect(createStructuredSelector({
    isLoading: (state: IAppStateRecord) => !getWebsocketState(state),
    user: getCurrentUser,
    isAdmin: getCurrentUserIsAdmin,
    categories: getCategories,
  })),
  (c:  any) => withLoader(c, 'isLoading'),
)(PureTableFrame);
