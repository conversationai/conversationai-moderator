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

import { IAppState } from '../appstate';

export const assignmentCountUpdated = createAction<number>('global/ASSIGNMENT_COUNT_UPDATED');

export type ICountsState = Readonly<{
  assignments: number;
}>;

export function getAssignments(state: IAppState) {
  return state.global.counts.assignments;
}

export const reducer = handleActions<
  ICountsState,
  number
  >({
  [assignmentCountUpdated.toString()]: (_state, { payload }: Action<number>) => {
    return {assignments: payload};
  },
}, {
  assignments: 0,
});
