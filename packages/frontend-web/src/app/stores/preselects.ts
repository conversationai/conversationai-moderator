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
import { IPreselectModel } from '../../models';
import { IAppStateRecord } from './appstate';

const STATE_ROOT = ['global', 'preselects'];

export const preselectsUpdated = createAction(
  'all-preselects/UPDATED',
);

export function getPreselects(state: IAppStateRecord): List<IPreselectModel> {
  return state.getIn(STATE_ROOT).items;
}

export interface IPreselectsState {
  items: List<IPreselectModel>;
}

const reducer = handleActions<Readonly<IPreselectsState>, List<IPreselectModel>>( {
  [preselectsUpdated.toString()]: (_state, { payload }: Action<List<IPreselectModel>>) => ({items:  payload}),
}, {
  items: List<IPreselectModel>(),
});

export { reducer };
