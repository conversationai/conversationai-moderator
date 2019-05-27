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

import { fromJS, List, Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { combineReducers } from 'redux-immutable';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';

import {
  IAuthorCountsModel,
  ICommentFlagModel,
  ICommentModel,
  ICommentScoreModel,
  ITaggingSensitivityModel, ModelId,
} from '../../../../../models';
import {
  getComment as getCommentSvc,
  getCommentFlags,
  getCommentScores,
  listAuthorCounts,
} from '../../../../platform/dataService';
import { IThunkAction } from '../../../../stores';
import { getArticle } from '../../../../stores/articles';
import {
  makeAJAXAction,
  makeRecordListReducer,
  makeSingleRecordReducer,
} from '../../../../util';

import { getTaggingSensitivities } from '../../../../stores/taggingSensitivities';

const COMMENT_DATA_PREFIX = ['scenes', 'commentsIndex', 'commentDetail', 'comment'];
const COMMENT_DATA = [...COMMENT_DATA_PREFIX, 'item'];
const LOADING_STATUS = [...COMMENT_DATA_PREFIX, 'isFetching'];
const COMMENT_SCORES_DATA_PREFIX = ['scenes', 'commentsIndex', 'commentDetail', 'scores'];
const COMMENT_SCORES_DATA = [...COMMENT_SCORES_DATA_PREFIX, 'items'];
const COMMENT_FLAGS_DATA_PREFIX = ['scenes', 'commentsIndex', 'commentDetail', 'flags'];
const COMMENT_FLAGS_DATA = [...COMMENT_FLAGS_DATA_PREFIX, 'items'];
const COMMENT_PAGING_PREFIX = ['scenes', 'commentsIndex', 'commentDetail', 'paging'];
const COMMENT_PAGING_SOURCE = [...COMMENT_PAGING_PREFIX, 'source'];
const COMMENT_PAGING_LINK = [...COMMENT_PAGING_PREFIX, 'link'];
const COMMENT_PAGING_HASH = [...COMMENT_PAGING_PREFIX, 'hash'];
const COMMENT_PAGING_IDS = [...COMMENT_PAGING_PREFIX, 'commentIds'];
const COMMENT_PAGING_INDEXES = [...COMMENT_PAGING_PREFIX, 'indexById'];
const COMMENT_PAGING_FROM_BATCH = [...COMMENT_PAGING_PREFIX, 'fromBatch'];
const COMMENT_AUTHOR_COUNTS = ['scenes', 'commentsIndex', 'commentDetail', 'authorCounts'];
const COMMENT_AUTHOR_COUNTS_DATA = [...COMMENT_AUTHOR_COUNTS, 'authorCounts'];

const loadCommentStart =
  createAction('comment-detail/LOAD_COMMENT_START');
const loadCommentComplete =
  createAction<object>('comment-detail/LOAD_COMMENT_COMPLETE');
const loadCommentScoresStart =
  createAction('comment-detail/LOAD_COMMENT_SCORE_START');
const loadCommentScoresComplete =
  createAction<object>('comment-detail/LOAD_COMMENT_SCORE_COMPLETE');
const loadCommentFlagsStart =
  createAction('comment-detail/LOAD_COMMENT_FLAG_START');
const loadCommentFlagsComplete =
  createAction<object>('comment-detail/LOAD_COMMENT_FLAG_COMPLETE');
export const clearCommentPagingOptions: () => Action<void> =
  createAction('comment-detail/CLEAR_COMMENT_PAGING_OPTIONS');
const internalStoreCommentPagingOptions =
  createAction<ICommentPagingState>('comment-detail/STORE_COMMENT_PAGING_OPTIONS');

type IStoreAuthorCountsPayload = {
  authorCounts: Map<string | number, IAuthorCountsModel>;
};
const storeAuthorCounts =
  createAction<IStoreAuthorCountsPayload>('comment-detail/STORE_AUTHOR_COUNTS');

export function loadComment(id: string): IThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    await dispatch(makeAJAXAction(
      () => getCommentSvc(id),
      loadCommentStart,
      loadCommentComplete,
    ));

    const comment = getComment(getState());

    if (comment) {
      const { authorSourceId } = comment;
      const authorCounts = await listAuthorCounts([authorSourceId]);
      dispatch(storeAuthorCounts({ authorCounts }));
    }
  };
}

export function loadScores(id: string): IThunkAction<Promise<void>> {
  return makeAJAXAction(
    () => getCommentScores(id),
    loadCommentScoresStart,
    loadCommentScoresComplete,
  );
}

export function loadFlags(id: string): IThunkAction<Promise<void>> {
  return makeAJAXAction(
    () => getCommentFlags(id),
    loadCommentFlagsStart,
    loadCommentFlagsComplete,
  );
}

const {
  reducer: commentReducer,
  updateRecord: updateCommentRecord,
} = makeSingleRecordReducer<ICommentModel>(
  loadCommentStart.toString(),
  loadCommentComplete.toString(),
);

