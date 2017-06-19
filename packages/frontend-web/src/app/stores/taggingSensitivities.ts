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
import { createAction } from 'redux-actions';
import { TypedRecord } from 'typed-immutable-record';
import { ITaggingSensitivityModel } from '../../models';
import { listModels, makeAJAXAction, makeRecordListReducer } from '../util';
import { IAppStateRecord, IThunkAction } from './index';

const STATE_ROOT = ['global', 'taggingSensitivities'];
const TAGGING_SENSITIVITIES_DATA = [...STATE_ROOT, 'items'];
const TAGGING_SENSITIVITIES_LOADING_STATUS = [...STATE_ROOT, 'isFetching'];
const TAGGING_SENSITIVITIES_HAS_DATA = [...STATE_ROOT, 'hasData'];

const loadTaggingSensitivitiesStart = createAction<void>(
  'all-taggingSensitivities/LOAD_TAGGING_SENSITIVITIES_START',
);
const loadTaggingSensitivitiesComplete = createAction<object>(
  'all-taggingSensitivities/LOAD_TAGGING_SENSITIVITIES_COMPLETE',
);

export function getTaggingSensitivities(state: IAppStateRecord): List<ITaggingSensitivityModel> {
  return state.getIn(TAGGING_SENSITIVITIES_DATA);
}

export function getTaggingSensitivitiesIsLoading(state: IAppStateRecord): boolean {
  return state.getIn(TAGGING_SENSITIVITIES_LOADING_STATUS);
}

export function loadTaggingSensitivities(forceUpdate?: boolean): IThunkAction<void> {
  return makeAJAXAction(
    () => listModels('tagging_sensitivities', {
      page: { limit: -1 },
    }),
    loadTaggingSensitivitiesStart,
    loadTaggingSensitivitiesComplete,
    (state: IAppStateRecord) => forceUpdate ? null : state.getIn(TAGGING_SENSITIVITIES_HAS_DATA) && getTaggingSensitivities(state),
  );
}

export interface ITaggingSensitivityState {
  taggingSensitivities: List<ITaggingSensitivityModel>;
}

export interface ITaggingSensitivityStateRecord extends TypedRecord<ITaggingSensitivityStateRecord>, ITaggingSensitivityState {}

const { reducer } = makeRecordListReducer<ITaggingSensitivityModel>(
  loadTaggingSensitivitiesStart.toString(),
  loadTaggingSensitivitiesComplete.toString(),
);

export { reducer };
