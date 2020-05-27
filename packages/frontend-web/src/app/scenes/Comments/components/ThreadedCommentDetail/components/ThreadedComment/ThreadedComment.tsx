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
import React, {useState} from 'react';

import {ICommentModel, ModelId} from '../../../../../../../models';
import { ICommentAction } from '../../../../../../../types';
import { BasicBody } from '../../../../../../components';
import { useCachedComment } from '../../../../../../injectors/commentInjector';
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

interface IReplyItemProps {
  replyId: ModelId;
  showActions: boolean;
  handleRowMouseEnter(id: string): void;
  handleRowMouseLeave(): void;
  handleAssignTagsSubmit(commentId: ModelId, selectedTagIds: Set<ModelId>, rejectedTagIds: Set<ModelId>): Promise<void>;
  dispatchConfirmedReply(action: ICommentAction, ids: Array<string>): void;
}

function ReplyItem(props: IReplyItemProps) {
  const {
    replyId,
    showActions,
    handleRowMouseEnter,
    handleRowMouseLeave,
    dispatchConfirmedReply,
    handleAssignTagsSubmit,
  } = props;
  const {comment: reply} = useCachedComment(replyId);
  return (
    <div
      {...css(STYLES.row)}
      onMouseEnter={partial(handleRowMouseEnter, replyId)}
      onMouseLeave={handleRowMouseLeave}
    >
      <div {...css(STYLES.body, STYLES.replyBody)}>
        <BasicBody
          comment={reply}
          commentLinkTarget={`/articles/${reply.articleId}/comments/${reply.id}`}
          showActions={showActions}
          handleAssignTagsSubmit={handleAssignTagsSubmit}
          dispatchConfirmedAction={dispatchConfirmedReply}
        />
      </div>
    </div>
  );
}

export interface IThreadedCommentProps {
  comment: ICommentModel;
  handleAssignTagsSubmit(commentId: ModelId, selectedTagIds: Set<ModelId>, rejectedTagIds: Set<ModelId>): Promise<void>;
}

export function ThreadedComment(props: IThreadedCommentProps) {
  const [hoveredRowId, setHoveredRowId] = useState<ModelId | null>(null);
  const [hoveredRowThresholdPassed, setHoveredRowThresholdPassed] = useState(false);

  function handleRowMouseEnter(id: string): void {
    setHoveredRowId(id);
    setTimeout(() => {
      if (hoveredRowId === id) {
        setHoveredRowThresholdPassed(true);
      }
    }, 180);
  }

  function handleRowMouseLeave(): void {
    setHoveredRowId(null);
    setHoveredRowThresholdPassed(false);
  }

  async function dispatchConfirmedAction(action: ICommentAction, ids: Array<string>) {
    await actionMap[action](ids);
  }

  async function dispatchConfirmedReply(action: ICommentAction, ids: Array<string>) {
    await actionMap[action](ids);
  }

  const {
    comment,
    handleAssignTagsSubmit,
  } = props;

  return (
    <div {...css(STYLES.base)}>
      <div
        {...css(STYLES.row)}
        onMouseEnter={partial(handleRowMouseEnter, comment.id)}
        onMouseLeave={handleRowMouseLeave}
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
            dispatchConfirmedAction={dispatchConfirmedAction}
          />
        </div>
      </div>

      { comment.replies && comment.replies.map((replyId) => (
        <ReplyItem
          key={replyId}
          replyId={replyId}
          showActions={(replyId === hoveredRowId) && hoveredRowThresholdPassed}
          handleRowMouseEnter={handleRowMouseEnter}
          handleRowMouseLeave={handleRowMouseLeave}
          handleAssignTagsSubmit={handleAssignTagsSubmit}
          dispatchConfirmedReply={dispatchConfirmedReply}
        />
      )) }
    </div>
  );
}
