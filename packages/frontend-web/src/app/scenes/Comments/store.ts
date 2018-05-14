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
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {
  IArticleAttributes,
  IArticleModel,
  ITaggingSensitivityModel,
} from '../../../models';
import { IAppStateRecord, IThunkAction } from '../../stores';
import { ICommentSummaryScoreStateRecord } from '../../stores/commentSummaryScores';
import { getTaggingSensitivities } from '../../stores/taggingSensitivities';
import {
  getModel,
  ISingleResponse,
  makeAJAXAction,
  makeSingleRecordReducer,
  updateModel,
} from '../../util';

const DATA_PREFIX = ['scenes', 'commentsIndex'];

export interface ITabCount {
  field: string;
  amount: number;
}

function makeRootModelStore<T>(name: string, getter: any): any {
  const HAS_DATA = [...DATA_PREFIX, name, 'hasData'];
  const DATA = [...DATA_PREFIX, name, 'item'];
  const LOADING_STATUS = [...DATA_PREFIX, name, 'shouldWait'];

  const loadModelStart =
    createAction(`comments/ROOT_LOAD_${name.toUpperCase()}_START`);

  const loadModelComplete =
    createAction<object>(`comments/ROOT_LOAD_${name.toUpperCase()}_COMPLETE`);

  function loadModel(id: string): IThunkAction<void> {
    return makeAJAXAction(
      () => getter(id),
      loadModelStart,
      loadModelComplete,
      (state: IAppStateRecord) => (
        state.getIn(HAS_DATA) && id === state.getIn([...DATA, 'id'])
      ),
    );
  }

  const { reducer, updateRecord } = makeSingleRecordReducer<T>(
    loadModelStart.toString(),
    loadModelComplete.toString(),
  );

  function getModel(state: IAppStateRecord): T {
    return state.getIn(DATA);
  }

  function getIsLoading(state: IAppStateRecord): boolean {
    return state.getIn(LOADING_STATUS);
  }

  return {
    reducer,
    updateRecord,
    loadModel,
    getModel,
    getIsLoading,
  };
}

const {
  reducer: articleReducer,
  updateRecord: updateArticleRecord,
  loadModel: loadArticle,
  getModel: getArticle,
  getIsLoading: getArticleIsLoading,
} = makeRootModelStore<IArticleModel>(
  'article',
  (id: string) => getModel('articles', id, { include: ['category']}),
);

export {
  articleReducer,
  updateArticleRecord,
  loadArticle,
  getArticle,
  getArticleIsLoading,
};

export function updateArticleStatus(article: Partial<IArticleAttributes>): Promise<ISingleResponse<IArticleModel>> {
  return updateModel<IArticleModel>(
    'articles',
    article.id,
    article as any,
  );
}

function makeTabCountAdjusterStore(): any {
  type IResetTabCountAdjusterPayload = {
    uid: string | number;
  };
  const resetTabCountAdjuster =
    createAction<IResetTabCountAdjusterPayload>(`comments/RESET_TAB_COUNT_ADJUSTER`);

  type IAdjustTabCountPayload = {
    field: string;
    amount: number;
  };
  const adjustTabCount =
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
    [resetTabCountAdjuster.toString()]: (state, { payload: { uid } }: Action<IResetTabCountAdjusterPayload>) => {
      if (state.get('uid') === uid) { return state; }

      return initialState.set('uid', uid);
    },

    [adjustTabCount.toString()]: (state, { payload: { field, amount } }: Action<IAdjustTabCountPayload>) => (
      state.update(field, (v: number) => v + amount)
    ),
  }, initialState);

  const DATA = [...DATA_PREFIX, 'tabCountAdjustments'];

  function getTabCountAdjustments(state: IAppStateRecord): ITabAdjusterStateRecord {
    return state.getIn(DATA);
  }

  return {
    reducer,
    getTabCountAdjustments,
    resetTabCountAdjuster,
    adjustTabCount,
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

export function getSummaryScoresAboveThreshold(taggingSensitivities: List<ITaggingSensitivityModel>, scores: List<ICommentSummaryScoreStateRecord>): List<ICommentSummaryScoreStateRecord> {
  if (!scores) {
    return;
  }

  return scores
      .filter((s) => aboveThreshold(taggingSensitivities, s))
      .sort((a, b) => b.score - a.score) as List<ICommentSummaryScoreStateRecord>;
}

export function getSummaryScoresBelowThreshold(taggingSensitivities: List<ITaggingSensitivityModel>, scores: List<ICommentSummaryScoreStateRecord>): List<ICommentSummaryScoreStateRecord> {
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

export function getTaggingSensitivitiesInCategory(state: any, catId?: string): List<ITaggingSensitivityModel> {
  const article = getArticle(state);
  let categoryId = catId;
  if (article) {
    categoryId = article.category.id;
  }

  const taggingSensitivities = getTaggingSensitivities(state);

  return taggingSensitivities
      .filter((ts: ITaggingSensitivityModel) => ts.categoryId === categoryId || ts.categoryId === null) as List<ITaggingSensitivityModel>;
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
