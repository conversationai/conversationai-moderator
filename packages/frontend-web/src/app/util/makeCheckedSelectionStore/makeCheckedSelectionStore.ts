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
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';
import { IAppStateRecord } from '../../stores';

let checkedSelectionStores = 0;

export interface ICheckedSelectionStoreOptions {
  defaultSelectionState: boolean;
}

export type IOverrides = Map<string, boolean>;

export interface ICheckedSelectionState {
  defaultSelectionState: boolean;
  areAllSelected: boolean;
  overrides: IOverrides;
}

export interface ICheckedSelectionStateRecord extends TypedRecord<ICheckedSelectionStateRecord>, ICheckedSelectionState {}

export type ICheckedSelectionPayloads =
    void           | // toggleSelectAll
    { id: string };  // toggleSingleItem

// Return is infered
export function makeCheckedSelectionStore(
  statePath: Array<string>,
  {
    defaultSelectionState,
  }: ICheckedSelectionStoreOptions,
) {
  checkedSelectionStores += 1;

  const defaultSelectionStatePath = [...statePath, 'defaultSelectionState'];
  const areAllSelectedPath = [...statePath, 'areAllSelected'];
  const overridesPath = [...statePath, 'overrides'];

  const toggleSelectAll: () => Action<void> = createAction(
    `checked-selection-${checkedSelectionStores}/TOGGLE_SELECT_ALL`,
  );

  const toggleSingleItem: (payload: { id: string }) => Action<{ id: string }> = createAction<{ id: string }>(
    `checked-selection-${checkedSelectionStores}/TOGGLE_SINGLE_ITEM`,
  );

  const StateFactory = makeTypedFactory<ICheckedSelectionState, ICheckedSelectionStateRecord>({
    defaultSelectionState,
    areAllSelected: defaultSelectionState,
    overrides: Map<string, boolean>(),
  });

  const initialState = StateFactory();

  const reducer = handleActions<
    ICheckedSelectionStateRecord,
    ICheckedSelectionPayloads
  >({
    [toggleSelectAll.toString()]: (state: ICheckedSelectionStateRecord) => {
      const defaultValue = state.get('defaultSelectionState');
      const areAllSelected = state.get('areAllSelected');

      if (defaultValue === areAllSelected) {
        return state
            .set('defaultSelectionState', !defaultValue)
            .set('areAllSelected', !defaultValue)
            .set('overrides', initialState.get('overrides'));
      } else {
        return state
            .set('areAllSelected', defaultValue)
            .set('overrides', initialState.get('overrides'));
      }
    },

    [toggleSingleItem.toString()]: (state: ICheckedSelectionStateRecord, { payload }: Action<ICheckedSelectionPayloads>) => {
      const { id } = payload as { id: string };
      const defaultValue = state.get('defaultSelectionState');
      const path = ['overrides', id.toString()];
      const currentValue = state.getIn(path);

      // Not in list, therefore an override.
      const newState = ('undefined' === typeof currentValue)
          ? state.setIn(path, !defaultValue)
          : state.deleteIn(path);

      return (newState.get('overrides').size <= 0)
          ? newState.set('areAllSelected', defaultValue)
          : newState.set('areAllSelected', false);

    },
  }, initialState);

  function getDefaultSelectionState(state: IAppStateRecord): boolean {
    return state.getIn(defaultSelectionStatePath);
  }

  function getAreAllSelected(state: IAppStateRecord): boolean {
    return state.getIn(areAllSelectedPath);
  }

  function getOverrides(state: IAppStateRecord): IOverrides {
    return state.getIn(overridesPath);
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
