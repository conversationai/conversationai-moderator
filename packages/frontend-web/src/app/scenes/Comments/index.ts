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

import { List } from 'immutable';
import { connect } from 'react-redux';
import { InjectedRouter, withRouter } from 'react-router';
import { provideHooks } from 'redial';
import { compose } from 'redux';
import { combineReducers } from 'redux-immutable';
import { createStructuredSelector } from 'reselect';
import { ICategoryModel, IUserModel } from '../../../models';
import { IRedialLocals } from '../../../types';
import { IAppState, IAppStateRecord } from '../../stores';
import { getArticleFromId } from '../../stores/articles';
import { getCategories, getCategory } from '../../stores/categories';
import { getCurrentUser, getCurrentUserIsAdmin, getUserMap } from '../../stores/users';
import { withLoader } from '../../utilx';
import { Comments as PureComments } from './Comments';

import {
  newCommentsReducer,
} from './components/NewComments';
export {
  NewComments,
} from './components/NewComments';
export {
  TagSelector,
} from './components/TagSelector';
import {
  reducer as moderatedCommentsReducer,
} from './components/ModeratedComments';
export {
  ModeratedComments,
} from './components/ModeratedComments';

import { reducer as commentDetailReducer } from './components/CommentDetail';
import { reducer as threadedCommentDetailReducer } from './components/ThreadedCommentDetail';
export { CommentDetail } from './components/CommentDetail';
export { ThreadedCommentDetail } from './components/ThreadedCommentDetail';

import {
  articleReducer,
  getArticle,
  getArticleIsLoading,
  getTabCountAdjustments,
  loadArticle,
  resetTabCountAdjuster,
  tabCountAdjustmentsReducer,
} from './store';

export const reducer: any = combineReducers({
  article: articleReducer,
  tabCountAdjustments: tabCountAdjustmentsReducer,
  newComments: newCommentsReducer,
  moderatedComments: moderatedCommentsReducer,
  commentDetail: commentDetailReducer,
  threadedCommentDetail: threadedCommentDetailReducer,
});

export const Comments = compose(
  withRouter,
  connect(createStructuredSelector({
    user: getCurrentUser,
    isAdmin: getCurrentUserIsAdmin,
    article: getArticle,
    category: (state: IAppStateRecord, { params }: any) => {
      if (params.categoryId && params.categoryId !== 'all') {
        return getCategory(state, params.categoryId);
      }
    },
    unmoderatedCount: (state: IAppStateRecord, { params }: any) => {
      const isArticleDetail = !!params.articleId;
      const adjustment = getTabCountAdjustments(state).get('unmoderated');

      let count;

      if (isArticleDetail) {
        const article = getArticleFromId(state, params.articleId);
        count = article ? article.unmoderatedCount : 0;
      } else {
        if (params.categoryId !== 'all') {
          const category = getCategory(state, params.categoryId);
          count = category ? category.unmoderatedCount : 0;
        } else {
          count = getCategories(state).reduce((sum: number, c: ICategoryModel) => sum + c.unmoderatedCount, 0);
        }
      }

      return count + adjustment;
    },
    moderatedCount: (state: IAppStateRecord, { params }: any) => {
      const isArticleDetail = !!params.articleId;
      const adjustment = getTabCountAdjustments(state).get('moderated');

      let count;

      if (isArticleDetail) {
        const article = getArticleFromId(state, params.articleId);
        count = article ? article.moderatedCount : 0;
      } else {
        if (params.categoryId !== 'all') {
          const category = getCategory(state, params.categoryId);
          count = category ? category.moderatedCount : 0;
        } else {
          count = getCategories(state).reduce((sum: number, c: ICategoryModel) => sum + c.moderatedCount, 0);
        }
      }

      return count + adjustment;
    },
    isLoading: (state: IAppStateRecord, { params }: any) => params.articleId && getArticleIsLoading(state),
    moderators: (state: IAppStateRecord, { params }: any) => {
      if (!params.articleId) { return List<IUserModel>(); }

      const article = getArticleFromId(state, params.articleId);
      const usersMap = getUserMap(state);
      return List<IUserModel>(article.assignedModerators.map((userId) => usersMap.get(userId)));
    },

    isArticleDetail: (_: any, { params }: any) => !!params.articleId,
    isCommentDetail: (_: any, { params }: any) => !!params.commentId,
    hideCommentHeader: (_: any, { params, routes }: any) => !!params.originatingCommentId || routes[3].path === 'tagselector',
    hasSearchHeader: (_: any, { routes }: any) => {
      return routes[1].path === 'search';
    },
    onAuthorSearchClick: (_: IAppState, { router }: { router: InjectedRouter }) => () => router.push('/search?searchByAuthor=true'),
  })) as any,
  provideHooks<IRedialLocals>({
    fetch: ({ dispatch, params: { articleId, categoryId } }) => {
      const isArticleDetail = !!articleId;

      dispatch(resetTabCountAdjuster({
        uid: isArticleDetail ? articleId : categoryId,
      }));

      return Promise.all([
        isArticleDetail
            ? dispatch(loadArticle(articleId))
            : Promise.resolve(),
      ]);
    },
  }),
  (c: any) => withLoader(c, 'isLoading'),
)(PureComments) as any;
