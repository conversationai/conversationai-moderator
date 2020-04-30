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

import { ICommentModel } from '../../../../../models';
import { IConfirmationAction } from '../../../../../types';
import { IAppDispatch, IAppState } from '../../../../appstate';
import { getComment, loadComment, updateComment } from './store';
import { IThreadedCommentDetailProps, ThreadedCommentDetail as PureThreadedCommentDetail } from './ThreadedCommentDetail';

type IThreadedCommentDetailStateProps = Pick<
  IThreadedCommentDetailProps,
  'comment'
  >;

type IThreadedCommentDetailDispatchProps = Pick<
  IThreadedCommentDetailProps,
  'loadData' |
  'onUpdateComment'
>;

function updateCommentState(comment: ICommentModel, action: IConfirmationAction): ICommentModel {
  switch (action) {
    case 'highlight':
      return {...comment, isHighlighted: true};
    case 'approve':
      return {
        ...comment,
        isAccepted: true,
        isModerated: true,
        isDeferred: false,
      };
    case 'reject':
      return {
        ...comment,
        isAccepted: false,
        isModerated: true,
        isDeferred: false,
      };
    case 'defer':
      return {
        ...comment,
        isAccepted: null,
        isModerated: true,
        isDeferred: true,
      };
    default :
      return {
        ...comment,
        isAccepted: null,
        isModerated: false,
        isHighlighted: false,
        isDeferred: false,
      };
  }
}

const mapStateToProps = createStructuredSelector({
  comment: getComment,
}) as (state: IAppState, ownProps: IThreadedCommentDetailProps) => IThreadedCommentDetailStateProps;

function mapDispatchToProps(dispatch: IAppDispatch): any {
  return {
    loadData: (commentId: string) => {
      loadComment(dispatch, commentId);
    },

    onUpdateComment: (comment: ICommentModel) => (
      dispatch(updateComment(comment))
    ),
  };
}

const mergeProps = (
  stateProps: IThreadedCommentDetailStateProps,
  dispatchProps: IThreadedCommentDetailDispatchProps,
  ownProps: IThreadedCommentDetailProps,
) => {
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,

    onUpdateReply: (action: IConfirmationAction, replyId: string) =>
      dispatchProps.onUpdateComment({
        ...stateProps.comment,
        replies: stateProps.comment.replies.map((r) => {
          if (r.id === replyId) {
            return updateCommentState(r, action);
          }
          return r;
        }),
      }),
  };
};

const connectedComponent = connect(mapStateToProps, mapDispatchToProps, mergeProps)(PureThreadedCommentDetail as any) ;
export const ThreadedCommentDetail: React.ComponentClass = withRouter(connectedComponent);
