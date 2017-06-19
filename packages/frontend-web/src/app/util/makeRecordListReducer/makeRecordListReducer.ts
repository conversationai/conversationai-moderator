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
import { createAction, handleActions} from 'redux-actions';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';
import { convertItemFromJSONAPI } from '../makeSingleRecordReducer';

let recordListStores = 0;

export function convertArrayFromJSONAPI<T>(result: any): List<T> {
  const resultData = fromJS(result);

  return resultData.get('data').map((d: any) => (
    convertItemFromJSONAPI(d, resultData.get('included'))
  ));
}

export interface IRecordListState<T> {
  hasData: boolean;
  isFetching: boolean;
  items: List<T>;
}

export interface IRecordListStateRecord<T> extends TypedRecord<IRecordListStateRecord<T>>, IRecordListState<T> {}

export type IEndEventPayload = object;

// Return types infered.
export function makeRecordListReducer<T extends { id: string }>(
  startEvent: string,
  endEvent: string,
) {
  recordListStores += 1;

  const StateFactory = makeTypedFactory<IRecordListState<T>, IRecordListStateRecord<T>>({
    hasData: false,
    isFetching: false,
    items: List<T>(),
  });

  const initialState = StateFactory();

  // These local state actions are scoped to each recordListStores that is created

  const addRecord = createAction<T>(
    `list-record-store-${recordListStores}/ADD`,
  );

  const updateRecord = createAction<T>(
    `list-record-store-${recordListStores}/UPDATE`,
  );

  const removeRecord = createAction<T>(
    `list-record-store-${recordListStores}/REMOVE`,
  );

  const reducer = handleActions<
    IRecordListStateRecord<T>,
    void   | // startEvent
    object | // endEvent
    T        // addRecord, updateRecord, removeRecord
  >( {
    [startEvent]: (state: IRecordListStateRecord<T>) => (
      state
          .set('isFetching', true)
    ),

    [endEvent]: (state: IRecordListStateRecord<T>, { payload }: { payload: IEndEventPayload }) => (
      state
          .set('hasData', true)
          .set('isFetching', false)
          .set('items', convertArrayFromJSONAPI<T>(fromJS(payload)))
    ),

    [addRecord.toString()]: (state: IRecordListStateRecord<T>, { payload }: { payload: T }) => (
      state
          .update('items', (items: List<T>) => items.push(payload))
    ),

    [updateRecord.toString()]: (state: IRecordListStateRecord<T>, { payload }: { payload: T }) => (
      state
          .update('items', (items: List<T>) => {
            const index = items.findIndex((item: any) => item.id === payload.id);

            return items.set(index, payload);
          })
    ),

    [removeRecord.toString()]: (state: IRecordListStateRecord<T>, { payload }: { payload: T }) => (
      state
          .update('items', (items: List<T>) => {
            const index = items.findIndex((item: any) => item.id === payload.id);

            if ( index !== -1 ) {
              return items.splice(index, 1);
            }

            return items;
          })
    ),
  }, initialState);

  return {
    reducer,
    initialState,
    addRecord,
    updateRecord,
    removeRecord,
  };
}
