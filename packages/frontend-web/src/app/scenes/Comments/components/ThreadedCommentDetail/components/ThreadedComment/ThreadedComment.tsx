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
import React from 'react';

import {ICommentModel, ModelId} from '../../../../../../../models';
import { ICommentAction } from '../../../../../../../types';
import { BasicBody } from '../../../../../../components';
import {
  approveComments,
  deferComments,
  highlightComments,
  ICommentActionFunction,
  rejectComments,
  resetComments,
  tagCommentSummaryScores,
} from '../../../../../../stores/commentActions';
import {
  ARTICLE_CATEGORY_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  DIVIDER_COLOR,
  GUTTER_DEFAULT_SPACING,
  WHITE_COLOR,
} from '../../../../../../styles';
import { partial } from '../../../../../../util';
import { css, stylesheet } from '../../../../../../utilx';
import { articleBase, commentDetailsPageLink } from '../../../../../routes';

const STYLES = stylesheet({
  base: {
    backgroundColor: WHITE_COLOR,
    width: '100%',
    boxSizing: 'border-box',
  },

  row: {
    borderBottom: `1px solid ${DIVIDER_COLOR}`,
    boxSizing: 'border-box',
    paddingTop: `${GUTTER_DEFAULT_SPACING}px`,
    paddingBottom: `${GUTTER_DEFAULT_SPACING * 1.5}px`,
  },

  body: {
    margin: '0 auto',
    width: 690,
  },

  replyBody: {
    paddingLeft: 50,
    boxSizing: 'border-box',
  },

  replyIcon: {
    width: 53,
    marginTop: 40,
  },

  moderatedIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: `${GUTTER_DEFAULT_SPACING * 3}px`,
    marginLeft: `${GUTTER_DEFAULT_SPACING * 2}px`,
  },

  commentInfo: {
    ...ARTICLE_CATEGORY_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
  },
});

const actionMap: { [key: string]: ICommentActionFunction } = {
  highlight: highlightComments,
  approve: approveComments,
  defer: deferComments,
  reject: rejectComments,
  tag: tagCommentSummaryScores,
  reset: resetComments,
};

export interface IThreadedCommentProps {
  comment: ICommentModel;
  replies?: Array<ICommentModel>;
  handleAssignTagsSubmit(commentId: ModelId, selectedTagIds: Set<ModelId>, rejectedTagIds: Set<ModelId>): Promise<void>;
}

export interface IThreadedCommentState {
  hoveredRowId: string;
  hoveredRowThresholdPassed: boolean;
}

export class ThreadedComment extends React.Component<IThreadedCommentProps, IThreadedCommentState> {

  state: IThreadedCommentState = {
    hoveredRowId: null,
    hoveredRowThresholdPassed: false,
  };

  @autobind
  handleRowMouseEnter(id: string): void {
    this.setState({
      hoveredRowId: id,
    });
    setTimeout(() => {
      if (this.state.hoveredRowId === id) {
        this.setState({
          hoveredRowThresholdPassed: true,
        });
      }
    }, 180);
  }

  @autobind
  handleRowMouseLeave(): void {
    this.setState({
      hoveredRowId: null,
      hoveredRowThresholdPassed: false,
    });
  }

  @autobind
  async dispatchConfirmedAction(action: ICommentAction, ids: Array<string>) {
    await actionMap[action](ids);
  }

  @autobind
  async dispatchConfirmedReply(action: ICommentAction, ids: Array<string>) {
    await actionMap[action](ids);
  }

  render() {
    const {
      comment,
      replies,
      handleAssignTagsSubmit,
    } = this.props;

    const { hoveredRowThresholdPassed, hoveredRowId } = this.state;

    return (
      <div {...css(STYLES.base)}>
        <div
          {...css(STYLES.row)}
          onMouseEnter={partial(this.handleRowMouseEnter, comment.id)}
          onMouseLeave={this.handleRowMouseLeave}
        >
          <div {...css(STYLES.body)}>
            <BasicBody
              commentLinkTarget={commentDetailsPageLink({
                context: articleBase,
                contextId: comment.articleId,
                commentId: comment.id,
              })}
              handleAssignTagsSubmit={handleAssignTagsSubmit}
              comment={comment}
              showActions={(comment.id === hoveredRowId) && hoveredRowThresholdPassed}
              dispatchConfirmedAction={this.dispatchConfirmedAction}
            />
          </div>
        </div>

        { replies && replies.map((reply, i) => (
          <div
            {...css(STYLES.row)}
            onMouseEnter={partial(this.handleRowMouseEnter, reply.id)}
            onMouseLeave={this.handleRowMouseLeave}
            key={`${reply.authorSourceId}${i}`}
          >
            <div {...css(STYLES.body, STYLES.replyBody)}>
              <BasicBody
                handleAssignTagsSubmit={handleAssignTagsSubmit}
                showActions={(reply.id === hoveredRowId) && hoveredRowThresholdPassed}
                dispatchConfirmedAction={this.dispatchConfirmedReply}
                commentLinkTarget={`/articles/${reply.articleId}/comments/${reply.id}`}
                comment={reply}
              />
            </div>
          </div>
        )) }
      </div>
    );
  }
}
