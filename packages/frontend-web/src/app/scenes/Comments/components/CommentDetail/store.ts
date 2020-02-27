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
import {
  ISingleRecordState,
  makeSingleRecordReducer,
} from '../../../../util';

const loadCommentStart =
  createAction('comment-detail/LOAD_COMMENT_START');
const loadCommentComplete =
  createAction<object>('comment-detail/LOAD_COMMENT_COMPLETE');
const loadCommentScoresStart =
  createAction('comment-detail/LOAD_COMMENT_SCORE_START');
const loadCommentScoresComplete =
  createAction<Array<ICommentScoreModel>>('comment-detail/LOAD_COMMENT_SCORE_COMPLETE');
const addCommentScoreRecord =
  createAction<ICommentScoreModel>('comment-detail/ADD_COMMENT_SCORE');
const updateCommentScoreRecord =
  createAction<ICommentScoreModel>('comment-detail/UPDATE_COMMENT_SCORE');
const removeCommentScoreRecord =
  createAction<ICommentScoreModel>('comment-detail/REMOVE_COMMENT_SCORE');
const loadCommentFlagsStart =
  createAction('comment-detail/LOAD_COMMENT_FLAG_START');
const loadCommentFlagsComplete =
  createAction<Array<ICommentFlagModel>>('comment-detail/LOAD_COMMENT_FLAG_COMPLETE');
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
  const data = await getCommentScores(id);
  await dispatch(loadCommentScoresComplete(data));
}

export async function loadFlags(dispatch: IAppDispatch, id: string) {
  await dispatch(loadCommentFlagsStart());
  const data = await getCommentFlags(id);
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

export interface ICommentScoreState {
  items: Array<ICommentScoreModel>;
}

const initialScoreState: ICommentScoreState = {
  items: [],
};

const commentScoresReducer = handleActions<
  ICommentScoreState,
  void   | // startEvent
  Array<ICommentScoreModel> | // endEvent
  ICommentScoreModel  // addRecord, updateRecord, removeRecord
  >( {
  [loadCommentScoresStart.toString()]: (_state) => (initialScoreState),

  [loadCommentScoresComplete.toString()]: (_state, { payload }: Action<Array<ICommentScoreModel>>) => ({
    items: payload,
  }),

  [addCommentScoreRecord.toString()]: (state, { payload }: Action<ICommentScoreModel>) => ({
    items: [...state.items, payload],
  }),

  [updateCommentScoreRecord.toString()]: (state, { payload }: Action<ICommentScoreModel>) => {
    return {
      items: state.items.map((i) => (payload.id === i.id ? payload : i)),
    };
  },

  [removeCommentScoreRecord.toString()]: (state, { payload }: Action<ICommentScoreModel>) => {
    return {
      items: state.items.filter((i) => (i.id !== payload.id)),
    };
  },
}, initialScoreState);

export interface ICommentFlagsState {
  items: Array<ICommentFlagModel>;
}

const initialFlagsState: ICommentFlagsState = {
  items: [],
};

const commentFlagsReducer = handleActions<ICommentFlagsState, void | Array<ICommentFlagModel>>({
    [loadCommentFlagsStart.toString()]: (_state: ICommentFlagsState) => (initialFlagsState),
    [loadCommentFlagsComplete.toString()]: (state: ICommentFlagsState, { payload }: Action<Array<ICommentFlagModel>>) => ({
     ...state,
     items: payload,
   }),
}, initialFlagsState);

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
  scores: ICommentScoreState;
  flags: ICommentFlagsState;
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

export function getTaggingSensitivityForTag(taggingSensitivities: List<ITaggingSensitivityModel>, tagId: ModelId) {
  return taggingSensitivities.find((ts) => ts.tagId === tagId || ts.categoryId === null);
}

export function getAuthorCountsById(state: IAppState, id: string) {
  const authorCountsRecord = getAuthorCountsRecord(state);
  return authorCountsRecord.authorCounts.get(id);
}
