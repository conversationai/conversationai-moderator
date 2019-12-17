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
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { IAppState } from '../../appstate';
import { getArticle } from '../../stores/articles';
import { getCategory, getGlobalCounts } from '../../stores/categories';
import { isArticleContext } from '../routes';
import { Comments as PureComments, ICommentsProps } from './Comments';

export { NewComments } from './components/NewComments';
export { TagSelector } from './components/TagSelector';
export { ModeratedComments } from './components/ModeratedComments';
export { CommentDetail } from './components/CommentDetail';
export { ThreadedCommentDetail } from './components/ThreadedCommentDetail';

export const Comments = compose(
  connect(createStructuredSelector({
      article: (state: IAppState, {  match: { params }}: ICommentsProps) => (
        isArticleContext(params) && getArticle(state, params.contextId)
      ),
      category: (state: IAppState, {  match: { params }}: ICommentsProps) => {
        if (isArticleContext(params)) {
          const article = getArticle(state, params.contextId);
          return getCategory(state, article.categoryId);
        }
        else if (params.contextId !== 'all') {
          return getCategory(state, params.contextId);
        }
      },
      globalCounts: getGlobalCounts,
    }),
  ),
  withRouter,
)(PureComments);
