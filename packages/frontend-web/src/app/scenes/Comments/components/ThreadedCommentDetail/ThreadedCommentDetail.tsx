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
import React from 'react';
import { useParams } from 'react-router';

import { ModelId } from '../../../../../models';
import {
  RejectIcon,
} from '../../../../components';
import { useCachedComment } from '../../../../injectors/commentInjector';
import {
  rejectComments,
  tagCommentSummaryScores,
} from '../../../../stores/commentActions';
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

export function ThreadedCommentDetail() {
  const {commentId} = useParams<ICommentDetailsPathParams>();
  const {comment} = useCachedComment(commentId);

  function onCloseClick() {
    setTimeout(() => window.history.back(), 60);
  }

  async function handleAssignTagsSubmit(toUpdateId: ModelId, selectedTagIds: Set<ModelId>) {
    selectedTagIds.forEach((tagId) => {
      tagCommentSummaryScores([toUpdateId], tagId);
    });
    await rejectComments([toUpdateId]);
  }

  return (
    <div>
      <div key="buttons" {...css(STYLES.header)}>
        Replies to comment #{comment.sourceId} from {comment.author?.name}
        <button
          type="button"
          onClick={onCloseClick}
          {...css(STYLES.closeButton)}
          aria-label="Go back"
        >
          <RejectIcon {...css({ fill: DARK_COLOR })} />
        </button>
      </div>
      <div key="comments" {...css(STYLES.body)}>
        <ThreadedComment
          comment={comment}
          handleAssignTagsSubmit={handleAssignTagsSubmit}
        />
      </div>
    </div>
  );
}
