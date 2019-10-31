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

import { fromJS, List } from 'immutable';
import { Action, createAction, handleActions} from 'redux-actions';
import { convertItemFromJSONAPI } from '../makeSingleRecordReducer';

let recordListStores = 0;

export function convertArrayFromJSONAPI<T>(result: any): List<T> {
  const resultData = fromJS(result);
  return List(resultData.get('data').map((d: any) => (
    convertItemFromJSONAPI(d, resultData.get('included'))
  )));
}

export type IRecordListState<T>  = Readonly<{
  hasData: boolean;
  isFetching: boolean;
  items: List<T>;
}>;

// Return types infered.
export function makeRecordListReducer<T extends { id: string }>(
  startEvent: string,
  endEvent: string,
) {
  recordListStores += 1;

  const initialState = {
    hasData: false,
    isFetching: false,
    items: List<T>(),
  };

  // These local state actions are scoped to each recordListStores that is created

  const addRecord: (payload: T) => Action<T>  = createAction<T>(
    `list-record-store-${recordListStores}/ADD`,
  );

  const updateRecord: (payload: T) => Action<T> = createAction<T>(
    `list-record-store-${recordListStores}/UPDATE`,
  );

  const removeRecord: (payload: T) => Action<T> = createAction<T>(
    `list-record-store-${recordListStores}/REMOVE`,
  );

  const reducer = handleActions<
    IRecordListState<T>,
    void   | // startEvent
    object | // endEvent
    T        // addRecord, updateRecord, removeRecord
  >( {
    [startEvent]: (state: IRecordListState<T>) => ({ ...state, isFetching: true }),

    [endEvent]: (_state: IRecordListState<T>, { payload }: Action<object>) => ({
      hasData: true,
      isFetching: false,
      items: convertArrayFromJSONAPI<T>(payload),
    }),

    [addRecord.toString()]: (state: IRecordListState<T>, { payload }: Action<T>) => ({
      ...state,
      items: state.items.push(payload),
    }),

    [updateRecord.toString()]: (state: IRecordListState<T>, { payload }: Action<T>) => {
      const index = state.items.findIndex((item: T) => (item.id === payload.id));
      return {
        ...state,
        items: state.items.set(index, payload),
      };
    },

    [removeRecord.toString()]: (state: IRecordListState<T>, { payload }: Action<T>) => {
      const index = state.items.findIndex((item: T) => (item.id === payload.id));
      if (index < 0) {
        return state;
      }
      return {
        ...state,
        items: List(state.items.splice(index, 1)),
      };
    },
  }, initialState);

  return {
    reducer,
    initialState,
    addRecord,
    updateRecord,
    removeRecord,
  };
}
