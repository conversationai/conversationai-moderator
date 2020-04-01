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
import {CommentModel, ICommentModel, ModelId} from '../../models';
import {IAppState} from '../appstate';
import {fetchComments} from '../stores/commentActions';

const commentFetchQueue = new Set();

export interface ICommentCacheProps {
  comment: ICommentModel;
  inCache: boolean;
}

function ensureCache(commentId: ModelId) {
  if (!commentFetchQueue.has(commentId)) {
    commentFetchQueue.add(commentId);
    fetchComments([commentId]);
  }
}

export function getCachedComment(state: IAppState, commentId: ModelId): ICommentCacheProps {
  const comment: ICommentModel = state.global.newComments.index.get(commentId);
  if (comment) {
    commentFetchQueue.delete(commentId);
    return {comment, inCache: true};
  }

  ensureCache(commentId);

  return {
    inCache: false,
    comment: CommentModel({
      id: commentId,
      sourceId: '',
      sourceCreatedAt: '',
      updatedAt: '',
      replyId: null,
      replyToSourceId: null,
      authorSourceId: null,
      text: '',
      author: null,
      isScored: null,
      isModerated: null,
      isAccepted: null,
      isDeferred: null,
      isHighlighted: null,
      isBatchResolved: null,
      isAutoResolved: null,
      unresolvedFlagsCount: null,
      flagsSummary: null,
      sentForScoring: null,
      articleId: null,
      replies: null,
      maxSummaryScore: null,
      maxSummaryScoreTagId: null,
    }),
  };
}
