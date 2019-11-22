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

import { Action, createAction, handleAction } from 'redux-actions';

import { IAppState } from '../appstate';

let currentPagingIdentifierReducer = 0;

export type ICurrentPagingIdentifierState = Readonly<{
  currentPagingIdentifier: string;
}>;

const initialState: ICurrentPagingIdentifierState = {
  currentPagingIdentifier: null,
};

export type ICurrentPagingIdentifierPayload = { currentPagingIdentifier: string };
// Return infered
export function makeCurrentPagingIdentifierReducer(
  getStateRecord: (state: IAppState) => ICurrentPagingIdentifierState,
) {
  currentPagingIdentifierReducer += 1;

  const setCurrentPagingIdentifier: (payload: ICurrentPagingIdentifierPayload) => Action<ICurrentPagingIdentifierPayload> =
    createAction<ICurrentPagingIdentifierPayload>(
      `new-comments-list/SET_CURRENT_PAGING_IDENTIFIER_${currentPagingIdentifierReducer}`,
    );

  const reducer = handleAction<ICurrentPagingIdentifierState, ICurrentPagingIdentifierPayload>(
    setCurrentPagingIdentifier.toString(),
    (_state, { payload: { currentPagingIdentifier } }) => ({currentPagingIdentifier}),
    initialState,
  );

  function getCurrentPagingIdentifier(state: IAppState) {
    const localState = getStateRecord(state);
    return localState && localState.currentPagingIdentifier;
  }

  return  {
    reducer,
    setCurrentPagingIdentifier,
    getCurrentPagingIdentifier,
  };
}
