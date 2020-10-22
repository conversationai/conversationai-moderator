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

import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react';
import faker from 'faker';

import { fakeUserModel } from '../../../models/fake';
import { Avatar } from '../Avatar';
import { CheckboxRow, GOOD_IMAGE_SIZE } from './CheckboxRow';

const user = fakeUserModel({
  name: 'Person One',
  avatarURL: faker.internet.avatar(),
});

storiesOf('CheckboxRow', module)
    .add('DontTest:Default', () => (
      <CheckboxRow
        label={user.name}
        value={user.id}
        image={<Avatar size={GOOD_IMAGE_SIZE} target={user}/>}
        onChange={action('Change Lucas Dixon')}
      />
    ))
    .add('DontTest:Selected', () => (
      <CheckboxRow
        label={user.name}
        value={user.id}
        image={<Avatar size={GOOD_IMAGE_SIZE} target={user}/>}
        isSelected
        onChange={action('Change Lucas Dixon')}
      />
    ));
