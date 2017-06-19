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

import { fromJS, List, Map } from 'immutable';
import { createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';

import {
  ArticleModel,
  CategoryModel,
  CommentModel,
  CommentScoreModel,
  CommentSummaryScoreModel,
  RuleModel,
  TagModel,
  UserModel,
} from '../../models';

export type IModelID = string | number;

let singleRecordStores = 0;

export function findModel(name: string): (Model: any) => any {
  if (name === 'articles') { return ArticleModel; }
  if (name === 'comments') { return CommentModel; }
  if (name === 'categories') { return CategoryModel; }
  if (name === 'users') { return UserModel; }
  if (name === 'tags') { return TagModel; }
  if (name === 'moderation_rules') { return RuleModel; }
  if (name === 'preselects') { return RuleModel; }
  if (name === 'tagging_sensitivities') { return RuleModel; }
  if (name === 'comment_scores') { return CommentScoreModel; }
  if (name === 'comment_summary_scores') { return CommentSummaryScoreModel; }

  throw new Error(`Could not find model: ${name}`);
}

function resourceToModel(modelData: Map<string, any>): any {
  const Model = findModel(modelData.get('type'));

  return Model(modelData.get('attributes').set('id', modelData.get('id')));
}

export function convertItemFromJSONAPI<T>(data: any, included?: List<any>): T {
  const modelData = fromJS(data);

  if (modelData instanceof List) {
    console.error('Expected data to be a single item, not an array.', modelData.toJS());
    throw (
      'makeSingleRecordReducer expects the result to be a single item. ' +
      'This result was an array, did you mean to use makeRecordListReducer?'
    );
  }

  let output = resourceToModel(modelData);

  if (modelData.get('relationships') && included) {
    output = modelData.get('relationships').reduce((sum: any, value: any, key: string) => {
      const d = value.get('data');

      if (d instanceof Map) {
        const found = included.find((m) => (
          m.get('type') === d.get('type') &&
          m.get('id') === d.get('id')
        ));

        if (found) {
          return sum.set(key, resourceToModel(found));
        }
      } else if (d instanceof List) {
        return sum.set(key, d.map((item: Map<string, any>) => {
          const found = included.find((m) => (
            m.get('type') === item.get('type') &&
            m.get('id') === item.get('id')
          ));

          return found && resourceToModel(found);
        }));

      }

      return sum;
    }, output);
  }

  return output;
}

export function convertFromJSONAPI<T>(result: any): T {
  const resultData = fromJS(result);
  const dataList = resultData.get('data');
  const dataItem = (dataList instanceof List) ? dataList.get(0) : dataList;

  return convertItemFromJSONAPI<T>(dataItem, resultData.get('included'));
}

export interface ISingleRecordState<T> {
  hasData: boolean;
  isFetching: boolean;
  shouldWait: boolean;
  item: T | null;
}

export interface ISingleRecordStateRecord<T> extends TypedRecord<ISingleRecordStateRecord<T>>, ISingleRecordState<T> {}

// Return type infered.
export function makeSingleRecordReducer<T>(
  startEvent: string,
  endEvent: string,
) {
  const StateFactory = makeTypedFactory<ISingleRecordState<T>, ISingleRecordStateRecord<T>>({
    hasData: false,
    isFetching: false,
    shouldWait: true,
    item: null,
  });

  const initialState = StateFactory();

  singleRecordStores += 1;

  const updateRecordAction = createAction<T>(
    `single-record-store-${singleRecordStores}/UPDATE`,
  );

  function onStart(state: ISingleRecordStateRecord<T>) {
    return state
        .set('hasData', false)
        .set('isFetching', true)
        .set('shouldWait', true);
  }

  function onEnd(state: ISingleRecordStateRecord<T>, { payload }: { payload: object }) {
    return state
        .set('hasData', true)
        .set('isFetching', false)
        .set('shouldWait', false)
        .set('item', convertFromJSONAPI<T>(fromJS(payload)));
  }

  function updateRecord(state: ISingleRecordStateRecord<T>, { payload }: { payload: T }) {
    return state
        .set('item', payload);
  }

  const reducer = handleActions<
    ISingleRecordStateRecord<T>,
    void   | // startEvent
    object | // endEvent
    T        // updateRecordAction
  >({
    [startEvent]: onStart,
    [endEvent]: onEnd,
    [updateRecordAction.toString()]: updateRecord,
  }, initialState);

  return {
    reducer,
    updateRecord: updateRecordAction,
  };
}
