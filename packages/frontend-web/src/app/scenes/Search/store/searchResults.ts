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
import { IAppStateRecord } from '../../../stores';
import { DATA_PREFIX } from './reduxPrefix';
const ALL_COMMENT_IDS_DATA = [...DATA_PREFIX, 'allCommentIds'];

export type ILoadAllCommentIdsCompletePayload = List<number>;
export const loadAllCommentIdsComplete: (payload: ILoadAllCommentIdsCompletePayload) => Action<ILoadAllCommentIdsCompletePayload> =
  createAction<ILoadAllCommentIdsCompletePayload>(
    'search/LOAD_ALL_COMMENT_IDS_COMPLETE',
  );

export const resetCommentIds: () => Action<void> = createAction(
  'search/RESET_ALL_COMMENT_IDS',
);

export interface IAllCommentIDsState {
  ids: List<string>;
}

export interface IAllCommentIDsStateRecord extends TypedRecord<IAllCommentIDsStateRecord>, IAllCommentIDsState {}

const StateFactory = makeTypedFactory<IAllCommentIDsState, IAllCommentIDsStateRecord>({
  ids: List<string>(),
});

export const allCommentIdsReducer = handleActions<
  IAllCommentIDsStateRecord,
  void | // resetCommentIds
  ILoadAllCommentIdsCompletePayload // loadAllCommentIdsComplete
>({
    [resetCommentIds.toString()]: () => StateFactory(),

    [loadAllCommentIdsComplete.toString()]: (state, { payload }: { payload: ILoadAllCommentIdsCompletePayload }) => (
      state.set('ids', payload)
    ),
  },

  StateFactory(),
);

export function getAllCommentIds(state: IAppStateRecord): List<number> {
  return state.getIn([...ALL_COMMENT_IDS_DATA, 'ids']);
}
