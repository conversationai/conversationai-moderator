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
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { combineReducers } from 'redux-immutable';
import { createStructuredSelector } from 'reselect';

import { IUserModel } from '../../../models';
import { logout } from '../../auth';
import { IAppStateRecord } from '../../stores';
import { getArticle } from '../../stores/articles';
import { getCategory, getGlobalCounts } from '../../stores/categories';
import { getCurrentUser, getCurrentUserIsAdmin, getUsers } from '../../stores/users';
import { isArticleContext } from '../routes';
import { Comments as PureComments, ICommentsProps } from './Comments';
import { reducer as commentDetailReducer } from './components/CommentDetail/store';
import { reducer as moderatedCommentsReducer } from './components/ModeratedComments';
import { newCommentsReducer } from './components/NewComments';
import { reducer as threadedCommentDetailReducer } from './components/ThreadedCommentDetail';

export { NewComments } from './components/NewComments';
export { TagSelector } from './components/TagSelector';
export { ModeratedComments } from './components/ModeratedComments';
export { CommentDetail } from './components/CommentDetail';
export { ThreadedCommentDetail } from './components/ThreadedCommentDetail';

export const reducer: any = combineReducers({
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
      article: (state: IAppStateRecord, {  match: { params }}: ICommentsProps) => (
        isArticleContext(params) && getArticle(state, params.contextId)
      ),
      category: (state: IAppStateRecord, {  match: { params }}: ICommentsProps) => {
        if (isArticleContext(params)) {
          const article = getArticle(state, params.contextId);
          return getCategory(state, article.categoryId);
        }
        else if (params.contextId !== 'all') {
          return getCategory(state, params.contextId);
        }
      },
      moderators: (state: IAppStateRecord, { match: { params }}: ICommentsProps) => {
        if (!isArticleContext(params)) {
          return List<IUserModel>();
        }

        const article = getArticle(state, params.contextId);
        const users = getUsers(state);
        return List<IUserModel>(article.assignedModerators.map((userId) => users.get(userId)));
      },
      globalCounts: getGlobalCounts,
    }),
    (dispatch) => ({
      logout: () => dispatch(logout()),
    }),
  ),
)(PureComments);
