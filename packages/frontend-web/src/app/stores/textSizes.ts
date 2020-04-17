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
import { Action, createAction, handleActions } from 'redux-actions';

import { IAppState, IThunkAction } from '../appstate';
import { listTextSizesByIds } from '../platform/dataService';

const loadTextSizesStart = createAction(
  'text-sizes/LOAD_TEXT_SIZES_START',
);

type ILoadTestSizesCompletePayload = {
  textSizes: Map<string, number>;
};
const loadTextSizesComplete = createAction<ILoadTestSizesCompletePayload>(
  'text-sizes/LOAD_TEXT_SIZES_COMPLETE',
);

export type ITextSizesState = Readonly<{
  isLoading: boolean;
  hasData: boolean;
  textSizes: Map<string, number>;
}>;

const textSizesReducer = handleActions<
  ITextSizesState,
  void                          | // loadTextSizesStart
  ILoadTestSizesCompletePayload   // loadTextSizesComplete
>({
  [loadTextSizesStart.toString()]: (state) => ({...state, isLoading: true}),

  [loadTextSizesComplete.toString()]: (state, { payload: { textSizes } }: Action<ILoadTestSizesCompletePayload>) => ({
    isLoading: false,
    hasData: true,
    textSizes: state.textSizes.merge(textSizes),
  }),
}, {
  isLoading: false,
  hasData: false,
  textSizes: Map<string, number>(),
});

function getStateRecord(state: IAppState) {
  return state.global.textSizes;
}

function getTextSizesHasData(state: IAppState) {
  const stateRecord = getStateRecord(state);
  return stateRecord && stateRecord.hasData;
}

function getTextSizes(state: IAppState) {
  const stateRecord = getStateRecord(state);
  return stateRecord && stateRecord.textSizes;
}

function getTextSizesIsLoading(state: IAppState) {
  const stateRecord = getStateRecord(state);
  return stateRecord && stateRecord.isLoading;
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
  textSizesReducer,
  getTextSizesHasData,
  getTextSizes,
  getTextSizesIsLoading,
  loadTextSizesByIds,
  textSizesReducer as reducer,
};
