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
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import { ICommentModel } from '../../../models';
import { IAppDispatch, IAppStateRecord } from '../../stores';
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
import { getArticle } from '../../stores/articles';
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
import { getTaggableTags } from '../../stores/tags';
import { ISearchProps, Search as PureSearch } from './Search';

export { SearchResults } from './components/SearchResults';

export interface IActionMap {
  [key: string]: (ids: Array<string>, tagId?: string) => () => Promise<void>;
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

type ISearchOwnProps = Pick<
  ISearchProps,
  'location'
  >;

const mapStateToProps = createStructuredSelector({
  totalCommentCount: (state: IAppStateRecord) => getAllCommentIds(state).size,
  isLoading: (state: IAppStateRecord) => getCommentListIsLoading(state) || !getCommentListHasLoaded(state),
  isItemChecked: (state: IAppStateRecord) => (id: string) => getIsItemChecked(state, id),
  areNoneSelected: getAreAnyCommentsSelected,
  areAllSelected: getAreAllSelected,
  selectedCount: getSelectedCount,
  allCommentIds: getAllCommentIds,
  tags: getTaggableTags,
  searchTerm: (_state: IAppStateRecord, { location }: ISearchOwnProps) => location.query.term,
  articleId: (_: IAppStateRecord, { location }: ISearchOwnProps) => location.query.articleId,
  article: (state: IAppStateRecord, { location }: ISearchOwnProps) => location.query.articleId && getArticle(state, location.query.articleId),
  textSizes: getTextSizes,
  getLinkTarget: (state: IAppStateRecord, { location }: ISearchOwnProps) => {
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
  searchByAuthor: (_: IAppStateRecord, { location }: ISearchOwnProps) => {
    return location.query.searchByAuthor === 'true';
  },
});

export interface ISearchScope {
  term: string;
  params?: any;
}

function mapDispatchToProps(dispatch: IAppDispatch): any {
  return {
    onSearch: async (newScope: ISearchScope)  => {
      dispatch(executeCommentListLoader(newScope));
    },

    tagComments: (ids: Array<string>, tagId: string) =>
        dispatch(tagCommentSummaryScores(ids, tagId)),

    dispatchAction: (action: ICommentAction, idsToDispatch: Array<string>) =>
        dispatch(actionMap[action](idsToDispatch)),

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

export const Search: React.ComponentClass = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(PureSearch);

export * from './store';
