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

import { combineReducers } from 'redux';

import { ICheckedSelectionState, ICurrentPagingIdentifierState } from '../../../../../util';
import { checkedSelectionReducer } from './checkedSelection';
import { currentPagingIdentifierReducer } from './currentPagingIdentifier';
import { IModeratedCommentsState, moderatedCommentsReducer } from './moderatedComments';

export type IModeratedCommentsGlobalState = Readonly<{
  currentPagingIdentifier: ICurrentPagingIdentifierState,
  checkedSelection: ICheckedSelectionState,
  moderatedComments: IModeratedCommentsState,
}>;

export const reducer = combineReducers<IModeratedCommentsGlobalState>({
  currentPagingIdentifier: currentPagingIdentifierReducer,
  checkedSelection: checkedSelectionReducer,
  moderatedComments: moderatedCommentsReducer,
});

export * from './checkedSelection';
export * from './commentListLoader';
export * from './currentPagingIdentifier';
export * from './moderatedComments';
