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

import {ModelId} from '../../models';
import {
  approveCommentsRequest,
  approveFlagsAndCommentsRequest,
  confirmCommentScoreRequest,
  confirmCommentSummaryScoreRequest,
  deferCommentsRequest,
  deleteCommentTagRequest,
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

/**
 * Wrap a bunch of data service calls where we don't care about the result
 * in thunks for redux action dispatching and chaining.
 */

export async function deleteCommentTag(commentId: ModelId, commentScoreId: string) {
  await deleteCommentTagRequest(commentId, commentScoreId);
}

export async function highlightComments(commentIds: Array<ModelId>) {
  await highlightCommentsRequest(commentIds);
}

export async function resetComments(commentIds: Array<ModelId>) {
  await resetCommentsRequest(commentIds);
}

export async function approveComments(commentIds: Array<ModelId>) {
  await approveCommentsRequest(commentIds);
}

export async function approveFlagsAndComments(commentIds: Array<ModelId>) {
  await approveFlagsAndCommentsRequest(commentIds);
}

export async function resolveFlags(commentIds: Array<ModelId>) {
  await resolveFlagsRequest(commentIds);
}

export async function deferComments(commentIds: Array<ModelId>) {
  await deferCommentsRequest(commentIds);
}

export async function rejectComments(commentIds: Array<ModelId>) {
  await rejectCommentsRequest(commentIds);
}

export async function rejectFlagsAndComments(commentIds: Array<ModelId>) {
  await rejectFlagsAndCommentsRequest(commentIds);
}

export async function tagComments(commentIds: Array<ModelId>, tagId: string) {
  await tagCommentsRequest(commentIds, tagId);
}

export async function tagCommentsAnnotation(commentId: string, tagId: string, start: number, end: number) {
  await tagCommentsAnnotationRequest(commentId, tagId, start, end);
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
  await resetCommentScoreRequest(commentId, commentScoreId);
}

export async function confirmCommentScore(commentId: ModelId, commentScoreId: string) {
  await confirmCommentScoreRequest(commentId, commentScoreId);
}

export async function rejectCommentScore(commentId: ModelId, commentScoreId: string) {
  await rejectCommentScoreRequest(commentId, commentScoreId);
}

export type ICommentActionFunction = (ids: Array<string>, tagId?: string) => Promise<void>;
