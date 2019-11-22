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
import { IAppState } from '../../../appstate';
import { ICheckedSelectionPayloads, ICheckedSelectionState, IOverrides, makeCheckedSelectionStore } from '../../../util';

const checkedSelectionStore = makeCheckedSelectionStore(
  (state: IAppState) => {
    return state.scenes.search.checkedSelection;
  },
  { defaultSelectionState: false },
);

const checkedSelectionReducer: Reducer<ICheckedSelectionState, ICheckedSelectionPayloads> = checkedSelectionStore.reducer;

const getAreAllSelected: (state: IAppState) => boolean = checkedSelectionStore.getAreAllSelected;
const getAreAnyCommentsSelected: (state: IAppState) => boolean = checkedSelectionStore.getAreAnyCommentsSelected;
const getOverrides: (state: IAppState) => IOverrides = checkedSelectionStore.getOverrides;
const getIsItemChecked: (state: IAppState, id: string) => boolean = checkedSelectionStore.getIsItemChecked;
const toggleSelectAll: () => Action<void> = checkedSelectionStore.toggleSelectAll;
const toggleSingleItem: (payload: { id: string }) => Action<{ id: string }> = checkedSelectionStore.toggleSingleItem;

export function getSelectedCount(state: IAppState): number {
  return getOverrides(state).size;
}

export {
  checkedSelectionReducer,
  getAreAllSelected,
  getAreAnyCommentsSelected,
  getOverrides,
  getIsItemChecked,
  toggleSelectAll,
  toggleSingleItem,
};
