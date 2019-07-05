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
import { createStructuredSelector } from 'reselect';

import { ICommentAction } from '../../../../../types';
import { IAppDispatch, IAppStateRecord } from '../../../../stores';
import { getArticle } from '../../../../stores/articles';
import {
  changeColumnSortGroupDefault,
  getCurrentColumnSort,
} from '../../../../stores/columnSorts';
import {
  approveComments,
  approveFlagsAndComments,
  deferComments,
  highlightComments,
  rejectComments,
  rejectFlagsAndComments,
  resetComments,
  tagCommentSummaryScores,
} from '../../../../stores/commentActions';
import { getTaggableTags } from '../../../../stores/tags';
import { getTextSizes } from '../../../../stores/textSizes';
import {IModeratedCommentsPathParams, isArticleContext} from '../../../routes';
import {
  getParams,
  IModeratedCommentsProps,
  ModeratedComments as PureModeratedComments,
} from './ModeratedComments';
import {
  executeCommentListLoader,
  getAreAllSelected,
  getAreAnyCommentsSelected,
  getCommentListHasLoaded,
  getCommentListIsLoading,
  getCurrentPagingIdentifier,
  getIsItemChecked,
  getModeratedComments,
  setCommentsModerationForArticle,
  setCommentsModerationForCategory,
  toggleSelectAll,
  toggleSingleItem,
} from './store';

type IModeratedCommentsDispatchProps = Pick<
  IModeratedCommentsProps,
  'toggleSelectAll' |
  'toggleSingleItem' |
  'setCommentModerationStatusForArticle' |
  'setCommentModerationStatusForCategory' |
  'changeSort' |
  'loadData' |
  'tagComments' |
  'dispatchAction'
>;

type IModeratedCommentsStateProps = Pick<
  IModeratedCommentsProps,
  'isLoading' |
  'article' |
  'areNoneSelected' |
  'areAllSelected' |
  'isItemChecked' |
  'moderatedComments' |
  'tags' |
  'getCurrentColumnSort' |
  'textSizes'
>;

const mapStateToProps = createStructuredSelector({
  isLoading: (state: IAppStateRecord) => getCommentListIsLoading(state) || !getCommentListHasLoaded(state),

  article: (state: IAppStateRecord, props: IModeratedCommentsProps) => {
    if (isArticleContext(getParams(props))) {
      return getArticle(state, getParams(props).contextId);
    }
  },

  areNoneSelected: getAreAnyCommentsSelected,

  areAllSelected: getAreAllSelected,

  isItemChecked: (state: IAppStateRecord) => (id: string) => getIsItemChecked(state, id),

  moderatedComments: (state: IAppStateRecord, props: IModeratedCommentsProps) => (
    getModeratedComments(state, getParams(props))
  ),

  tags: getTaggableTags,

  getCurrentColumnSort: (state: IAppStateRecord) => {
    return (key: string) => getCurrentColumnSort(state, 'commentsIndexModerated', key);
  },

  pagingIdentifier: getCurrentPagingIdentifier,

  textSizes: getTextSizes,
});

function mapDispatchToProps(dispatch: IAppDispatch, props: IModeratedCommentsProps): IModeratedCommentsDispatchProps {
  const actionMap: {
    [key: string]: (ids: Array<string>, tagId?: string) => any;
  } = {
    highlight: highlightComments,
    approve: getParams(props).disposition === 'flagged' ? approveFlagsAndComments : approveComments,
    defer: deferComments,
    reject: getParams(props).disposition === 'flagged' ? rejectFlagsAndComments : rejectComments,
    tag: tagCommentSummaryScores,
    reset: getParams(props).disposition === 'flagged' ? approveFlagsAndComments : resetComments,
  };

  return {
    loadData: (params: IModeratedCommentsPathParams) => {
      dispatch(executeCommentListLoader(params));
    },

    tagComments: (ids: Array<string>, tagId: string) =>
        dispatch(tagCommentSummaryScores(ids, tagId)),

    dispatchAction: (action: ICommentAction, idsToDispatch: Array<string>) =>
        dispatch(actionMap[action](idsToDispatch)),

    toggleSelectAll: () => dispatch(toggleSelectAll()),

    toggleSingleItem: ({ id }: { id: string }) => dispatch(toggleSingleItem({ id })),

    setCommentModerationStatusForArticle: (commentIds: Array<string>, moderationAction: string, currentModeration: string) =>
        dispatch(setCommentsModerationForArticle(getParams(props).contextId, commentIds, moderationAction, currentModeration)),

    setCommentModerationStatusForCategory: (commentIds: Array<string>, moderationAction: string, currentModeration: string) =>
        dispatch(setCommentsModerationForCategory(getParams(props).contextId, commentIds, moderationAction, currentModeration)),

    changeSort: async (params: IModeratedCommentsPathParams, newSort: string): Promise<void> => {
      await dispatch(changeColumnSortGroupDefault({
        group: 'commentsIndexModerated',
        key: newSort,
      }));

      await dispatch(executeCommentListLoader(params));
    },
  };
}

// Add Redux data.
const ConnectedModeratedComments = connect<IModeratedCommentsStateProps , IModeratedCommentsDispatchProps>(
  mapStateToProps,
  mapDispatchToProps,
)(PureModeratedComments);

// Add `router` prop.
export const ModeratedComments: React.ComponentClass = withRouter(ConnectedModeratedComments);

export * from './store';
