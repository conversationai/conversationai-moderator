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

import { storiesOf } from '@storybook/react';
import faker from 'faker';
import {Map as IMap, Set} from 'immutable';
import React from 'react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';

import { ModelId } from '../../../models';
import { fakeUserModel } from '../../../models/fake';
import { AssignModerators } from './AssignModerators';

const users = [
  fakeUserModel({
    name: 'Person One',
    avatarURL: faker.internet.avatar(),
  }),
  fakeUserModel({
    name: 'Person Two',
    avatarURL: faker.internet.avatar(),
  }),
  fakeUserModel({
    name: 'Person Three',
    avatarURL: faker.internet.avatar(),
  }),
];

const moderatorIds = Set<ModelId>([users[0].id]);

export const store = createStore(
  (s, _a) => s,
  {global: {users: {humans: IMap(users.map((u) => [u.id, u]))}}},
);

storiesOf('AssignModerators', module)
    .add('DontTest:Default', () => (
      <Provider store={store}>
        <AssignModerators
          moderatorIds={moderatorIds}
          label="Add a moderator"
        />
      </Provider>
    ));
