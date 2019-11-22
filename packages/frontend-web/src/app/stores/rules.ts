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

import { IRuleModel } from '../../models';
import { IAppState } from '../appstate';

export const rulesUpdated = createAction(
  'all-rules/UPDATED',
);

export function getRules(state: IAppState): List<IRuleModel> {
  return state.global.rules.items;
}

export interface IRulesState {
  items: List<IRuleModel>;
}

const reducer = handleActions<Readonly<IRulesState>, List<IRuleModel>>( {
  [rulesUpdated.toString()]: (_state, { payload }: Action<List<IRuleModel>>) => ({items: payload}),
}, {
  items: List<IRuleModel>(),
});

export { reducer };
