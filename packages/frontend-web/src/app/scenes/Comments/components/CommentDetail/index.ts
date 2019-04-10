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

import {
  ICommentModel,
  ICommentScoreModel,
} from '../../../../../models';
import { IConfirmationAction } from '../../../../../types';
import { IAppDispatch, IAppStateRecord } from '../../../../stores';
import {
  approveComments,
  confirmCommentScore,
  confirmCommentSummaryScore,
  deferComments,
  deleteCommentTag,
  highlightComments,
  rejectComments,
  rejectCommentScore,
  rejectCommentSummaryScore,
  resetComments,
  resetCommentScore,
  tagComments,
  tagCommentsAnnotation,
  tagCommentSummaryScores,
} from '../../../../stores/commentActions';
import { updateComment as updateCommentState } from '../../../../stores/comments';
import {
  getSummaryScoresById,
  loadCommentSummaryScores,
} from '../../../../stores/commentSummaryScores';
import { getTaggableTags, getTags } from '../../../../stores/tags';
import { getCurrentUser, getUser } from '../../../../stores/users';
import { updateCommentStateAction } from '../ModeratedComments/store';
import { CommentDetail as PureCommentDetail, ICommentDetailProps } from './CommentDetail';
import {
  addCommentScore,
  getAuthorCountsById,
  getComment,
  getCurrentCommentIndex,
  getFlags,
  getIsLoading,
  getNextCommentId,
  getPagingIsFromBatch,
  getPagingLink,
  getPagingSource,
  getPreviousCommentId,
  getScores,
  getTaggingSensitivitiesInCategory,
  loadComment,
  loadFlags,
  loadScores,
  removeCommentScore,
  updateComment,
  updateCommentScore,
} from './store';

export { reducer, storeCommentPagingOptions } from './store';

type ICommentDetailOwnProps = {
  categoryId: string;
  params: {
    commentId: string;
  };
};

type ICommentDetailDispatchProps = Pick<
  ICommentDetailProps,
  'loadData' |
  'loadScores' |
  'onUpdateComment' |
  'onUpdateCommentScore' |
  'onConfirmCommentScore' |
  'onRejectCommentScore' |
  'onResetCommentScore' |
  'onAddCommentScore' |
  'onRemoveCommentScore' |
  'onTagComment' |
  'tagCommentSummaryScore' |
  'confirmCommentSummaryScore' |
  'rejectCommentSummaryScore' |
  'onCommentAction' |
  'onAnnotateComment' |
  'onDeleteCommentTag'
>;

const AVAILABLE_ACTIONS: {
  [key: string]: (ids: Array<string>) => any;
} = {
  highlight: highlightComments,
  approve: approveComments,
  defer: deferComments,
  reject: rejectComments,
  reset: resetComments,
};

const mapStateToProps = createStructuredSelector({
  comment: getComment,
  isLoading: getIsLoading,
  allTags: getTags,
  availableTags: getTaggableTags,
  allScores: getScores,
  taggingSensitivitiesInCategory: getTaggingSensitivitiesInCategory,
  flags: getFlags,

  summaryScores: (state: IAppStateRecord, ownProps: ICommentDetailOwnProps) => {
    return getSummaryScoresById(state, ownProps.params.commentId);
  },

  currentCommentIndex: (state: IAppStateRecord, { params: { commentId }, location: { query: { pagingIdentifier } } }: ICommentDetailProps) => {
    return getCurrentCommentIndex(state, pagingIdentifier, commentId);
  },

  nextCommentId: (state: IAppStateRecord, { params: { commentId }, location: { query: { pagingIdentifier } } }: ICommentDetailProps) => {
    return getNextCommentId(state, pagingIdentifier, commentId);
  },

  previousCommentId: (state: IAppStateRecord, { params: { commentId }, location: { query: { pagingIdentifier } } }: ICommentDetailProps) => {
    return getPreviousCommentId(state, pagingIdentifier, commentId);
  },

  detailSource: (state: IAppStateRecord, { location: { query: { pagingIdentifier } } }: ICommentDetailProps) => {
    return getPagingSource(state, pagingIdentifier);
  },

  linkBackToList: (state: IAppStateRecord, { location: { query: { pagingIdentifier } } }: ICommentDetailProps) => {
    return getPagingLink(state, pagingIdentifier);
  },

  isFromBatch: getPagingIsFromBatch,

  authorCountById: (state: IAppStateRecord) => (id: string) => getAuthorCountsById(state, id),

  getUserById: (state: IAppStateRecord) => (userId: string) => getUser(state, userId),

  currentUser: getCurrentUser,
});

function mapDispatchToProps(dispatch: IAppDispatch): ICommentDetailDispatchProps {
  return {
    loadData: (commentId: string) => {
      return Promise.all([
        dispatch(loadComment(commentId)),
        dispatch(loadScores(commentId)),
        dispatch(loadFlags(commentId)),
        dispatch(loadCommentSummaryScores(commentId)),
      ]);
    },

    loadScores: (commentId: string) => (
      dispatch(loadScores(commentId))
    ),

    onUpdateCommentScore: (commentScore: ICommentScoreModel) => (
      dispatch(updateCommentScore(commentScore))
    ),

    onConfirmCommentScore: (commentid: string, commentScoreId: string) => (
      dispatch(confirmCommentScore(commentid, commentScoreId))
    ),

    onRejectCommentScore: (commentid: string, commentScoreId: string) => (
      dispatch(rejectCommentScore(commentid, commentScoreId))
    ),

    onResetCommentScore: (commentid: string, commentScoreId: string) => (
      dispatch(resetCommentScore(commentid, commentScoreId))
    ),

    onUpdateComment: (comment: ICommentModel) => {
      return Promise.all([
        dispatch(updateComment(comment)),
        dispatch(updateCommentState(comment)),
      ]); },

    onAddCommentScore: (commentScore: ICommentScoreModel) => (
      dispatch(addCommentScore(commentScore))
    ),

    onRemoveCommentScore: (commentScore: ICommentScoreModel) => (
      dispatch(removeCommentScore(commentScore))
    ),

    onTagComment: (ids: Array<string>, tagId: string) => (
        dispatch(tagComments(ids, tagId))
    ),

    tagCommentSummaryScore: (ids: Array<string>, tagId: string) =>
        dispatch(tagCommentSummaryScores(ids, tagId)),

    confirmCommentSummaryScore: (id: string, tagId: string) =>
        dispatch(confirmCommentSummaryScore(id, tagId)),

    rejectCommentSummaryScore: (id: string, tagId: string) =>
        dispatch(rejectCommentSummaryScore(id, tagId)),

    onCommentAction: (action: IConfirmationAction, idsToDispatch: Array<string>) => {
        dispatch(AVAILABLE_ACTIONS[action](idsToDispatch));
        // Also update moderated state
        dispatch(updateCommentStateAction[action](idsToDispatch));
    },

    onAnnotateComment: (id: string, tagId: string, start: number, end: number) => (
      dispatch(tagCommentsAnnotation(id, tagId, start, end))
    ),

    onDeleteCommentTag: (id: string, commentScoreId: string) => (
      dispatch(deleteCommentTag(id, commentScoreId))
    ),
  };
}

// Add Redux data.
const ConnectedCommentDetail = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureCommentDetail);

// Add `router` prop.
export const CommentDetail: React.ComponentClass = withRouter(ConnectedCommentDetail);
