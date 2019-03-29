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

import { List, Set } from 'immutable';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { createStructuredSelector } from 'reselect';
import { ICommentModel } from '../../../../../models';
import { IConfirmationAction } from '../../../../../types';
import { IAppDispatch, IAppState, IAppStateRecord } from '../../../../stores';
import { getComment, getIsLoading, loadComment, updateComment } from './store';
import { IThreadedCommentDetailProps, ThreadedCommentDetail as PureThreadedCommentDetail } from './ThreadedCommentDetail';
export { reducer } from './store';
import {
  approveComments,
  deferComments,
  highlightComments,
  rejectComments,
  resetComments,
  tagCommentSummaryScores,
} from '../../../../stores/commentActions';
import {
  approveComment,
  deferComment,
  highlightComment,
  rejectComment,
  resetComment,
} from '../../../../stores/comments';
import { getSummaryScoresById, loadCommentSummaryScores } from '../../../../stores/commentSummaryScores';
import { getTaggableTags } from '../../../../stores/tags';
import { getSummaryScoresAboveThreshold, getTaggingSensitivitiesInCategory } from '../../store';

const updateCommentStateAction: {
  [key: string]: any;
} = {
  highlight: highlightComment,
  approve: approveComment,
  defer: deferComment,
  reject: rejectComment,
  reset: resetComment,
};

const actionMap: {
  [key: string]: (ids: Array<string>, tagId?: string) => any;
} = {
  highlight: highlightComments,
  approve: approveComments,
  defer: deferComments,
  reject: rejectComments,
  tag: tagCommentSummaryScores,
  reset: resetComments,
};

type IThreadedCommentDetailOwnProps =  Pick<
  IThreadedCommentDetailProps,
  'params' |
  'location' |
  'router' |
  'routes'
  >;

type IThreadedCommentDetailStateProps = Pick<
  IThreadedCommentDetailProps,
  'comment' |
  'tags' |
  'isLoading' |
  'originatingCommentId'
  >;

type IThreadedCommentDetailDispatchProps = Pick<
  IThreadedCommentDetailProps,
  'loadData' |
  'dispatchAction' |
  'onUpdateComment' |
  'onUpdateCommentState' |
  'tagComments'
>;

type IThreadedCommentDetailDispatchWithOverwriteProps = IThreadedCommentDetailDispatchProps & {
  dispatchAction(action: IConfirmationAction, idsToDispatch: Array<string>): any;
};

function updateCommentState(comment: ICommentModel, action: IConfirmationAction): ICommentModel {
  switch (action) {
    case 'highlight':
      return comment.set('isHighlighted', true);
    case 'approve':
      return comment.set('isAccepted', true)
          .set('isModerated', true)
          .set('isDeferred', false);
    case 'reject':
      return comment.set('isAccepted', false)
          .set('isModerated', true)
          .set('isDeferred', false);
    case 'defer':
      return comment.set('isAccepted', null)
          .set('isModerated', true)
          .set('isDeferred', true);
    default :
      return comment.set('isAccepted', null)
          .set('isModerated', false)
          .set('isHighlighted', false)
          .set('isDeferred', false);
  }
}

const mapStateToProps = createStructuredSelector({
  comment: getComment,

  isLoading: getIsLoading,

  originatingCommentId: (_: IAppStateRecord, { params }: IThreadedCommentDetailOwnProps) => params.originatingCommentId,

  tags: (state: IAppStateRecord) => getTaggableTags(state),

  getTagIdsAboveThresholdByCommentId: (state: IAppStateRecord, { params }: IThreadedCommentDetailOwnProps) => (id: string): Set<string> => {
    if (!id || !getSummaryScoresById(state, id)) {
      return;
    }

    return getSummaryScoresAboveThreshold(
      getTaggingSensitivitiesInCategory(state, params.categoryId, params.articleId),
      getSummaryScoresById(state, id),
    ).map((score) => score.tagId).toSet();
  },
}) as (state: IAppState, ownProps: IThreadedCommentDetailOwnProps) => IThreadedCommentDetailStateProps;

function mapDispatchToProps(dispatch: IAppDispatch): any {
  return {
    loadData: (commentId: string) => {
      dispatch(loadComment(commentId));
    },

    dispatchAction: (action: IConfirmationAction, idsToDispatch: Array<string>) =>
        dispatch(actionMap[action](idsToDispatch)),

    onUpdateComment: (comment: ICommentModel) => (
      dispatch(updateComment(comment))
    ),

    onUpdateCommentState: (comment: ICommentModel, action: IConfirmationAction) => (
        dispatch(updateCommentStateAction[action](comment))
    ),

    tagComments: (ids: Array<string>, tagId: string) =>
        dispatch(tagCommentSummaryScores(ids, tagId)),

    loadScoresForCommentId: async (id: string) => {
      await dispatch(loadCommentSummaryScores(id));
    },
  };
}

const mergeProps = (
  stateProps: IThreadedCommentDetailStateProps,
  dispatchProps: IThreadedCommentDetailDispatchWithOverwriteProps,
  ownProps: IThreadedCommentDetailOwnProps,
) => {
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,

    onUpdateReply: (action: IConfirmationAction, replyId: string) =>
      dispatchProps.onUpdateComment(stateProps.comment.updateIn(['replies'], (replies: List<ICommentModel>) => {
        return replies.map((r) => {
          if (r.id === replyId) {
            // We need to both update the reply state as well as the loaded comment state
            dispatchProps.onUpdateCommentState(r, action);

            return updateCommentState(r, action);
          }

          return r;
        });
      }),
    ),
  };
};

const connectedComponent = connect(mapStateToProps, mapDispatchToProps, mergeProps)(PureThreadedCommentDetail as any) ;
export const ThreadedCommentDetail: React.ComponentClass = withRouter(connectedComponent);
