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
import { ICheckedSelectionPayloads, ICheckedSelectionState, makeCheckedSelectionStore } from '../../../../../util';
import { DATA_PREFIX } from './reduxPrefix';

const CHECKED_SELECTION_DATA = [...DATA_PREFIX, 'checkedSelection'];

const checkedSelectionStore = makeCheckedSelectionStore(
  (state: IAppStateRecord) => {
    return state.getIn(CHECKED_SELECTION_DATA) as ICheckedSelectionState;
  },
  { defaultSelectionState: true },
);

const checkedSelectionReducer: Reducer<ICheckedSelectionState, ICheckedSelectionPayloads> = checkedSelectionStore.reducer;

const getAreAllSelected: (state: IAppStateRecord) => boolean = checkedSelectionStore.getAreAllSelected;
const getAreAnyCommentsSelected: (state: IAppStateRecord) => boolean = checkedSelectionStore.getAreAnyCommentsSelected;
const getIsItemChecked: (state: IAppStateRecord, id: string) => boolean = checkedSelectionStore.getIsItemChecked;
const toggleSelectAll: () => Action<void> = checkedSelectionStore.toggleSelectAll;
const toggleSingleItem: (payload: { id: string }) => Action<{ id: string }> = checkedSelectionStore.toggleSingleItem;

export {
  checkedSelectionReducer,
  getAreAllSelected,
  getAreAnyCommentsSelected,
  getIsItemChecked,
  toggleSelectAll,
  toggleSingleItem,
};
