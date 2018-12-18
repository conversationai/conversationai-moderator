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

import { fromJS, Record } from 'immutable';
import { TypedRecord } from 'typed-immutable-record';
import { ICommentAction } from '../types';

export const MODERATION_RULE_ACTION_ACCEPT = 'Accept';
export const MODERATION_RULE_ACTION_REJECT = 'Reject';
export const MODERATION_RULE_ACTION_DEFER = 'Defer';
export const MODERATION_RULE_ACTION_HIGHLIGHT = 'Highlight';

export interface IRuleAttributes {
  id: string;
  // This is wrong.  It should be one of the actions above.
  action: ICommentAction | null;
  categoryId: string | null;
  createdBy: string | null;
  lowerThreshold: number;
  upperThreshold: number;
  tagId: string | null;
}

export interface IRuleModel extends TypedRecord<IRuleModel>, IRuleAttributes {}

const RuleModelRecord = Record({
  id: null,
  action: null,
  categoryId: null,
  createdBy: null,
  lowerThreshold: null,
  upperThreshold: null,
  tagId: null,
});

export function RuleModel(keyValuePairs?: IRuleAttributes): IRuleModel {
  let immutableKeyValuePairs = fromJS(keyValuePairs);

  if (typeof immutableKeyValuePairs.get('action') === 'string') {
    immutableKeyValuePairs = immutableKeyValuePairs.update('action', (rule: string) => {
      // TODO fix up this crazyness.
      if (rule === 'Accept') {
        rule = 'Approve';
      }

      return rule;
    });
  }

  return new RuleModelRecord(immutableKeyValuePairs) as IRuleModel;
}
