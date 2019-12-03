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

import { Location } from 'history';
import qs from 'query-string';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { createStructuredSelector } from 'reselect';

import {
  ICommentModel,
  ICommentScoreModel,
} from '../../../../../models';
import { IConfirmationAction } from '../../../../../types';
import { IAppDispatch, IAppStateRecord } from '../../../../appstate';
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

type ICommentDetailOwnProps = Pick<ICommentDetailProps, 'match' | 'location'>;

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

function getPagingIdentifier(location: Location): string | null {
  const query = qs.parse(location.search);
  return query.pagingIdentifier as string | null;
}

const mapStateToProps = createStructuredSelector({
  comment: getComment,
  isLoading: getIsLoading,
  allTags: getTags,
  availableTags: getTaggableTags,
  allScores: getScores,
  taggingSensitivitiesInCategory: getTaggingSensitivitiesInCategory,
  flags: getFlags,

  summaryScores: (state: IAppStateRecord, ownProps: ICommentDetailOwnProps) => {
    return getSummaryScoresById(state, ownProps.match.params.commentId);
  },

  currentCommentIndex: (
    state: IAppStateRecord,
    { match: { params: { commentId }}, location }: ICommentDetailOwnProps,
  ) => {
    return getCurrentCommentIndex(state, getPagingIdentifier(location), commentId);
  },

  nextCommentId: (
    state: IAppStateRecord,
    { match: { params: { commentId }}, location }: ICommentDetailOwnProps,
  ) => {
    return getNextCommentId(state, getPagingIdentifier(location), commentId);
  },

  previousCommentId: (
    state: IAppStateRecord, { match: { params: { commentId }}, location }: ICommentDetailOwnProps,
  ) => {
    return getPreviousCommentId(state, getPagingIdentifier(location), commentId);
  },

  detailSource: (state: IAppStateRecord, { location }: ICommentDetailOwnProps) => {
    return getPagingSource(state, getPagingIdentifier(location));
  },

  linkBackToList: (state: IAppStateRecord, { location }: ICommentDetailOwnProps) => {
    return getPagingLink(state, getPagingIdentifier(location));
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
        loadComment(dispatch, commentId),
        loadScores(dispatch, commentId),
        loadFlags(dispatch, commentId),
        loadCommentSummaryScores(dispatch, commentId),
      ]);
    },

    loadScores: (commentId: string) => loadScores(dispatch, commentId),

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
        updateCommentState(dispatch, comment),
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
