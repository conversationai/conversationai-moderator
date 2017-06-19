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

import {
  approveCommentsRequest,
  confirmCommentScoreRequest,
  confirmCommentSummaryScoreRequest,
  deferCommentsRequest,
  deleteCommentTagRequest,
  highlightCommentsRequest,
  rejectCommentScoreRequest,
  rejectCommentsRequest,
  rejectCommentSummaryScoreRequest,
  resetCommentScoreRequest,
  resetCommentsRequest,
  tagCommentsAnnotationRequest,
  tagCommentsRequest,
  tagCommentSummaryScoresRequest,
} from '../util';

/**
 * Wrap a bunch of data service calls where we don't care about the result
 * in thunks for redux action dispatching and chaining.
 */

export function deleteCommentTag(id: string, commentScoreId: string) {
  return (): Promise<void> => deleteCommentTagRequest(id, commentScoreId);
}

export function highlightComments(ids: Array<string>, userId: string) {
  return (): Promise<void> => highlightCommentsRequest(ids, userId);
}

export function resetComments(ids: Array<string>, userId: string) {
  return (): Promise<void> => resetCommentsRequest(ids, userId);
}

export function approveComments(ids: Array<string>, userId: string) {
  return (): Promise<void> => approveCommentsRequest(ids, userId);
}

export function deferComments(ids: Array<string>, userId: string) {
  return (): Promise<void> => deferCommentsRequest(ids, userId);
}

export function rejectComments(ids: Array<string>, userId: string) {
  return (): Promise<void> => rejectCommentsRequest(ids, userId);
}

export function tagComments(ids: Array<string>, tagId: string, userId: string) {
  return (): Promise<void> => tagCommentsRequest(ids, tagId, userId);
}

export function tagCommentsAnnotation(id: string, tagId: string, start: number, end: number) {
  return (): Promise<void> => tagCommentsAnnotationRequest(id, tagId, start, end);
}

export function tagCommentSummaryScores(ids: Array<string>, tagId: string, userId: string) {
  return (): Promise<void> => tagCommentSummaryScoresRequest(ids, tagId, userId);
}

export function confirmCommentSummaryScore(commentId: string, tagId: string, userId: string) {
  return (): Promise<void> => confirmCommentSummaryScoreRequest(commentId, tagId, userId);
}

export function rejectCommentSummaryScore(id: string, tagId: string, userId: string) {
  return (): Promise<void> => rejectCommentSummaryScoreRequest(id, tagId, userId);
}

export function resetCommentScore(commentId: string, commentScoreId: string) {
  return (): Promise<void> => resetCommentScoreRequest(commentId, commentScoreId);
}

export function confirmCommentScore(commentId: string, commentScoreId: string) {
  return (): Promise<void> => confirmCommentScoreRequest(commentId, commentScoreId);
}

export function rejectCommentScore(commentId: string, commentScoreId: string) {
  return (): Promise<void> => rejectCommentScoreRequest(commentId, commentScoreId);
}
