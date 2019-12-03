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

import { List, Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';

import { IAppDispatch, IAppStateRecord } from '../appstate';
import { listCommentSummaryScoresById } from '../platform/dataService';

export interface ICommentSummaryScore {
  tagId: string;
  score: number;
}

export interface ICommentSummaryScoreStateRecord extends TypedRecord<ICommentSummaryScoreStateRecord>, ICommentSummaryScore {}

const CommentSummaryScore = makeTypedFactory<ICommentSummaryScore, ICommentSummaryScoreStateRecord>({
  tagId: null,
  score: null,
});

export type ICommentSummaryScores = Map<number, List<ICommentSummaryScore>>;

export interface ICommentSummaryScoresState {
  isReady: boolean;
  items: ICommentSummaryScores;
}

export interface ICommentSummaryScoresStateRecord extends TypedRecord<ICommentSummaryScoresStateRecord>, ICommentSummaryScoresState {}

const StateFactory = makeTypedFactory<ICommentSummaryScoresState, ICommentSummaryScoresStateRecord>({
  isReady: false,
  items: null,
});

const STATE_ROOT = ['global', 'commentSummaryScores'];
const COMMENT_SUMMARY_SCORES_DATA = [...STATE_ROOT, 'items'];

export const loadCommentSummaryScoresStart: () => Action<void> = createAction(
    'comment-summary-scores/LOAD_COMMENT_SUMMARY_SCORES_START',
  );

export type ILoadCommentSummaryScoresCompletePayload = Map<string, List<ICommentSummaryScoreStateRecord>>;
export const loadCommentSummaryScoresComplete: (payload: ILoadCommentSummaryScoresCompletePayload) => Action<ILoadCommentSummaryScoresCompletePayload> =
  createAction<ILoadCommentSummaryScoresCompletePayload>(
    'comment-summary-scores/LOAD_COMMENT_SUMMARY_SCORES_COMPLETE',
  );

export const reducer = handleActions<
  ICommentSummaryScoresStateRecord,
  ILoadCommentSummaryScoresCompletePayload
>({
  [loadCommentSummaryScoresStart.toString()]: (state) => (
    state
        .set('isReady', false)
  ),
  [loadCommentSummaryScoresComplete.toString()]: (state, { payload }: Action<ILoadCommentSummaryScoresCompletePayload>) => (
    state
        .set('isReady', true)
        .update('items', (s: Map<string, List<ICommentSummaryScoreStateRecord>>) => s ? s.merge(payload) : payload)
  ),
}, StateFactory());

export async function loadCommentSummaryScores(dispatch: IAppDispatch, commentId: string) {
  await dispatch(loadCommentSummaryScoresStart());
  const scores = await listCommentSummaryScoresById(commentId);
  const mappedScores = scores.reduce((sum, score) => {
    const existingList = sum.get(commentId) ? sum.get(commentId) : List<ICommentSummaryScoreStateRecord>();

    return sum.set(score.commentId, existingList.push(CommentSummaryScore(score)));
  }, Map<string, List<ICommentSummaryScoreStateRecord>>());

  await dispatch(loadCommentSummaryScoresComplete(mappedScores));
}

export function getSummaryScores(state: IAppStateRecord): ICommentSummaryScores {
  return state.getIn(COMMENT_SUMMARY_SCORES_DATA);
}

export function getSummaryScoresById(state: IAppStateRecord, commentId: string): List<ICommentSummaryScoreStateRecord> {
  return state.getIn([...COMMENT_SUMMARY_SCORES_DATA, commentId]);
}
