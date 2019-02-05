/*
Copyright 2019 Google Inc.

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

import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'counts'];
const ASSIGNMENTS = [...STATE_ROOT, 'assignments'];
const DEFERRED = [...STATE_ROOT, 'deferred'];

export const assignmentCountUpdated = createAction<number>('global/ASSIGNMENT_COUNT_UPDATED');
export const deferredCountUpdated = createAction<number>('global/DEFERRED_COUNT_UPDATED');

export function getAssignments(state: IAppStateRecord): any {
  return state.getIn(ASSIGNMENTS);
}

export function getDeferred(state: IAppStateRecord): any {
  return state.getIn(DEFERRED);
}

export interface ICountsState {
  assignments: number;
  deferred: number;
}

export interface ICountsStateRecord extends TypedRecord<ICountsStateRecord>, ICountsState {}

const StateFactory = makeTypedFactory<ICountsState, ICountsStateRecord>({
  assignments: 0,
  deferred: 0,
});

export const reducer = handleActions<
  ICountsStateRecord,
  number
  >({
  [assignmentCountUpdated.toString()]: (state, { payload }: Action<number>) => {
    return state.setIn(
      ['assignments'],
      payload,
    );
  },

  [deferredCountUpdated.toString()]: (state, { payload }: Action<number>) => {
    return state.setIn(
      ['deferred'],
      payload,
    );
  },
}, StateFactory());
