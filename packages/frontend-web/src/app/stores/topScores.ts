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
import { Action } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { loadTopScoresForSummaryScores, loadTopScoresForTag } from '../platform/dataService';
import { IQueuedModelStateRecord, makeQueuedModelStore } from '../util';
import { IAppStateRecord, IThunkAction } from './index';

export interface ITopScoreState {
  commentId: string;
  start: number;
  end: number;
  score: number;
}

export interface ITopScoreStateRecord extends TypedRecord<ITopScoreStateRecord>, ITopScoreState {}

const TopScore = makeTypedFactory<ITopScoreState, ITopScoreStateRecord>({
  commentId: null,
  start: null,
  end: null,
  score: null,
});

export interface ITopScoresKeyState {
  commentId: string;
  tagId: string;
}

export interface ITopScoresKeyStateRecord extends TypedRecord<ITopScoresKeyStateRecord>, ITopScoresKeyState {}

const TopScoresKey = makeTypedFactory<ITopScoresKeyState, ITopScoresKeyStateRecord>({
  commentId: null,
  tagId: null,
});

export interface ITopSummaryScoresKeyState {
  commentId: string;
}

export interface ITopSummaryScoresKeyStateRecord extends TypedRecord<ITopSummaryScoresKeyStateRecord>, ITopSummaryScoresKeyState {}

const TopSummaryScoresKey = makeTypedFactory<ITopSummaryScoresKeyState, ITopSummaryScoresKeyStateRecord>({
  commentId: null,
});

const queuedModelStore = makeQueuedModelStore<ITopScoresKeyState, ITopScoreStateRecord>(
  async (keys: List<ITopScoresKeyState>) => {
    const commentIds = keys.map((k) => k.commentId) as List<string>;
    const tagId = keys.first().tagId;

    const scores = await loadTopScoresForTag(commentIds, tagId);

    return scores.reduce((sum: any, score: any) => {
      const key = TopScoresKey({ commentId: score.commentId, tagId });

      return sum.set(key, TopScore(score));
    }, Map<ITopScoresKeyState, ITopScoreStateRecord>());
  },
  300,
  12,
  ['global', 'topScores'],
);

const {
  reducer: scoreReducer,
  loadModel: loadTopScoreByKey,
  getModels: getTopScores,
  getModel: getTopScore,
} = queuedModelStore;

const setTopScore: (payload: any) => Action<any> = queuedModelStore.setModel;

export type IState = IQueuedModelStateRecord<ITopScoresKeyState, ITopScoreStateRecord>;

export function getTopScoreForComment(state: IAppStateRecord, commentId: string, tagId: string): ITopScoreState {
  const topScores = getTopScores(state);

  return topScores.get(TopScoresKey({ commentId, tagId }));
}

export function loadTopScore(commentId: string, tagId: string): IThunkAction<void> {
  return loadTopScoreByKey(TopScoresKey({ commentId, tagId }));
}

// Separate out Summary Scores because they need to be accessed differently

const {
  reducer: summaryScoreReducer,
  loadModel: loadTopSummaryScoreByKey,
  getModels: getTopSummaryScores,
  getModel: getTopSummaryScore,
  setModel: setTopSummaryScore,
} = makeQueuedModelStore<ITopSummaryScoresKeyState, ITopScoreStateRecord>(
  async (keys: List<ITopSummaryScoresKeyState>) => {
    const scores = await loadTopScoresForSummaryScores(keys.toArray());

    return scores.reduce((sum: any, score: any) => {
      const key = TopSummaryScoresKey({ commentId: score.commentId});

      return sum.set(key, TopScore(score));
    }, Map<ITopSummaryScoresKeyState, ITopScoreStateRecord>());
  },
  300,
  12,
  ['global', 'topSummaryScores'],
);

export type ISummaryState = IQueuedModelStateRecord<ITopSummaryScoresKeyState, ITopScoreStateRecord>;

export function getTopSummaryScoreForComment(state: IAppStateRecord, commentId: string): ITopScoreState {
  const topScores = getTopSummaryScores(state);

  return topScores.get(TopSummaryScoresKey({ commentId }));
}

export function loadTopSummaryScore(commentId: string): IThunkAction<void> {
  return loadTopSummaryScoreByKey(TopSummaryScoresKey({ commentId }));
}

export {
  scoreReducer,
  summaryScoreReducer,
  getTopScore,
  setTopScore,
  setTopSummaryScore,
  getTopSummaryScore,
};
