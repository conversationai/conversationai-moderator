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

import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { provideHooks } from 'redial';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import { ICommentModel } from '../../../models';
import { IRedialLocals } from '../../../types';
import { getCurrentUser } from '../../auth';
import { IAppDispatch } from '../../stores';
import { getTextSizes } from '../../stores/textSizes';
import {
  executeCommentListLoader,
  getAllCommentIds,
  getAreAllSelected,
  getAreAnyCommentsSelected,
  getCommentListHasLoaded,
  getCommentListIsLoading,
  getCurrentPagingIdentifier,
  getIsItemChecked,
  getSelectedCount,
  resetCommentIds,
  searchReducer,
  toggleSelectAll,
  toggleSingleItem,
} from './store';
export const reducer: any = searchReducer;
import { ICommentAction } from '../../../types';
import {
  approveComments,
  deferComments,
  highlightComments,
  rejectComments,
  resetComments,
  tagCommentSummaryScores,
} from '../../stores/commentActions';
import {
  approveComment,
  deferComment,
  highlightComment,
  rejectComment,
  resetComment,
} from '../../stores/comments';
import { loadCommentSummaryScores } from '../../stores/commentSummaryScores';
import { loadTaggingSensitivities } from '../../stores/taggingSensitivities';
import { getTaggableTags, loadTags } from '../../stores/tags';
import { getArticle, loadArticle } from '../Comments/store';
import { Search as PureSearch } from './Search';

export { SearchResults } from './components/SearchResults';

export interface IActionMap {
  [key: string]: (ids: Array<string>, userId: string, tagId?: string) => () => Promise<void>;
}

const updateCommentStateAction: {
  [key: string]: any;
} = {
  highlight: highlightComment,
  approve: approveComment,
  defer: deferComment,
  reject: rejectComment,
  reset: resetComment,
};

const actionMap: IActionMap = {
  highlight: highlightComments,
  approve: approveComments,
  defer: deferComments,
  reject: rejectComments,
  tag: tagCommentSummaryScores,
  reset: resetComments,
};

const mapStateToProps = createStructuredSelector({
  totalCommentCount: (state: any) => getAllCommentIds(state).size,
  isLoading: (state: any) => getCommentListIsLoading(state) || !getCommentListHasLoaded(state),
  isItemChecked: (state: any) => (id: string) => getIsItemChecked(state, id),
  areNoneSelected: getAreAnyCommentsSelected,
  areAllSelected: getAreAllSelected,
  selectedCount: getSelectedCount,
  allCommentIds: getAllCommentIds,
  tags: getTaggableTags,
  searchTerm: (_state: any, ownProps: any) => ownProps.location.query.term,
  articleId: (_state: any, ownProps: any) => parseInt(ownProps.location.query.articleId, 10),
  article: (state: any) => getArticle(state),
  textSizes: getTextSizes,
  getLinkTarget: (state: any, { location }: any) => {
    const identifier = getCurrentPagingIdentifier(state);

    return (comment: ICommentModel): string => {
      let url: string;

      const { articleId } = location.query;

      if (articleId) {
        url = `/articles/${articleId}/comments/${comment.id}`;
      } else {
        url = `/articles/${comment.articleId}/comments/${comment.id}`;
      }

      if (identifier) {
        url = `${url}?pagingIdentifier=${identifier}`;
      }

      return url;
    };
  },
  userId: (state: any) => getCurrentUser(state).id,
  searchByAuthor: (_: any, { location }: any) => {
    return location.query.searchByAuthor === 'true';
  },
});

export interface ISearchScope {
  term: string;
  params?: any;
}

function mapDispatchToProps(dispatch: IAppDispatch): any {
  dispatch(loadTags());

  return {
    onSearch: async (newScope: ISearchScope)  => {
      dispatch(executeCommentListLoader(newScope));
    },

    tagComments: (ids: Array<string>, tagId: string, userId: string) =>
        dispatch(tagCommentSummaryScores(ids, userId, tagId)),

    dispatchAction: (action: ICommentAction, idsToDispatch: Array<string>, userId: string) =>
        dispatch(actionMap[action](idsToDispatch, userId)),

    onToggleSelectAll: () => (
      dispatch(toggleSelectAll())
    ),

    onToggleSingleItem: (item: { id: string }) => (
      dispatch(toggleSingleItem(item))
    ),

    updateCommentState: (action: ICommentAction, ids: Array<string>) =>
      dispatch(updateCommentStateAction[action](ids)),

    resetCommentIds: () => dispatch(resetCommentIds()),

    loadScoresForCommentId: async (id: string) => {
      await dispatch(loadCommentSummaryScores(id));
    },
  };
}

const mergeProps = (stateProps: any, dispatchProps: any, ownProps: any) => {
  return {
      ...ownProps,
      ...stateProps,
      ...dispatchProps,
      dispatchAction: (action: ICommentAction, idsToDispatch: Array<string>) =>
          dispatchProps.dispatchAction(action, idsToDispatch, stateProps.userId),
      tagComments: (ids: Array<string>, tagId: string) =>
          dispatchProps.tagComments(ids, tagId, stateProps.userId),
  };
};

export const Search: React.ComponentClass = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
  provideHooks<IRedialLocals>({
    fetch: async ({
      dispatch,
      query: { articleId },
    }) => {
      if (articleId) {
        dispatch(loadArticle(articleId));
      }
      await dispatch(loadTaggingSensitivities());
    },
  }),
)(PureSearch);

export * from './store';
