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

import { createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { IAppStateRecord, IThunkAction } from '../stores';

let loadingReducer = 0;

export interface ILoadingState {
  isLoading: boolean;
  hasLoaded: boolean;
}

export interface ILoadingStateRecord extends TypedRecord<ILoadingStateRecord>, ILoadingState {}

const LoadingStateFactory = makeTypedFactory<ILoadingState, ILoadingStateRecord>({
  isLoading: false,
  hasLoaded: false,
});

export type ILoadingExecutor = (dispatch?: any, getState?: any) => Promise<any>;

// Return infered
export function makeLoadingReducer(prefix: Array<string>) {
  loadingReducer += 1;

  const isLoadingPrefix = [...prefix, 'isLoading'];
  const hasLoadedPrefix = [...prefix, 'hasLoaded'];

  const startEvent = createAction(`loading-store-${loadingReducer}/START`);
  const endEvent = createAction(`loading-store-${loadingReducer}/END`);

  const execute = (callback: () => IThunkAction<void>) => async (dispatch: any) => {
    dispatch(startEvent());

    await dispatch(callback());

    dispatch(endEvent());
  };

  const reducer = handleActions<
    ILoadingStateRecord,
    void
  >({
    [startEvent.toString()]: (state: ILoadingStateRecord) => (
      state
          .set('isLoading', true)
          .set('hasLoaded', false)
    ),

    [endEvent.toString()]: (state: ILoadingStateRecord) => (
      state
          .set('isLoading', false)
          .set('hasLoaded', true)
    ),
  }, LoadingStateFactory());

  function getIsLoading(state: IAppStateRecord): boolean {
    return state.getIn(isLoadingPrefix);
  }

  function getHasLoaded(state: IAppStateRecord): boolean {
    return state.getIn(hasLoadedPrefix);
  }

  return {
    reducer,
    execute,
    getIsLoading,
    getHasLoaded,
  };
}
