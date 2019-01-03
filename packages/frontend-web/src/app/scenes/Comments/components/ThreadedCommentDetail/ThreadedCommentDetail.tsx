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
import FocusTrap from 'focus-trap-react';
import { List, Set } from 'immutable';
import keyboardJS from 'keyboardjs';
import React from 'react';

import { ICommentModel, ITagModel } from '../../../../../models';
import { ICommentAction, IConfirmationAction } from '../../../../../types';
import {
  ArrowPosition,
  AssignTagsForm,
  RejectIcon,
  ToolTip,
} from '../../../../components';
import { REQUIRE_REASON_TO_REJECT } from '../../../../config';
import {
  BASE_Z_INDEX,
  BODY_TEXT_TYPE,
  DARK_COLOR,
  DIVIDER_COLOR,
  GUTTER_DEFAULT_SPACING,
  MEDIUM_COLOR,
  SCRIM_Z_INDEX,
  TOOLTIP_Z_INDEX,
  WHITE_COLOR,
} from '../../../../styles';
import { css, stylesheet } from '../../../../util';
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

export interface IThreadedCommentDetailProps {
  comment: ICommentModel;
  isLoading?: boolean;
  userId: string;
  originatingCommentId: string;
  onUpdateReply?(action: ICommentAction, replyId: string): any;
  onUpdateComment(comment: ICommentModel): any;
  updateCommentState?(action: IConfirmationAction, ids: Array<string>): any;
  onUpdateCommentState?(comment: ICommentModel, action: IConfirmationAction): any;
  dispatchAction?(action: ICommentAction, idsToDispatch: Array<string>): any;
  tags: List<ITagModel>;
  tagComments?(ids: Array<string>, tagId: string): any;
  loadScoresForCommentId?(id: string): void;
  getTagIdsAboveThresholdByCommentId?(commentId: string): Set<string>;
}

export interface IThreadedCommentDetailState {
  isTaggingToolTipMetaVisible?: boolean;
  taggingToolTipMetaPosition?: {
    top: number;
    left: number;
  };
  taggingToolTipArrowPosition?: ArrowPosition;
  selectedRow?: number;
  taggingTooltipVisible?: boolean;
  taggingCommentId?: string;
  moderateButtonsRef?: HTMLDivElement;
}

export class ThreadedCommentDetail extends React.Component<IThreadedCommentDetailProps, IThreadedCommentDetailState> {

  state: IThreadedCommentDetailState = {
    isTaggingToolTipMetaVisible: false,
    taggingToolTipMetaPosition: {
      top: 0,
      left: 0,
    },
    taggingToolTipArrowPosition: null,
    taggingTooltipVisible: false,
    taggingCommentId: null,
    moderateButtonsRef: null,
  };

  componentDidMount() {
    keyboardJS.bind('escape', this.onPressEscape);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.onPressEscape);
  }

  @autobind
  onPressEscape() {
    this.setState({
      taggingTooltipVisible: false,
      isTaggingToolTipMetaVisible: false,
    });
  }

  @autobind
  onCloseClick() {
    setTimeout(() => window.history.back(), 60);
  }

  @autobind
  onTaggingTooltipClose() {
    this.setState({ taggingTooltipVisible: false });
  }

  @autobind
  async handleRejectWithTag(
    commentId: string,
    tooltipRef: HTMLDivElement,
  ) {
    // we need to load the comment data so we can asses all the scores
    await this.props.loadScoresForCommentId(commentId);
    const tooltipPosition = this.getModerateButtonsPosition(tooltipRef);
    let arrowPosition: ArrowPosition;
    const top = tooltipPosition.top;
    // unfortunate use of magic numbers to work on minimum screen height of 768 for ipad

    if (top > window.innerHeight - 280) {
      arrowPosition = 'leftBottom';
    } else if (top < window.innerHeight - 490) {
      arrowPosition = 'leftTop';
    } else {
      arrowPosition = 'leftCenter';
    }

    this.setState({
      taggingCommentId: commentId,
      taggingToolTipMetaPosition: tooltipPosition,
      taggingTooltipVisible: true,
      taggingToolTipArrowPosition: arrowPosition,
      moderateButtonsRef: tooltipRef,
    });
  }

  @autobind
  handleAssignTagsSubmit(selectedTagIds: Set<string>) {
    selectedTagIds.forEach((tagId) => {
      this.props.tagComments([this.state.taggingCommentId], tagId);
    });
    this.props.dispatchAction('reject', [this.state.taggingCommentId]);
    this.props.onUpdateReply('reject', this.state.taggingCommentId);
    this.setState({
      taggingTooltipVisible: false,
      taggingCommentId: null,
    });
  }

  @autobind
  handleScroll() {
    if (!this.state.moderateButtonsRef) {
      return true;
    }
    const buttonPosition = this.getModerateButtonsPosition(this.state.moderateButtonsRef);
    if (buttonPosition.top <= HEADER_HEIGHT) {
      this.setState({
        taggingTooltipVisible: false,
      });

      return true;
    }
    this.setState({
      taggingToolTipMetaPosition: buttonPosition,
    });

    return true;
  }

  @autobind
  getModerateButtonsPosition(ref: HTMLDivElement): {
    top: number;
    left: number;
  } {
    if (!ref) {
      return;
    }

    const rect = ref.getBoundingClientRect();

    return {
      top: rect.top + (rect.height / 2),
      left: rect.left + (rect.width / 2) - 10,
    };
  }

  render() {
    const {
      comment,
      updateCommentState,
      onUpdateReply,
      dispatchAction,
      tags,
      getTagIdsAboveThresholdByCommentId,
    } = this.props;

    const {
      taggingCommentId,
      taggingTooltipVisible,
      taggingToolTipArrowPosition,
      taggingToolTipMetaPosition,
    } = this.state;

    return (
      <div>
        <div {...css(STYLES.header)}>
          Replies to comment #{comment.sourceId} from {comment.author.name}
          <button
            type="button"
            onClick={this.onCloseClick}
            {...css(STYLES.closeButton)}
            aria-label="Go back"
          >
              <RejectIcon {...css({ fill: DARK_COLOR })} />
          </button>
        </div>
        <div {...css(STYLES.body)} onScroll={this.handleScroll}>
          <ThreadedComment
            onRejectWithTag={this.handleRejectWithTag}
            tagRejectionModalVisible={{
              id: taggingCommentId,
              isVisible: taggingTooltipVisible,
            }}
            requireReasonForReject={REQUIRE_REASON_TO_REJECT}
            updateCommentState={updateCommentState}
            onUpdateReply={onUpdateReply}
            dispatchAction={dispatchAction}
            comment={comment}
            replies={comment.replies}
          />
        </div>
          {tags && taggingTooltipVisible && (
            <FocusTrap
              focusTrapOptions={{
                clickOutsideDeactivates: true,
              }}
            >
              <ToolTip
                arrowPosition={taggingToolTipArrowPosition}
                backgroundColor={WHITE_COLOR}
                hasDropShadow
                isVisible={taggingTooltipVisible}
                onDeactivate={this.onTaggingTooltipClose}
                position={taggingToolTipMetaPosition}
                size={16}
                zIndex={TOOLTIP_Z_INDEX}
              >
                <AssignTagsForm
                  tags={tags}
                  onSubmit={this.handleAssignTagsSubmit}
                  tagsPreselected={getTagIdsAboveThresholdByCommentId(taggingCommentId)}
                />
              </ToolTip>
            </FocusTrap>
          )}
      </div>
    );
  }
}
