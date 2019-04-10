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

export function deleteCommentTag(id: string, commentScoreId: string) {
  return (): Promise<void> => deleteCommentTagRequest(id, commentScoreId);
}

export function highlightComments(ids: Array<string>) {
  return (): Promise<void> => highlightCommentsRequest(ids);
}

export function resetComments(ids: Array<string>) {
  return (): Promise<void> => resetCommentsRequest(ids);
}

export function approveComments(ids: Array<string>) {
  return (): Promise<void> => approveCommentsRequest(ids);
}

export function approveFlagsAndComments(ids: Array<string>) {
  return (): Promise<void> => approveFlagsAndCommentsRequest(ids);
}

export function resolveFlags(ids: Array<string>) {
  return (): Promise<void> => resolveFlagsRequest(ids);
}

export function deferComments(ids: Array<string>) {
  return (): Promise<void> => deferCommentsRequest(ids);
}

export function rejectComments(ids: Array<string>) {
  return (): Promise<void> => rejectCommentsRequest(ids);
}

export function rejectFlagsAndComments(ids: Array<string>) {
  return (): Promise<void> => rejectFlagsAndCommentsRequest(ids);
}

export function tagComments(ids: Array<string>, tagId: string) {
  return (): Promise<void> => tagCommentsRequest(ids, tagId);
}

export function tagCommentsAnnotation(id: string, tagId: string, start: number, end: number) {
  return (): Promise<void> => tagCommentsAnnotationRequest(id, tagId, start, end);
}

export function tagCommentSummaryScores(ids: Array<string>, tagId: string) {
  return (): Promise<void> => tagCommentSummaryScoresRequest(ids, tagId);
}

export function confirmCommentSummaryScore(commentId: string, tagId: string) {
  return (): Promise<void> => confirmCommentSummaryScoreRequest(commentId, tagId);
}

export function rejectCommentSummaryScore(id: string, tagId: string) {
  return (): Promise<void> => rejectCommentSummaryScoreRequest(id, tagId);
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
