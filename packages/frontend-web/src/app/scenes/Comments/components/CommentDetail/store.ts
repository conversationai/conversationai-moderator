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
import { combineReducers } from 'redux';
import { Action, createAction, handleActions } from 'redux-actions';

import {
  IAuthorCountsModel,
  ICommentFlagModel,
  ICommentModel,
  ICommentScoreModel,
  ITaggingSensitivityModel,
  ModelId,
} from '../../../../../models';
import { IAppDispatch, IAppState } from '../../../../appstate';
import {
  getComment as getCommentSvc,
  getCommentFlags,
  getCommentScores,
  listAuthorCounts,
} from '../../../../platform/dataService';
import { getArticle } from '../../../../stores/articles';
import {
  IRecordListState,
  ISingleRecordState,
  makeRecordListReducer,
  makeSingleRecordReducer,
} from '../../../../util';

import { getTaggingSensitivities } from '../../../../stores/taggingSensitivities';

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
  authorCounts: Map<string, IAuthorCountsModel>;
};
const storeAuthorCounts =
  createAction<IStoreAuthorCountsPayload>('comment-detail/STORE_AUTHOR_COUNTS');

export async function loadComment(dispatch: IAppDispatch, id: string) {
  await dispatch(loadCommentStart());
  const result = await getCommentSvc(id);
  const data = result.response;
  await dispatch(loadCommentComplete(data));

  if (data.data && data.data.attributes.authorSourceId) {
    const authorSourceId = data.data.attributes.authorSourceId;
    const authorCounts = await listAuthorCounts([authorSourceId]);
    dispatch(storeAuthorCounts({authorCounts}));
  }
}

export async function loadScores(dispatch: IAppDispatch, id: string) {
  await dispatch(loadCommentScoresStart());
  const result = await getCommentScores(id);
  const data = result.response;
  await dispatch(loadCommentScoresComplete(data));
}

export async function loadFlags(dispatch: IAppDispatch, id: string) {
  await dispatch(loadCommentFlagsStart());
  const result = await getCommentFlags(id);
  const data = result.response;
  await dispatch(loadCommentFlagsComplete(data));
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
  indexById?: Map<string, number>;
}

export type ICommentPagingStateRecord = Readonly<ICommentPagingState>;

const initialState: ICommentPagingStateRecord = {
  commentIds: null,
  fromBatch: null,
  source: null,
  hash: null,
  indexById: Map<string, number>(),
  link: null,
};

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
  [clearCommentPagingOptions.toString()]: () => initialState,

  [internalStoreCommentPagingOptions.toString()]: (_, { payload }: Action<ICommentPagingState>) => {
    const indexById = payload['commentIds'].reduce((sum, id, index) => sum.set(id, index), Map<string, number>());
    return { ...payload, indexById };
  },
}, initialState);

export function getCommentPagingRecord(state: IAppState) {
  return state.scenes.comments.commentDetail.paging;
}

export function getPagingIsFromBatch(state: IAppState) {
  const commentPaging =  getCommentPagingRecord(state);
  return commentPaging && commentPaging.fromBatch;
}

export function getPagingSource(state: IAppState, currentHash: string) {
  const hash = getPagingHash(state);
  if (hash !== currentHash) { return; }
  const commentPaging =  getCommentPagingRecord(state);
  return commentPaging && commentPaging.source;
}

export function getPagingLink(state: IAppState, currentHash: string) {
  const hash = getPagingHash(state);
  if (hash !== currentHash) { return; }
  const commentPaging =  getCommentPagingRecord(state);
  return commentPaging && commentPaging.link;
}

export function getPagingHash(state: IAppState) {
  const commentPaging =  getCommentPagingRecord(state);
  return commentPaging && commentPaging.hash;
}

export function getPagingCommentIds(state: IAppState) {
  const commentPaging = getCommentPagingRecord(state);
  return commentPaging && commentPaging.commentIds;
}

export function getPagingCommentIndexes(state: IAppState) {
  const commentPaging =  getCommentPagingRecord(state);
  return commentPaging && commentPaging.indexById;
}

export function getCurrentCommentIndex(state: IAppState, currentHash: string, commentId: string) {
  const hash = getPagingHash(state);
  if (hash !== currentHash) { return; }

  const index = getPagingCommentIndexes(state).get(commentId);

  if (typeof index !== 'undefined') {
    return index;
  } else {
    return null;
  }
}

export function getNextCommentId(state: IAppState, currentHash: string, commentId: string) {
  const hash = getPagingHash(state);
  if (hash !== currentHash) { return; }

  const ids = getPagingCommentIds(state);
  const index = getPagingCommentIndexes(state).get(commentId);

  if (typeof index !== 'undefined') {
    const nextIndex = index + 1;

    if (nextIndex > (ids.size - 1)) { return null; }

    return ids.get(nextIndex);
  }
}

export function getPreviousCommentId(state: IAppState, currentHash: string, commentId: string) {
  const hash = getPagingHash(state);
  if (hash !== currentHash) { return; }

  const ids = getPagingCommentIds(state);
  const index = getPagingCommentIndexes(state).get(commentId);

  if (typeof index !== 'undefined') {
    const nextIndex = index - 1;

    if (nextIndex < 0) { return null; }

    return ids.get(nextIndex);
  }
}

export type IAuthorCountsState = Readonly<{
  authorCounts: Map<string, IAuthorCountsModel>;
}>;

export const authorCountsReducer = handleActions<
  IAuthorCountsState,
  IStoreAuthorCountsPayload // storeAuthorCounts
>({
  [storeAuthorCounts.toString()]: (state, { payload: { authorCounts } }: Action<IStoreAuthorCountsPayload>) => {
    return {
      authorCounts: state['authorCounts'].merge(Map(authorCounts)),
    };
  },
}, {
  authorCounts: Map<string, IAuthorCountsModel>(),
});

export function getAuthorCountsRecord(state: IAppState) {
  return state.scenes.comments.commentDetail.authorCounts;
}

export type ICommentDetailState = Readonly<{
  comment: ISingleRecordState<ICommentModel>;
  scores: IRecordListState<ICommentScoreModel>;
  flags: IRecordListState<ICommentFlagModel>;
  paging: ICommentPagingState;
  authorCounts: IAuthorCountsState;
}>;

export const reducer = combineReducers<ICommentDetailState>({
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

export function getComment(state: IAppState) {
  return state.scenes.comments.commentDetail.comment.item;
}

export function getScores(state: IAppState) {
  return state.scenes.comments.commentDetail.scores.items;
}

export function getFlags(state: IAppState) {
  return state.scenes.comments.commentDetail.flags.items;
}

export function getIsLoading(state: IAppState) {
  return state.scenes.comments.commentDetail.comment.isFetching;
}

export function getTaggingSensitivitiesInCategory(state: IAppState): List<ITaggingSensitivityModel> {
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

export function getAuthorCountsById(state: IAppState, id: string) {
  const authorCountsRecord = getAuthorCountsRecord(state);
  return authorCountsRecord.authorCounts.get(id);
}
