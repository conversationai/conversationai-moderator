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

import { List, Map } from 'immutable';
import { createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { IAppStateRecord, IThunkAction } from '../stores';

import {
  listTextSizesByIds,
} from '../util';

const DATA_PREFIX = ['global', 'textSizes'];
const TEXT_SIZES_HAS_DATA = [...DATA_PREFIX, 'hasData'];
const TEXT_SIZES_DATA = [...DATA_PREFIX, 'textSizes'];
const TEXT_SIZES_IS_LOADING = [...DATA_PREFIX, 'isLoading'];

const loadTextSizesStart = createAction(
  'text-sizes/LOAD_TEXT_SIZES_START',
);

type ILoadTestSizesCompletePayload = {
  textSizes: Map<number, number>;
};
const loadTextSizesComplete = createAction<ILoadTestSizesCompletePayload>(
  'text-sizes/LOAD_TEXT_SIZES_COMPLETE',
);

interface ITextSizesState {
  isLoading: boolean;
  hasData: boolean;
  textSizes: Map<number, number>;
}

interface ITextSizesStateRecord extends TypedRecord<ITextSizesStateRecord>, ITextSizesState {}

const TextSizesStateFactory = makeTypedFactory<ITextSizesState, ITextSizesStateRecord>({
  isLoading: true,
  hasData: false,
  textSizes: Map<number, number>(),
});

const textSizesReducer = handleActions<
  ITextSizesStateRecord,
  void                          | // loadTextSizesStart
  ILoadTestSizesCompletePayload   // loadTextSizesComplete
>({
  [loadTextSizesStart.toString()]: (state) => (
    state
        .set('isLoading', true)
  ),

  [loadTextSizesComplete.toString()]: (state, { payload: { textSizes } }: { payload: ILoadTestSizesCompletePayload }) => (
    state
        .set('isLoading', false)
        .set('hasData', true)
        .mergeIn(['textSizes'], textSizes)
  ),

}, TextSizesStateFactory());

function getTextSizesHasData(state: IAppStateRecord): boolean {
  return state.getIn(TEXT_SIZES_HAS_DATA);
}

function getTextSizes(state: IAppStateRecord): Map<string, number> {
  return state.getIn(TEXT_SIZES_DATA);
}

function getTextSizesIsLoading(state: IAppStateRecord): boolean {
  return state.getIn(TEXT_SIZES_IS_LOADING);
}

function loadTextSizesByIds(ids: List<string>, width: number): IThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    if (ids.size <= 0) {
      return;
    }

    await dispatch(loadTextSizesStart());

    const state = getState();
    const hasData = getTextSizesHasData(state);
    const loadedSizes = getTextSizes(state);
    const unloadedIDs = !hasData ? ids : ids.filter((id) => !loadedSizes.has(id));

    const textSizes = await listTextSizesByIds(unloadedIDs.toArray(), width);

    await dispatch(loadTextSizesComplete({ textSizes }));
  };
}

export {
  ITextSizesState,
  ITextSizesStateRecord,
  textSizesReducer,
  getTextSizesHasData,
  getTextSizes,
  getTextSizesIsLoading,
  loadTextSizesByIds,
  textSizesReducer as reducer,
};
