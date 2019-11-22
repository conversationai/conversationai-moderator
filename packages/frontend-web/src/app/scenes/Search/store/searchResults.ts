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
import { IAppState } from '../../../appstate';

export const loadAllCommentIdsStart: () => Action<void> = createAction(
  'search/LOAD_ALL_COMMENT_IDS',
);

export type ILoadAllCommentIdsCompletePayload = List<string>;
export const loadAllCommentIdsComplete: (payload: ILoadAllCommentIdsCompletePayload) => Action<ILoadAllCommentIdsCompletePayload> =
  createAction<ILoadAllCommentIdsCompletePayload>(
    'search/LOAD_ALL_COMMENT_IDS_COMPLETE',
  );

export const resetCommentIds: () => Action<void> = createAction(
  'search/RESET_ALL_COMMENT_IDS',
);

export type IAllCommentIDsState = Readonly<{
  isLoading: boolean;
  ids: List<string>;
}>;

const initialState = {
  isLoading: false,
  ids: List<string>(),
};

export const allCommentIdsReducer = handleActions<
  IAllCommentIDsState,
  void | // resetCommentIds
  ILoadAllCommentIdsCompletePayload // loadAllCommentIdsComplete
>({
    [resetCommentIds.toString()]: () => initialState,

    [loadAllCommentIdsStart().toString()]: () => ({...initialState, isLoading: true}),

    [loadAllCommentIdsComplete.toString()]: (_state, { payload }: Action<ILoadAllCommentIdsCompletePayload>) => (
      {isLoading: false, ids: payload}
    ),
  },

  initialState,
);

function getStateRecord(state: IAppState) {
  return state.scenes.search.allCommentIds;
}

export function getAllCommentIds(state: IAppState) {
  return getStateRecord(state).ids;
}

export function getIsLoading(state: IAppState) {
  return getStateRecord(state).isLoading;
}
