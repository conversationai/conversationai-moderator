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
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';

import { IAppStateRecord } from './appstate';

export const focusedElement = createAction<string | null>('root/FOCUSED_ELEMENT');
export const unfocusedElement: () => Action<void> = createAction('root/UNFOCUSED_ELEMENT');
export const saveFocus: () => Action<void> = createAction('root/SAVE_FOCUS');
export const restoreFocus: () => Action<void> = createAction('root/RESTORE_FOCUS');

const STATE_ROOT = ['global', 'focus'];
const CURRENTLY_FOCUSED = [...STATE_ROOT, 'currentlyFocused'];

export interface IFocusState {
  currentlyFocused: string | null;
  stack: List<string>;
}

export interface IFocusStateRecord extends TypedRecord<IFocusStateRecord>, IFocusState {}

const StateFactory = makeTypedFactory<IFocusState, IFocusStateRecord>({
  currentlyFocused: null,
  stack: List<string>(),
});

export const initialState = StateFactory();

export const reducer = handleActions<
  IFocusStateRecord,
  (string | null) | // focusedElement
  void              // unfocusedElement, saveFocus, restoreFocus
>({
  [focusedElement.toString()]: (state, { payload }: Action<string | null>) => (
    state.set('currentlyFocused', payload)
  ),

  [unfocusedElement.toString()]: (state) => (
    state.set('currentlyFocused', null)
  ),

  [saveFocus.toString()]: (state) => (
    state.update('stack', (s) => s.push(state.get('currentlyFocused')))
  ),

  [restoreFocus.toString()]: (state) => (
    state
        .set('currentlyFocused', state.get('stack').last())
        .update('stack', (s) => s.pop())
  ),
}, initialState);

export function getCurrentlyFocused(state: IAppStateRecord): string | null {
  return state.getIn(CURRENTLY_FOCUSED);
}
