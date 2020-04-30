/*
Copyright 2020 Google Inc.

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

import {Action, handleActions} from 'redux-actions';

import {ICommentModel, ModelId, UNRESOLVED_FLAGS_COUNT} from '../../models';
import {commentAttributesUpdated, commentsUpdated, ICommentAttributesUpdate} from './globalActions';

function resolveFlags(flagsSummary?: Map<string, Array<number>>) {
  if (!flagsSummary) {
    return flagsSummary;
  }
  for (const summary of flagsSummary.values()) {
    summary[UNRESOLVED_FLAGS_COUNT] = 0;
  }

  return flagsSummary;
}

export interface INewCommentsState {
  index: Map<ModelId, ICommentModel>;
}

export const newReducer = handleActions<Readonly<INewCommentsState>, Array<ICommentModel> | ICommentAttributesUpdate>( {
  [commentsUpdated.toString()]: (state, { payload }: Action<Array<ICommentModel>>) => {
    const index = state.index;
    for (const comment of payload) {
      index.set(comment.id, comment);
    }
    return {index};
  },
  [commentAttributesUpdated.toString()]: (state, { payload }: Action<ICommentAttributesUpdate>) => {
    const index = state.index;
    for (const commentId of payload.commentIds) {
      const comment = index.get(commentId);
      if (comment) {
        let newComment = {
          ...comment,
          updatedAt: new Date().toISOString(),
        };
        if (payload.attributes) {
          newComment = {
            ...newComment,
            ...payload.attributes,
          };
          if (payload.attributes.isModerated === null) {
            delete newComment.isModerated;
          }
          if (payload.attributes.isAccepted === null) {
            delete newComment.isAccepted;
          }
        }
        if (payload.resolveFlags) {
          newComment.unresolvedFlagsCount = 0;
          newComment.flagsSummary = resolveFlags(newComment.flagsSummary);
        }
        index.set(commentId, newComment);
      }
    }
    return {index};
  },
}, {index: new Map()});
