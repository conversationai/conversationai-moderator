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

import { fromJS, Map, Record } from 'immutable';
import { mapValues } from 'lodash';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { IAppStateRecord, IThunkAction } from './index';

export interface IColumnSortGroupAttributes {
  defaultValue: string;
  overrides: Map<string, string>;
  customized: Map<string, string>;
}
export interface IColumnSortGroup extends TypedRecord<IColumnSortGroup>, IColumnSortGroupAttributes {}

function ColumnSortGroup(keyValuePairs?: IColumnSortGroupAttributes): IColumnSortGroup {
  return Record(keyValuePairs)(keyValuePairs) as any;
}

export type IChangeColumnSortPayload = {
  group: string;
  section: string;
  key: string;
};
export const changeColumnSort: (payload: IChangeColumnSortPayload) => Action<IChangeColumnSortPayload> =
  createAction<IChangeColumnSortPayload>('column-sorts/CHANGE_COLUMN_SORT');

export type IChangeColumnSortGroupDefaultPayload = {
  group: string;
  key: string;
};
export const changeColumnSortGroupDefault: (payload: IChangeColumnSortGroupDefaultPayload) => Action<IChangeColumnSortGroupDefaultPayload> =
  createAction<IChangeColumnSortGroupDefaultPayload>( 'column-sorts/CHANGE_COLUMN_SORT_GROUP_DEFAULT',);

const LOCAL_STORAGE_DATA_KEY = 'moderator/column-sorts-data';
const LOCAL_STORAGE_VERSION_KEY = 'moderator/column-sorts-version';

const SCHEMA_VERSION = 1;

const STATE_ROOT = ['global', 'columnSorts'];

export interface IColumnSortState {
  dashboard: IColumnSortGroup;
  dashboardVisible: IColumnSortGroup;
  commentsIndexModerated: IColumnSortGroup;
  commentsIndexNew: IColumnSortGroup;
}

export interface IColumnSortStateRecord extends TypedRecord<IColumnSortStateRecord>, IColumnSortState {}

const StateFactory = makeTypedFactory<IColumnSortState, IColumnSortStateRecord>({
  dashboard: ColumnSortGroup({
    defaultValue: 'newCount',

    overrides: Map<string, string>({
      deferred: 'deferred',
    }),

    customized: Map<string, string>(),
  }),

  dashboardVisible: ColumnSortGroup({
    defaultValue: 'newest',

    overrides: Map<string, string>({
      deferred: 'deferred',
    }),

    customized: Map<string, string>(),
  }),

  commentsIndexModerated: ColumnSortGroup({
    defaultValue: 'updated',

    overrides: Map<string, string>({
      batched: 'updated',
      automated: 'updated',
      highlighted: 'highlighted',
      recommended: 'recommended',
    }),

    customized: Map<string, string>(),
  }),

  commentsIndexNew: ColumnSortGroup({
    defaultValue: 'highest',

    overrides: Map<string, string>({
      date: 'newest',
      oldest: 'oldest',
      newest: 'newest',
    }),

    customized: Map<string, string>(),
  }),
});

export const initialState = StateFactory();

function writeToLocalStorage(state: IColumnSortStateRecord): void {
  const stringData = JSON.stringify(state.toJS());

  localStorage.setItem(LOCAL_STORAGE_DATA_KEY, stringData);
  localStorage.setItem(LOCAL_STORAGE_VERSION_KEY, SCHEMA_VERSION.toString());
}

function parseGroup(group: any): IColumnSortGroup {
  return ColumnSortGroup(fromJS(group).toObject());
}

function loadFromLocalStorage(): IColumnSortStateRecord {
  const stringData = localStorage.getItem(LOCAL_STORAGE_DATA_KEY);

  if (!stringData) { return initialState; }

  const versionString = localStorage.getItem(LOCAL_STORAGE_VERSION_KEY);

  if (!versionString) { return initialState; }

  const versionData = parseInt(versionString, 10);

  if (versionData !== SCHEMA_VERSION) {
    return initialState;
  }

  try {
    const parsedData = JSON.parse(stringData);

    return StateFactory(mapValues(parsedData, parseGroup));
  } catch (e) {
    return initialState;
  }
}

export function getColumnSort(state: IAppStateRecord): any {
  return state.getIn(STATE_ROOT);
}

export function getCurrentColumnSort(state: IAppStateRecord, section: string, key: string): string {
  const columnSort = getColumnSort(state);
  const group = columnSort.get(section);

  if (!group) {
    throw new Error(`Could not find columnSort section ${section}`);
  }

  const customizedValue = group.getIn(['customized', key]);

  if (customizedValue) {
    return customizedValue;
  }

  const overridesValue = group.getIn(['overrides', key]);

  if (overridesValue) {
    return overridesValue;
  }

  return group.get('defaultValue');
}

export const reducer = handleActions<
  IColumnSortStateRecord,
  IChangeColumnSortPayload             | // changeColumnSort
  IChangeColumnSortGroupDefaultPayload   // changeColumnSortGroupDefault
>({
  [changeColumnSort.toString()]: (state, { payload: { group, section, key } }: { payload: IChangeColumnSortPayload }) => {
    const updatedState = state
        .update(group, (g?: IColumnSortGroup | null) => g || ColumnSortGroup())
        .setIn([group, 'customized', section], key);

    writeToLocalStorage(updatedState);

    return updatedState;
  },

  [changeColumnSortGroupDefault.toString()]: (state, { payload: { group, key } }) => {
    const updatedState = state
        .update(group, (g?: IColumnSortGroup | null) => g || ColumnSortGroup())
        .setIn([group, 'defaultValue'], key);

    writeToLocalStorage(updatedState);

    return updatedState;
  },
}, loadFromLocalStorage());

export function fetchCurrentColumnSort(section: string, key: string): IThunkAction<string> {
  return (_, getState) => {
    return getCurrentColumnSort(getState(), section, key);
  };
}