export const updateComment: (payload: ICommentModel) => Action<ICommentModel> = updateCommentRecord;

const {
  reducer: commentScoresReducer,
  addRecord: addCommentScoreRecord,
  updateRecord: updateCommentScoreRecord,
  removeRecord: removeCommentScoreRecord,
} = makeRecordListReducer<ICommentScoreModel>(
  loadCommentScoresStart.toString(),
  loadCommentScoresComplete.toString(),
);

const {
  reducer: commentFlagsReducer,
} = makeRecordListReducer<ICommentFlagModel>(
  loadCommentFlagsStart.toString(),
  loadCommentFlagsComplete.toString(),
);

export interface ICommentPagingState {
  commentIds: List<string>;
  fromBatch: boolean;
  source: string;
  link: string;
  hash?: string;
  indexById?: Map<number, number>;
}

export interface ICommentPagingStateRecord extends TypedRecord<ICommentPagingStateRecord>, ICommentPagingState {}

const StateFactory = makeTypedFactory<ICommentPagingState, ICommentPagingStateRecord>({
  commentIds: null,
  fromBatch: null,
  source: null,
  hash: null,
  indexById: Map<number, number>(),
  link: null,
});

// tslint:disable no-bitwise
function hashString(str: string): string {
  let hash = 0;

  if (str.length > 0) {
    for (let i = 0; i < str.length; i++) {
      const chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
  }

  return hash.toString(16);
}
// tslint:enable no-bitwise

export const storeCommentPagingOptions = (data: ICommentPagingState) => async (dispatch: any) => {
  const immutableData = fromJS(data);

  const hash = hashString(JSON.stringify(immutableData.toJSON()));

  dispatch(internalStoreCommentPagingOptions({
    ...data,
    hash,
  }));

  return hash;
};

export const commentPagingReducer = handleActions<
  ICommentPagingStateRecord,
  void                | // clearCommentPagingOptions
  ICommentPagingState   // internalStoreCommentPagingOptions
>({
  [clearCommentPagingOptions.toString()]: () => StateFactory(),

  [internalStoreCommentPagingOptions.toString()]: (_, { payload }: Action<ICommentPagingState>) => {
    const state = StateFactory(payload);

    const indexById = (state.get('commentIds') as List<number>)
        .reduce((sum, id, index) => {
          return sum.set(id, index);
        }, Map<number, number>());

    return state.set('indexById', indexById);
  },
}, StateFactory());

export function getPagingIsFromBatch(state: any): boolean | null {
  return state.getIn(COMMENT_PAGING_FROM_BATCH);
}

export function getPagingSource(state: any, currentHash: string): string | null {
  const hash = getPagingHash(state);
  if (hash !== currentHash) { return; }

  return state.getIn(COMMENT_PAGING_SOURCE);
}

export function getPagingLink(state: any, currentHash: string): string | null {
  const hash = getPagingHash(state);
  if (hash !== currentHash) { return; }

  return state.getIn(COMMENT_PAGING_LINK);
}

export function getPagingHash(state: any): string | null {
  return state.getIn(COMMENT_PAGING_HASH);
}

export function getPagingCommentIds(state: any): List<number> | null {
  return state.getIn(COMMENT_PAGING_IDS);
}

export function getPagingCommentIndexes(state: any): Map<number, number> {
  return state.getIn(COMMENT_PAGING_INDEXES);
}

export function getCurrentCommentIndex(state: any, currentHash: string, commentId: string): number | null {
  const hash = getPagingHash(state);
  if (hash !== currentHash) { return; }

  const index = getPagingCommentIndexes(state).get(parseInt(commentId, 10));

  if (typeof index !== 'undefined') {
    return index;
  } else {
    return null;
  }
}

export function getNextCommentId(state: any, currentHash: string, commentId: string): number | null {
  const hash = getPagingHash(state);
  if (hash !== currentHash) { return; }

  const ids = getPagingCommentIds(state);
  const index = getPagingCommentIndexes(state).get(parseInt(commentId, 10));

  if (typeof index !== 'undefined') {
    const nextIndex = index + 1;

    if (nextIndex > (ids.size - 1)) { return null; }

    return ids.get(nextIndex);
  }
}

export function getPreviousCommentId(state: any, currentHash: string, commentId: string): number | null {
  const hash = getPagingHash(state);
  if (hash !== currentHash) { return; }

  const ids = getPagingCommentIds(state);
  const index = getPagingCommentIndexes(state).get(parseInt(commentId, 10));

  if (typeof index !== 'undefined') {
    const nextIndex = index - 1;

    if (nextIndex < 0) { return null; }

    return ids.get(nextIndex);
  }
}

export interface IAuthorCountsState {
  authorCounts: Map<string | number, IAuthorCountsModel>;
}

export interface IAuthorCountsStateRecord extends TypedRecord<IAuthorCountsStateRecord>, IAuthorCountsState {}

const AuthorCountsStateFactory = makeTypedFactory<IAuthorCountsState, IAuthorCountsStateRecord>({
  authorCounts: Map<string | number, IAuthorCountsModel>(),
});

export const authorCountsReducer = handleActions<
  IAuthorCountsStateRecord,
  IStoreAuthorCountsPayload // storeAuthorCounts
>({
  [storeAuthorCounts.toString()]: (state, { payload: { authorCounts } }: Action<IStoreAuthorCountsPayload>) => {
    return state.mergeIn(['authorCounts'], Map(authorCounts));
  },
}, AuthorCountsStateFactory());

export const reducer: any = combineReducers({
  comment: commentReducer,
  scores: commentScoresReducer,
  flags: commentFlagsReducer,
  paging: commentPagingReducer,
  authorCounts: authorCountsReducer,
});

/* Set or delete items in the comment detail store created by makeRecordListReducer */

export const addCommentScore: (payload: ICommentScoreModel) => Action<ICommentScoreModel> = addCommentScoreRecord;
export const updateCommentScore: (payload: ICommentScoreModel) => Action<ICommentScoreModel> = updateCommentScoreRecord;
export const removeCommentScore: (payload: ICommentScoreModel) => Action<ICommentScoreModel> = removeCommentScoreRecord;

export function getComment(state: any): ICommentModel {
  return state.getIn(COMMENT_DATA);
}

export function getScores(state: any): List<ICommentScoreModel> {
  return state.getIn(COMMENT_SCORES_DATA);
}

export function getFlags(state: any): List<ICommentFlagModel> {
  return state.getIn(COMMENT_FLAGS_DATA);
}

export function getIsLoading(state: any): boolean {
  return state.getIn(LOADING_STATUS);
}

export function getTaggingSensitivitiesInCategory(state: any): List<ITaggingSensitivityModel> {
  let categoryId = 'na';
  const comment = getComment(state);
  if (comment) {
    const article = getArticle(state, comment.articleId);
    if (article.categoryId) {
      categoryId = article.categoryId;
    }
  }

  const taggingSensitivities = getTaggingSensitivities(state);
  return taggingSensitivities.filter((ts: ITaggingSensitivityModel) => (
    ts.categoryId === categoryId || ts.categoryId === null
  )) as List<ITaggingSensitivityModel>;
}

export function getTaggingSensitivityForTag(taggingSensitivities: List<ITaggingSensitivityModel>, tagId: ModelId) {
  return taggingSensitivities.find((ts) => ts.tagId === tagId || ts.categoryId === null);
}

function dedupeScoreTypes(scores: List<ICommentScoreModel>): List<ICommentScoreModel> {
  return scores
      .reduce((sum, score) => {
        const existingScore = sum.get(score.tagId);

        if (!existingScore || existingScore.score < score.score) {
          return sum.set(score.tagId, score);
        }

        return sum;
      }, Map<string, ICommentScoreModel>())
      .toList();
}

function aboveThreshold(taggingSensitivities: List<ITaggingSensitivityModel>, score: ICommentScoreModel): boolean {
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

export function getScoresAboveThreshold(taggingSensitivities: List<ITaggingSensitivityModel>, scores: List<ICommentScoreModel>): List<ICommentScoreModel> {
  return scores
      .filter((s) => aboveThreshold(taggingSensitivities, s))
      .sort((a, b) => b.score - a.score) as List<ICommentScoreModel>;
}

export function getScoresBelowThreshold(taggingSensitivities: List<ITaggingSensitivityModel>, scores: List<ICommentScoreModel>): List<ICommentScoreModel> {
  const scoresAboveThreshold = scores.filter((s) => aboveThreshold(taggingSensitivities, s)) as List<ICommentScoreModel>;
  const scoresBelowThreshold = scores.filter((s) =>
      !aboveThreshold(taggingSensitivities, s) &&
      !scoresAboveThreshold.find((sa) => sa.tagId === s.tagId)) as List<ICommentScoreModel>;

  return scoresBelowThreshold
      .sort((a, b) => b.score - a.score) as List<ICommentScoreModel>;
}

export function getReducedScoresAboveThreshold(taggingSensitivities: List<ITaggingSensitivityModel>, scores: List<ICommentScoreModel>): List<ICommentScoreModel> {
  return dedupeScoreTypes(getScoresAboveThreshold(taggingSensitivities, scores));
}

export function getReducedScoresBelowThreshold(taggingSensitivities: List<ITaggingSensitivityModel>, scores: List<ICommentScoreModel>): List<ICommentScoreModel> {
  return dedupeScoreTypes(getScoresBelowThreshold(taggingSensitivities, scores));
}

export function getAuthorCounts(state: any): IAuthorCountsStateRecord {
  return state.get(COMMENT_AUTHOR_COUNTS_DATA);
}

export function getAuthorCountsById(state: any, id: string | string): IAuthorCountsModel | undefined {
  return state.getIn([...COMMENT_AUTHOR_COUNTS_DATA, id]);
}
