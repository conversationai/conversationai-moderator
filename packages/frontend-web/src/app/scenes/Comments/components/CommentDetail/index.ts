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
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import {
  ICommentModel,
  ICommentScoreModel,
} from '../../../../../models';
import { IConfirmationAction } from '../../../../../types';
import { IAppDispatch, IAppState } from '../../../../appstate';
import { updateComment as updateCommentState } from '../../../../stores/comments';
import { getTaggingSensitivities } from '../../../../stores/taggingSensitivities';
import { getTaggableTags } from '../../../../stores/tags';
import { getCurrentUser, getUser } from '../../../../stores/users';
import { updateCommentStateAction } from '../ModeratedComments/store';
import { CommentDetail as PureCommentDetail, ICommentDetailProps } from './CommentDetail';
import {
  addCommentScore,
  getComment,
  getCurrentCommentIndex,
  getIsLoading,
  getNextCommentId,
  getPagingIsFromBatch,
  getPagingLink,
  getPagingSource,
  getPreviousCommentId,
  getScores,
  loadComment,
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
  'onAddCommentScore' |
  'onRemoveCommentScore' |
  'onCommentAction'
>;

function getPagingIdentifier(location: Location): string | null {
  const query = qs.parse(location.search);
  return query.pagingIdentifier as string | null;
}

const mapStateToProps = createStructuredSelector({
  comment: getComment,
  isLoading: getIsLoading,
  availableTags: getTaggableTags,
  allScores: getScores,
  taggingSensitivities: getTaggingSensitivities,

  currentCommentIndex: (
    state: IAppState,
    { match: { params: { commentId }}, location }: ICommentDetailOwnProps,
  ) => {
    return getCurrentCommentIndex(state, getPagingIdentifier(location), commentId);
  },

  nextCommentId: (
    state: IAppState,
    { match: { params: { commentId }}, location }: ICommentDetailOwnProps,
  ) => {
    return getNextCommentId(state, getPagingIdentifier(location), commentId);
  },

  previousCommentId: (
    state: IAppState,
    { match: { params: { commentId }}, location }: ICommentDetailOwnProps,
  ) => {
    return getPreviousCommentId(state, getPagingIdentifier(location), commentId);
  },

  detailSource: (state: IAppState, { location }: ICommentDetailOwnProps) => {
    return getPagingSource(state, getPagingIdentifier(location));
  },

  linkBackToList: (state: IAppState, { location }: ICommentDetailOwnProps) => {
    return getPagingLink(state, getPagingIdentifier(location));
  },

  isFromBatch: getPagingIsFromBatch,

  getUserById: (state: IAppState) => (userId: string) => getUser(state, userId),

  currentUser: getCurrentUser,
});

function mapDispatchToProps(dispatch: IAppDispatch): ICommentDetailDispatchProps {
  return {
    loadData: (commentId: string) => {
      return Promise.all([
        loadComment(dispatch, commentId),
        loadScores(dispatch, commentId),
      ]);
    },

    loadScores: (commentId: string) => loadScores(dispatch, commentId),

    onUpdateCommentScore: (commentScore: ICommentScoreModel) => (
      dispatch(updateCommentScore(commentScore))
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

    onCommentAction: (action: IConfirmationAction, idsToDispatch: Array<string>) => {
        dispatch(updateCommentStateAction[action](idsToDispatch));
    },
  };
}

// Add Redux data.
export const CommentDetail: React.ComponentClass = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withRouter,
)(PureCommentDetail);
