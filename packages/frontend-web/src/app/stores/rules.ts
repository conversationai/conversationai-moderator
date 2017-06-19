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
import { createAction } from 'redux-actions';
import { TypedRecord } from 'typed-immutable-record';
import { IRuleModel } from '../../models';
import { listModels, makeAJAXAction, makeRecordListReducer } from '../util';
import { IAppStateRecord, IThunkAction } from './index';

const STATE_ROOT = ['global', 'rules'];
const RULES_DATA = [...STATE_ROOT, 'items'];
const RULES_LOADING_STATUS = [...STATE_ROOT, 'isFetching'];
const RULES_HAS_DATA = [...STATE_ROOT, 'hasData'];

const loadRulesStart = createAction<void>(
  'all-rules/LOAD_RULES_START',
);
const loadRulesComplete = createAction<object>(
  'all-rules/LOAD_RULES_COMPLETE',
);

export function getRules(state: IAppStateRecord): List<IRuleModel> {
  return state.getIn(RULES_DATA);
}

export function getRulesIsLoading(state: IAppStateRecord): boolean {
  return state.getIn(RULES_LOADING_STATUS);
}

export function loadRules(forceUpdate?: boolean): IThunkAction<void> {
  return makeAJAXAction(
    () => listModels('moderation_rules', {
      page: { limit: -1 },
    }),
    loadRulesStart,
    loadRulesComplete,
    (state: IAppStateRecord) => forceUpdate ? null : state.getIn(RULES_HAS_DATA) && getRules(state),
  );
}

export interface IRuleState {
  rules: List<IRuleModel>;
}

export interface IRuleStateRecord extends TypedRecord<IRuleStateRecord>, IRuleState {}

const { reducer } = makeRecordListReducer<IRuleModel>(
  loadRulesStart.toString(),
  loadRulesComplete.toString(),
);

export { reducer };
