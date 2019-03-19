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

import { Set } from 'immutable';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { createStructuredSelector } from 'reselect';

import {
  ICommentModel,
  ICommentScoreModel,
} from '../../../../../models';
import { IConfirmationAction } from '../../../../../types';
import { IAppDispatch, IAppState, IAppStateRecord } from '../../../../stores';
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
import {
  adjustTabCount,
  getSummaryScoresAboveThreshold,
  getSummaryScoresBelowThreshold,
} from '../../store';
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
  getReducedScoresAboveThreshold,
  getReducedScoresBelowThreshold,
  getScores,
  getScoresAboveThreshold,
  getTaggingSensitivitiesInCategory,
  getTaggingSensitivityForTag,
  loadComment,
  loadFlags,
  loadScores,
  removeCommentScore,
  updateComment,
  updateCommentScore,
} from './store';

export { reducer, storeCommentPagingOptions } from './store';

// In case we move the router-related actions into here.
// type ICommentDetailRouterProps = Pick<
//   ICommentDetailProps,
//   'router' | 'params' | 'location'
// >;

type ICommentDetailOwnProps = {
  categoryId: string;
  params: {
    commentId: string;
  };
};

type ICommentDetailStateProps = Pick<
  ICommentDetailProps,
  'comment' |
  'isLoading' |
  'availableTags' |
  'allScores' |
  'allScoresAboveThreshold' |
  'reducedScoresAboveThreshold' |
  'reducedScoresBelowThreshold' |
  'summaryScores' |
  'summaryScoresAboveThreshold' |
  'summaryScoresBelowThreshold' |
  'getTagIdsAboveThresholdByCommentId' |
  'getThresholdForTag' |
  'currentCommentIndex' |
  'nextCommentId' |
  'previousCommentId' |
  'detailSource' |
  'isFromBatch' |
  'authorCountById' |
  'getUserById' |
  'currentUser'
>;

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
  'onDeleteCommentTag' |
  'onModerateStatusChange'
>;

