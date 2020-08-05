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

import {CommentScoreModel, IAuthorAttributes, ICommentScoreAttributes, ModelId} from '../../models';
import {
  approveCommentsRequest,
  approveFlagsAndCommentsRequest,
  confirmCommentScoreRequest,
  confirmCommentSummaryScoreRequest,
  deferCommentsRequest,
  deleteCommentScoreRequest,
  editAndRescoreCommentRequest,
  getComments,
  highlightCommentsRequest,
  rejectCommentScoreRequest,
  rejectCommentsRequest,
  rejectCommentSummaryScoreRequest,
  rejectFlagsAndCommentsRequest,
  resetCommentScoreRequest,
  resetCommentsRequest,
  resolveFlagsRequest,
  tagCommentsAnnotationRequest,
  tagCommentsRequest,
  tagCommentSummaryScoresRequest,
} from '../platform/dataService';
import {store} from '../store';
import {
  addCommentScore,
  ATTRIBUTES_APPROVED,
  ATTRIBUTES_DEFERRED,
  ATTRIBUTES_HIGHLIGHTED,
  ATTRIBUTES_REJECTED,
  ATTRIBUTES_RESET,
  commentAttributesUpdated,
  commentsUpdated,
  removeAllCommentScores,
  removeCommentScore,
  updateCommentScore,
} from './globalActions';
import {getMyUserId} from './users';

export async function fetchComments(commentIds: Array<ModelId>) {
  const comments = await getComments(commentIds);
  store.dispatch(commentsUpdated(comments));
}

export async function highlightComments(commentIds: Array<ModelId>) {
  await highlightCommentsRequest(commentIds);
  store.dispatch(commentAttributesUpdated({commentIds, attributes: ATTRIBUTES_HIGHLIGHTED}));
}

export async function resetComments(commentIds: Array<ModelId>) {
  await resetCommentsRequest(commentIds);
  store.dispatch(commentAttributesUpdated({commentIds, attributes: ATTRIBUTES_RESET}));
}

export async function approveComments(commentIds: Array<ModelId>) {
  await approveCommentsRequest(commentIds);
  store.dispatch(commentAttributesUpdated({commentIds, attributes: ATTRIBUTES_APPROVED}));
}

export async function approveFlagsAndComments(commentIds: Array<ModelId>) {
  await approveFlagsAndCommentsRequest(commentIds);
  store.dispatch(commentAttributesUpdated({commentIds, attributes: ATTRIBUTES_APPROVED, resolveFlags: true}));
}

export async function resolveFlags(commentIds: Array<ModelId>) {
  await resolveFlagsRequest(commentIds);
  store.dispatch(commentAttributesUpdated({commentIds,  resolveFlags: true}));
}

export async function deferComments(commentIds: Array<ModelId>) {
  await deferCommentsRequest(commentIds);
  store.dispatch(commentAttributesUpdated({commentIds, attributes: ATTRIBUTES_DEFERRED}));
}

export async function rejectComments(commentIds: Array<ModelId>) {
  await rejectCommentsRequest(commentIds);
  store.dispatch(commentAttributesUpdated({commentIds, attributes: ATTRIBUTES_REJECTED}));
}

export async function rejectFlagsAndComments(commentIds: Array<ModelId>) {
  await rejectFlagsAndCommentsRequest(commentIds);
  store.dispatch(commentAttributesUpdated({commentIds, attributes: ATTRIBUTES_REJECTED, resolveFlags: true}));
}

function sendAddScoreAction(commentId: ModelId, tagId: ModelId, start?: number, end?: number) {
  const score: ICommentScoreAttributes = {
    id: null,
    commentId: commentId,
    isConfirmed: true,
    confirmedUserId: getMyUserId(),
    sourceType: 'Moderator',
    score: 1,
    tagId,
  };
  if (start) {
    score.annotationStart = start;
  }
  if (end) {
    score.annotationEnd = end;
  }
  store.dispatch(addCommentScore(CommentScoreModel(score)));
}

export async function tagComment(commentId: ModelId, tagId: ModelId) {
  sendAddScoreAction(commentId, tagId);
  await tagCommentsRequest([commentId], tagId);
}

export async function tagCommentWithAnnotation(commentId: string, tagId: string, start: number, end: number) {
  sendAddScoreAction(commentId, tagId, start, end);
  await tagCommentsAnnotationRequest(commentId, tagId, start, end);
}

export async function untagComment(commentId: ModelId, commentScoreId: string) {
  store.dispatch(removeCommentScore(commentScoreId));
  await deleteCommentScoreRequest(commentId, commentScoreId);
}

export async function tagCommentSummaryScores(commentIds: Array<ModelId>, tagId: string) {
  await tagCommentSummaryScoresRequest(commentIds, tagId);
}

export async function confirmCommentSummaryScore(commentId: ModelId, tagId: string) {
  await confirmCommentSummaryScoreRequest(commentId, tagId);
}

export async function rejectCommentSummaryScore(commentId: ModelId, tagId: string) {
  await rejectCommentSummaryScoreRequest(commentId, tagId);
}

export async function resetCommentScore(commentId: ModelId, commentScoreId: string) {
  store.dispatch(updateCommentScore({
    id: commentScoreId,
    confirmedUserId: null,
    isConfirmed: null,
  }));
  await resetCommentScoreRequest(commentId, commentScoreId);
}

export async function confirmCommentScore(commentId: ModelId, commentScoreId: string) {
  store.dispatch(updateCommentScore({
    id: commentScoreId,
    isConfirmed: true,
    confirmedUserId: getMyUserId(),
  }));
  await confirmCommentScoreRequest(commentId, commentScoreId);
}

export async function rejectCommentScore(commentId: ModelId, commentScoreId: string) {
  store.dispatch(updateCommentScore({
    id: commentScoreId,
    isConfirmed: false,
    confirmedUserId: getMyUserId(),
  }));
  await rejectCommentScoreRequest(commentId, commentScoreId);
}

export async function editAndRescoreComment(
  commentId: ModelId,
  text: string,
  author: IAuthorAttributes,
): Promise<void> {
  store.dispatch(removeAllCommentScores(commentId));
  await editAndRescoreCommentRequest(commentId, text, author.name, author.location);
  store.dispatch(commentAttributesUpdated({
    commentIds: [commentId],
    attributes: {...ATTRIBUTES_RESET, text, author, summaryScores: []}}));
}

export type ICommentActionFunction = (ids: Array<string>, tagId?: string) => Promise<void>;
