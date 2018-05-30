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
import { Action, createAction } from 'redux-actions';
import { TypedRecord } from 'typed-immutable-record';
import { IPreselectModel } from '../../models';
import { listModels, makeAJAXAction, makeRecordListReducer, IRecordListStateRecord } from '../util';
import { IAppStateRecord, IThunkAction } from './index';

const STATE_ROOT = ['global', 'preselects'];
const PRESELECTS_DATA = [...STATE_ROOT, 'items'];
const PRESELECTS_LOADING_STATUS = [...STATE_ROOT, 'isFetching'];
const PRESELECTS_HAS_DATA = [...STATE_ROOT, 'hasData'];

const loadPreselectsStart = createAction(
  'all-preselects/LOAD_PRESELECTS_START',
);
const loadPreselectsComplete = createAction<object>(
  'all-preselects/LOAD_PRESELECTS_COMPLETE',
);

export function getPreselects(state: IAppStateRecord): List<IPreselectModel> {
  return state.getIn(PRESELECTS_DATA);
}

export function getPreselectsIsLoading(state: IAppStateRecord): boolean {
  return state.getIn(PRESELECTS_LOADING_STATUS);
}

export function loadPreselects(forceUpdate?: boolean): IThunkAction<void> {
  return makeAJAXAction(
    () => listModels('preselects', {
      page: { limit: -1 },
    }),
    loadPreselectsStart,
    loadPreselectsComplete,
    (state: IAppStateRecord) => forceUpdate ? null : state.getIn(PRESELECTS_HAS_DATA) && getPreselects(state),
  );
}

export interface IPreselectState {
  preselects: List<IPreselectModel>;
}

export interface IPreselectStateRecord extends TypedRecord<IPreselectStateRecord>, IPreselectState {}

const recordListReducer = makeRecordListReducer<IPreselectModel>(
  loadPreselectsStart.toString(),
  loadPreselectsComplete.toString(),
);

const reducer: (state: IRecordListStateRecord<IPreselectModel>, action: Action<object|IPreselectModel>) => IRecordListStateRecord<IPreselectModel>
  = recordListReducer.reducer;

export { reducer };