const AVAILABLE_ACTIONS: {
  [key: string]: (ids: Array<string>, userId: string) => any;
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

  allScores: (state: IAppState) => getScores(state),

  allScoresAboveThreshold: (state: IAppState) => (
      getScoresAboveThreshold(getTaggingSensitivitiesInCategory(state), getScores(state))),

  reducedScoresAboveThreshold: (state: IAppStateRecord) =>
      getReducedScoresAboveThreshold(getTaggingSensitivitiesInCategory(state), getScores(state)),

  reducedScoresBelowThreshold: (state: IAppStateRecord) =>
      getReducedScoresBelowThreshold(getTaggingSensitivitiesInCategory(state), getScores(state)),

  flags: (state: IAppState) => getFlags(state),

  getThresholdForTag: (state: IAppStateRecord) => (score: ICommentScoreModel) =>
      getTaggingSensitivityForTag(getTaggingSensitivitiesInCategory(state), score),

  summaryScoresAboveThreshold: (state: IAppStateRecord, ownProps: ICommentDetailOwnProps) => {
    return getSummaryScoresAboveThreshold(
      getTaggingSensitivitiesInCategory(state),
      getSummaryScoresById(state, ownProps.params.commentId),
    );
  },

  summaryScoresBelowThreshold: (state: IAppStateRecord, ownProps: ICommentDetailOwnProps) => {
    return getSummaryScoresBelowThreshold(
      getTaggingSensitivitiesInCategory(state),
      getSummaryScoresById(state, ownProps.params.commentId),
    );
  },

  summaryScores: (state: IAppStateRecord, ownProps: ICommentDetailOwnProps) => {
    return getSummaryScoresById(state, ownProps.params.commentId);
  },

  getTagIdsAboveThresholdByCommentId: (state: IAppStateRecord) => (id: string): Set<string> => {
    if (!id || !getSummaryScoresById(state, id)) {
      return;
    }

    return getSummaryScoresAboveThreshold(
      getTaggingSensitivitiesInCategory(state),
      getSummaryScoresById(state, id),
    ).map((score) => score.tagId).toSet();
  },

  currentCommentIndex: (state: IAppStateRecord, { params: { commentId }, location: { query: { pagingIdentifier } } }: any) => {
    return getCurrentCommentIndex(state, pagingIdentifier, commentId);
  },

  nextCommentId: (state: IAppStateRecord, { params: { commentId }, location: { query: { pagingIdentifier } } }: any) => {
    return getNextCommentId(state, pagingIdentifier, commentId);
  },

  previousCommentId: (state: IAppStateRecord, { params: { commentId }, location: { query: { pagingIdentifier } } }: any) => {
    return getPreviousCommentId(state, pagingIdentifier, commentId);
  },

  detailSource: (state: IAppStateRecord, { location: { query: { pagingIdentifier } } }: any) => {
    return getPagingSource(state, pagingIdentifier);
  },

  linkBackToList: (state: IAppStateRecord, { location: { query: { pagingIdentifier } } }: any) => {
    return getPagingLink(state, pagingIdentifier);
  },

  isFromBatch: getPagingIsFromBatch,

  authorCountById: (state: IAppStateRecord) => (id: string) => getAuthorCountsById(state, id),

  getUserById: (state: IAppStateRecord) => (userId: string) => getUser(state, userId),

  currentUser: getCurrentUser,
}) as (state: IAppState, ownProps: ICommentDetailOwnProps) => ICommentDetailStateProps;

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

    onTagComment: (ids: Array<string>, tagId: string, userId: string) => (
        dispatch(tagComments(ids, tagId, userId))
    ),

    tagCommentSummaryScore: (ids: Array<string>, tagId: string, userId: string) =>
        dispatch(tagCommentSummaryScores(ids, tagId, userId)),

    confirmCommentSummaryScore: (id: string, tagId: string, userId: string) =>
        dispatch(confirmCommentSummaryScore(id, tagId, userId)),

    rejectCommentSummaryScore: (id: string, tagId: string, userId: string) =>
        dispatch(rejectCommentSummaryScore(id, tagId, userId)),

    onCommentAction: (action: IConfirmationAction, idsToDispatch: Array<string>, userId: string) => {
        dispatch(AVAILABLE_ACTIONS[action](idsToDispatch, userId));
        // Also update moderated state
        dispatch(updateCommentStateAction[action](idsToDispatch));
    },

    onAnnotateComment: (id: string, tagId: string, start: number, end: number) => (
      dispatch(tagCommentsAnnotation(id, tagId, start, end))
    ),

    onDeleteCommentTag: (id: string, commentScoreId: string) => (
      dispatch(deleteCommentTag(id, commentScoreId))
    ),

    onModerateStatusChange: (shouldResetStatus: boolean) => (
      Promise.all([
        dispatch(adjustTabCount({
          field: 'unmoderated',
          amount: shouldResetStatus ? 1 : -1,
        })),
        dispatch(adjustTabCount({
          field: 'moderated',
          amount: shouldResetStatus ? -1 : 1,
        })),
      ])
    ),
  };
}

// TODO (Issue#27): Fix type
function mergeProps(
  stateProps: ICommentDetailStateProps,
  dispatchProps: ICommentDetailDispatchProps,
  ownProps: ICommentDetailOwnProps,
): any {
  return {
      ...ownProps,
      ...stateProps,
      ...dispatchProps,
      onCommentAction: (action: IConfirmationAction, idsToDispatch: Array<string>) =>
          dispatchProps.onCommentAction(action, idsToDispatch, stateProps.currentUser.id),
      onTagComment: (ids: Array<string>, tagId: string) =>
          dispatchProps.onTagComment(ids, tagId, stateProps.currentUser.id),
      tagCommentSummaryScore: (ids: Array<string>, tagId: string) =>
          dispatchProps.tagCommentSummaryScore(ids, tagId, stateProps.currentUser.id),
      confirmCommentSummaryScore: (id: string, tagId: string) =>
          dispatchProps.confirmCommentSummaryScore(id, tagId, stateProps.currentUser.id),
      rejectCommentSummaryScore: (id: string, tagId: string) =>
          dispatchProps.rejectCommentSummaryScore(id, tagId, stateProps.currentUser.id),
  };
}

// Add Redux data.
const ConnectedCommentDetail = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(PureCommentDetail);

// Add `router` prop.
export const CommentDetail: React.ComponentClass = withRouter(ConnectedCommentDetail);
