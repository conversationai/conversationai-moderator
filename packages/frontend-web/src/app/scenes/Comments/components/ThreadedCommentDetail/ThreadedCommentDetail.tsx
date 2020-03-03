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

import { autobind } from 'core-decorators';
import { Set } from 'immutable';
import keyboardJS from 'keyboardjs';
import React from 'react';
import { RouteComponentProps } from 'react-router';

import { ICommentModel, ModelId } from '../../../../../models';
import { ICommentAction, IConfirmationAction } from '../../../../../types';
import {
  RejectIcon,
} from '../../../../components';
import {
  BASE_Z_INDEX,
  BODY_TEXT_TYPE,
  DARK_COLOR,
  DIVIDER_COLOR,
  GUTTER_DEFAULT_SPACING,
  MEDIUM_COLOR,
  SCRIM_Z_INDEX,
  WHITE_COLOR,
} from '../../../../styles';
import { css, stylesheet } from '../../../../utilx';
import { ICommentDetailsPathParams } from '../../../routes';
import { ThreadedComment } from './components/ThreadedComment';

const HEADER_HEIGHT = 75;

const STYLES = stylesheet({
  header: {
    ...BODY_TEXT_TYPE,
    padding: `${GUTTER_DEFAULT_SPACING}px`,
    borderBottom: `1px solid ${DIVIDER_COLOR}`,
    fontSize: 16,
    position: 'fixed',
    top: 0,
    width: '100%',
    boxSizing: 'border-box',
    background: WHITE_COLOR,
    zIndex: BASE_Z_INDEX,
  },

  timeStamp: {
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: `${GUTTER_DEFAULT_SPACING}px`,
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    color: MEDIUM_COLOR,
  },

  closeButton: {
    position: 'absolute',
    top: `${GUTTER_DEFAULT_SPACING}px`,
    right: `${GUTTER_DEFAULT_SPACING}px`,
    background: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
  },

  body: {
    marginTop: `${HEADER_HEIGHT}px`,
    height: `calc(100vh - ${HEADER_HEIGHT}px)`,
    overflowY: 'auto',
  },

  scrim: {
    zIndex: SCRIM_Z_INDEX,
    background: 'none',
  },
});

export interface IThreadedCommentDetailProps extends RouteComponentProps<ICommentDetailsPathParams>  {
  comment: ICommentModel;
  isLoading?: boolean;
  onUpdateReply?(action: ICommentAction, replyId: string): any;
  onUpdateComment(comment: ICommentModel): any;
  updateCommentState?(action: IConfirmationAction, ids: Array<string>): any;
  onUpdateCommentState?(comment: ICommentModel, action: IConfirmationAction): any;
  loadData?(commentId: string): void;
  dispatchAction?(action: ICommentAction, idsToDispatch: Array<string>): any;
  tagComments?(ids: Array<string>, tagId: string): any;
}

export interface IThreadedCommentDetailState {
  loadedCommentId?: string;
  isTaggingToolTipMetaVisible?: boolean;
  taggingToolTipMetaPosition?: {
    top: number;
    left: number;
  };
}

export class ThreadedCommentDetail extends React.Component<IThreadedCommentDetailProps, IThreadedCommentDetailState> {

  state: IThreadedCommentDetailState = {
    isTaggingToolTipMetaVisible: false,
    taggingToolTipMetaPosition: {
      top: 0,
      left: 0,
    },
  };

  static getDerivedStateFromProps(nextProps: IThreadedCommentDetailProps, prevState: IThreadedCommentDetailState) {
    if (!prevState.loadedCommentId) {
      nextProps.loadData(nextProps.match.params.commentId);
    }
    return {
      loadedCommentId: nextProps.match.params.commentId,
    };
  }

  componentDidMount() {
    keyboardJS.bind('escape', this.onPressEscape);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.onPressEscape);
  }

  @autobind
  onPressEscape() {
    this.setState({
      isTaggingToolTipMetaVisible: false,
    });
  }

  @autobind
  onCloseClick() {
    setTimeout(() => window.history.back(), 60);
  }

  @autobind
  async handleAssignTagsSubmit(commentId: ModelId, selectedTagIds: Set<ModelId>) {
    selectedTagIds.forEach((tagId) => {
      this.props.tagComments([commentId], tagId);
    });
    this.props.dispatchAction('reject', [commentId]);
    this.props.onUpdateReply('reject', commentId);
  }

  render() {
    const {
      comment,
      updateCommentState,
      onUpdateReply,
      dispatchAction,
    } = this.props;

    return (
      <div>
        <div key="buttons" {...css(STYLES.header)}>
          Replies to comment #{comment && comment.sourceId} from {comment && comment.author.name}
          <button
            type="button"
            onClick={this.onCloseClick}
            {...css(STYLES.closeButton)}
            aria-label="Go back"
          >
            <RejectIcon {...css({ fill: DARK_COLOR })} />
          </button>
        </div>
        <div key="comments" {...css(STYLES.body)}>
          {comment && (
            <ThreadedComment
              updateCommentState={updateCommentState}
              onUpdateReply={onUpdateReply}
              dispatchAction={dispatchAction}
              comment={comment}
              handleAssignTagsSubmit={this.handleAssignTagsSubmit}
              replies={comment.replies}
            />
          )}
        </div>
      </div>
    );
  }
}
