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

import faker from 'faker';

import {
  SERVER_ACTION_ACCEPT,
  SERVER_ACTION_DEFER,
  SERVER_ACTION_HIGHLIGHT,
  SERVER_ACTION_REJECT,
} from '../common';
import {
  IRuleAttributes,
  IRuleModel,
  RuleModel,
} from '../rule';

export function fakeRuleModel(overrides: Partial<IRuleAttributes> = {}): IRuleModel {
  return RuleModel({
    id: faker.random.number().toString(),
    action: faker.random.arrayElement([
      SERVER_ACTION_ACCEPT,
      SERVER_ACTION_REJECT,
      SERVER_ACTION_DEFER,
      SERVER_ACTION_HIGHLIGHT,
    ]),
    lowerThreshold: faker.random.number({ min: 0, max: 1, precision: 0.01 }),
    upperThreshold: faker.random.number({ min: 0, max: 1, precision: 0.01 }),
    ...overrides,
  } as IRuleAttributes);
}
