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

import { List } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';
import {
  ITaggingSensitivityModel,
} from '../../../models';
import { IAppStateRecord } from '../../stores';
import { getArticleFromId } from '../../stores/articles';
import { ICommentSummaryScoreStateRecord } from '../../stores/commentSummaryScores';
import { getTaggingSensitivities } from '../../stores/taggingSensitivities';

const DATA_PREFIX = ['scenes', 'commentsIndex'];

function makeTabCountAdjusterStore(): any {
  type IResetTabCountAdjusterPayload = {
    uid: string | number;
  };
  const resetTabCountAdjusterAction =
    createAction<IResetTabCountAdjusterPayload>(`comments/RESET_TAB_COUNT_ADJUSTER`);

  type IAdjustTabCountPayload = {
    field: string;
    amount: number;
  };
  const adjustTabCountAction =
    createAction<IAdjustTabCountPayload>(`comments/ADJUST_TAB_COUNT`);

  interface ITabAdjusterState {
    uid: string | number;
    unmoderated: number;
    moderated: number;
  }

  interface ITabAdjusterStateRecord extends TypedRecord<ITabAdjusterStateRecord>, ITabAdjusterState {}

  const StateFactory = makeTypedFactory<ITabAdjusterState, ITabAdjusterStateRecord>({
    uid: null,
    unmoderated: 0,
    moderated: 0,
  });

  const initialState = StateFactory();

  const reducer = handleActions<
    ITabAdjusterStateRecord,
    IResetTabCountAdjusterPayload | // resetTabCountAdjuster
    IAdjustTabCountPayload          // adjustTabCount
  >({
    [resetTabCountAdjusterAction.toString()]: (state, { payload: { uid } }: Action<IResetTabCountAdjusterPayload>) => {
      if (state.get('uid') === uid) { return state; }

      return initialState.set('uid', uid);
    },

    [adjustTabCountAction.toString()]: (state, { payload: { field, amount } }: Action<IAdjustTabCountPayload>) => (
      state.update(field, (v: number) => v + amount)
    ),
  }, initialState);

  const DATA = [...DATA_PREFIX, 'tabCountAdjustments'];

  function getTabCountAdjustmentsFromState(state: IAppStateRecord): ITabAdjusterStateRecord {
    return state.getIn(DATA);
  }

  return {
    reducer,
    getTabCountAdjustments: getTabCountAdjustmentsFromState,
    resetTabCountAdjuster: resetTabCountAdjusterAction,
    adjustTabCount: adjustTabCountAction,
  };
}

function aboveThreshold(taggingSensitivities: List<ITaggingSensitivityModel>, score: ICommentSummaryScoreStateRecord): boolean {
  if (score.tagId === null) {
    return false;
  }

  return taggingSensitivities.some((ts) => {
    return (
      (ts.tagId === null || ts.tagId === score.tagId) &&
      (score.score >= ts.lowerThreshold && score.score <= ts.upperThreshold)
    );
  });
}

export function getSummaryScoresAboveThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  scores: List<ICommentSummaryScoreStateRecord>): List<ICommentSummaryScoreStateRecord> {
  if (!scores) {
    return;
  }

  return scores
      .filter((s) => aboveThreshold(taggingSensitivities, s))
      .sort((a, b) => b.score - a.score) as List<ICommentSummaryScoreStateRecord>;
}

export function getSummaryScoresBelowThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  scores: List<ICommentSummaryScoreStateRecord>): List<ICommentSummaryScoreStateRecord> {
  if (!scores) {
    return;
  }
  const scoresAboveThreshold = scores.filter((s) => aboveThreshold(taggingSensitivities, s)) as List<ICommentSummaryScoreStateRecord>;
  const scoresBelowThreshold = scores.filter((s) =>
      !aboveThreshold(taggingSensitivities, s) &&
      !scoresAboveThreshold.find((sa) => sa.tagId === s.tagId)) as List<ICommentSummaryScoreStateRecord>;

  return scoresBelowThreshold
      .sort((a, b) => b.score - a.score) as List<ICommentSummaryScoreStateRecord>;
}

export function getTaggingSensitivitiesInCategory(
  state: IAppStateRecord,
  categoryId?: string,
  articleId?: string): List<ITaggingSensitivityModel> {
  if (articleId) {
    const article = getArticleFromId(state, articleId);
    if (article) {
      categoryId = article.category.id;
    }
  }

  const taggingSensitivities = getTaggingSensitivities(state);

  return taggingSensitivities.filter((ts: ITaggingSensitivityModel) => (
    ts.categoryId === categoryId || ts.categoryId === null
  )) as List<ITaggingSensitivityModel>;
}

const {
  reducer: tabCountAdjustmentsReducer,
  getTabCountAdjustments,
  resetTabCountAdjuster,
  adjustTabCount,
} = makeTabCountAdjusterStore();

export {
  tabCountAdjustmentsReducer,
  getTabCountAdjustments,
  resetTabCountAdjuster,
  adjustTabCount,
};
