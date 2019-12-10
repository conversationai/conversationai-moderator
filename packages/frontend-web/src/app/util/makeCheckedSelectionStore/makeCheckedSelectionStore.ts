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

import { Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';

import { IAppStateRecord } from '../../appstate';

let checkedSelectionStores = 0;

export interface ICheckedSelectionStoreOptions {
  defaultSelectionState: boolean;
}

export type IOverrides = Map<string, boolean>;

export type ICheckedSelectionState = Readonly<{
  defaultSelectionState: boolean;
  areAllSelected: boolean;
  overrides: IOverrides;
}>;

export type ICheckedSelectionPayloads =
    void           | // toggleSelectAll
    { id: string };  // toggleSingleItem

// Return is infered
export function makeCheckedSelectionStore(
  getStateRecord: (state: IAppStateRecord) => ICheckedSelectionState,
  {
    defaultSelectionState,
  }: ICheckedSelectionStoreOptions,
) {
  checkedSelectionStores += 1;

  const toggleSelectAll: () => Action<void> = createAction(
    `checked-selection-${checkedSelectionStores}/TOGGLE_SELECT_ALL`,
  );

  const toggleSingleItem: (payload: { id: string }) => Action<{ id: string }> = createAction<{ id: string }>(
    `checked-selection-${checkedSelectionStores}/TOGGLE_SINGLE_ITEM`,
  );

  const initialState = {
    defaultSelectionState,
    areAllSelected: defaultSelectionState,
    overrides: Map<string, boolean>(),
  };

  const reducer = handleActions<
    ICheckedSelectionState,
    ICheckedSelectionPayloads
  >({
    [toggleSelectAll.toString()]: (state: ICheckedSelectionState) => {
      const defaultValue = state.defaultSelectionState;
      const areAllSelected = state.areAllSelected;

      if (defaultValue === areAllSelected) {
        return {
         defaultSelectionState: !defaultValue,
         areAllSelected: !defaultValue,
         overrides: initialState.overrides,
        };
      } else {
        return { ...state, areAllSelected: defaultValue, overrides: initialState.overrides};
      }
    },

    [toggleSingleItem.toString()]: (state: ICheckedSelectionState, { payload }: Action<ICheckedSelectionPayloads>) => {
      const { id } = payload as { id: string };
      const defaultValue = state.defaultSelectionState;
      const currentValue = state.overrides.get(id);

      // Not in list, therefore an override.
      const newState = {...state};
      newState.overrides = ('undefined' === typeof currentValue) ?
        state.overrides.set(id, !defaultValue) :
        state.overrides.delete(id);
      newState.areAllSelected = (newState.overrides.size <= 0) ? defaultValue : false;
      return newState;
    },
  }, initialState);

  function getDefaultSelectionState(state: IAppStateRecord) {
    const stateRecord = getStateRecord(state);
    return stateRecord && stateRecord.defaultSelectionState;
  }

  function getAreAllSelected(state: IAppStateRecord) {
    const stateRecord = getStateRecord(state);
    return stateRecord && stateRecord.areAllSelected;
  }

  function getOverrides(state: IAppStateRecord) {
    const stateRecord = getStateRecord(state);
    return stateRecord && stateRecord.overrides;
  }

  function getItemCheckedState(overrides: IOverrides, id: string, isCheckedByDefault: boolean): boolean {
    const override = overrides && overrides.get(id.toString());

    if ('undefined' !== typeof override) {
      return override;
    }

    return isCheckedByDefault;
  }

  function getIsItemChecked(state: IAppStateRecord, id: string): boolean {
    const overrides = getOverrides(state);

    return getItemCheckedState(overrides, id, getDefaultSelectionState(state));
  }

  function getAreAnyCommentsSelected(state: IAppStateRecord): boolean {
    return (
      !getDefaultSelectionState(state) &&
      getOverrides(state) &&
      (getOverrides(state).size === 0)
    );
  }

  return {
    initialState,
    reducer,
    getDefaultSelectionState,
    getAreAllSelected,
    getAreAnyCommentsSelected,
    getOverrides,
    getIsItemChecked,
    getItemCheckedState,
    toggleSelectAll,
    toggleSingleItem,
  };
}
