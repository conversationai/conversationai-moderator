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
import React from 'react';

import { IAuthorModel } from '../../../models';
import { fakeUserModel } from '../../../models/fake';
import { Avatar } from './Avatar';

const authorWithAvatar = {
  email: 'name@email.com',
  location: 'NYC',
  name: 'Bridie Skiles V',
  avatar: faker.internet.avatar(),
} as IAuthorModel;

const authorWithoutAvatar = {
  email: 'name@email.com',
  location: 'NYC',
  name: 'Bridie Skiles V',
} as IAuthorModel;

const user = fakeUserModel({
  name: 'Test Person',
  avatarURL: faker.internet.avatar(),
});

storiesOf('Avatar', module)
  .addDecorator((story) => (
    <div style={{margin: '50px'}}>{story()}</div>
  ))
  .add('DontTest:commenter', () => {
    return (
      <Avatar size={54} target={authorWithAvatar} />
    );
  })
  .add('DontTest:moderator', () => {
    return (
      <Avatar size={54} target={user} />
    );
  })
  .add('no avatar', () => {
    return (
      <Avatar size={54} target={authorWithoutAvatar} />
    );
  })
  .add('DontTest:36x36', () => {
    return (
      <Avatar size={36} target={user} />
    );
  })
  .add('30x30 no avatar', () => {
    return (
      <Avatar size={30} target={authorWithoutAvatar}/>
    );
  });
