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

import { Action, Reducer } from 'redux-actions';

import { IAppStateRecord } from '../../../../../appstate';
import {
  ICurrentPagingIdentifierPayload,
  ICurrentPagingIdentifierState,
  makeCurrentPagingIdentifierReducer,
} from '../../../../../util';
import { DATA_PREFIX } from './reduxPrefix';

const currentPagingIdentifier = makeCurrentPagingIdentifierReducer(
  (state: IAppStateRecord) => {
    return state.getIn([...DATA_PREFIX, 'currentPagingIdentifier']) as ICurrentPagingIdentifierState;
  },
);

const currentPagingIdentifierReducer: Reducer<ICurrentPagingIdentifierState, ICurrentPagingIdentifierPayload> = currentPagingIdentifier.reducer;
const setCurrentPagingIdentifier: (payload: ICurrentPagingIdentifierPayload) => Action<ICurrentPagingIdentifierPayload> = currentPagingIdentifier.setCurrentPagingIdentifier;
const getCurrentPagingIdentifier: (state: IAppStateRecord) => string = currentPagingIdentifier.getCurrentPagingIdentifier;

export {
  currentPagingIdentifierReducer,
  setCurrentPagingIdentifier,
  getCurrentPagingIdentifier,
};
