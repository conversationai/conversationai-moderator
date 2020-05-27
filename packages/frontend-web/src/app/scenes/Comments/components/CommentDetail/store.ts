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

import { fromJS, Map } from 'immutable';
import { combineReducers } from 'redux';
import { Action, createAction, handleActions } from 'redux-actions';

import {ICommentScoreModel, ModelId} from '../../../../../models';
import {IAppDispatch, IAppState} from '../../../../appstate';
import {getCommentScores} from '../../../../platform/dataService';
import {
  addCommentScore,
  removeAllCommentScores,
  removeCommentScore,
  updateCommentScore,
} from '../../../../stores/globalActions';

const loadCommentScoresStart =
  createAction('comment-detail/LOAD_COMMENT_SCORE_START');
const loadCommentScoresComplete =
  createAction<Array<ICommentScoreModel>>('comment-detail/LOAD_COMMENT_SCORE_COMPLETE');
export const clearCommentPagingOptions: () => Action<void> =
  createAction('comment-detail/CLEAR_COMMENT_PAGING_OPTIONS');
const internalStoreCommentPagingOptions =
  createAction<ICommentPagingState>('comment-detail/STORE_COMMENT_PAGING_OPTIONS');

export async function loadScores(dispatch: IAppDispatch, id: string) {
  await dispatch(loadCommentScoresStart());
  const data = await getCommentScores(id);
  await dispatch(loadCommentScoresComplete(data));
}

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
  ICommentScoreModel | ModelId // addRecord, updateRecord, removeRecord
  >( {
  [loadCommentScoresStart.toString()]: (_state) => (initialScoreState),

  [loadCommentScoresComplete.toString()]: (_state, { payload }: Action<Array<ICommentScoreModel>>) => ({
    items: payload,
  }),

  [addCommentScore.toString()]: (state, { payload }: Action<ICommentScoreModel>) => ({
    items: [...state.items, payload],
  }),

  [updateCommentScore.toString()]: (state, { payload }: Action<{id: ModelId} & Partial<ICommentScoreModel>>) => {
    return {
      items: state.items.map((i) => (payload.id === i.id ? {...i, ...payload} : i)),
    };
  },

  [removeCommentScore.toString()]: (state, { payload }: Action<ModelId>) => {
    return {
      items: state.items.filter((i) => (i.id !== payload)),
    };
  },

  [removeAllCommentScores.toString()]: () => {
    return {
      items: [],
    };
  },
}, initialScoreState);

export interface ICommentPagingState {
  commentIds: Array<ModelId>;
  fromBatch: boolean;
  source: string;
  link: string;
  hash?: string;
  indexById?: Map<ModelId, number>;
}

export type ICommentPagingStateRecord = Readonly<ICommentPagingState>;

const initialState: ICommentPagingStateRecord = {
  commentIds: [],
  fromBatch: null,
  source: null,
  hash: null,
  indexById: Map<ModelId, number>(),
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
    const indexById = payload['commentIds'].reduce((sum, id, index) => sum.set(id, index), Map<ModelId, number>());
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

    if (nextIndex > (ids.length - 1)) { return null; }

    return ids[nextIndex];
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

    return ids[nextIndex];
  }
}

export type ICommentDetailState = Readonly<{
  scores: ICommentScoreState;
  paging: ICommentPagingState;
}>;

export const reducer = combineReducers<ICommentDetailState>({
  scores: commentScoresReducer,
  paging: commentPagingReducer,
});

/* Set or delete items in the comment detail store created by makeRecordListReducer */

export function getScores(state: IAppState) {
  return state.scenes.comments.commentDetail.scores.items;
}
