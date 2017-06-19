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
import { IUserAttributes, IUserModel, UserModel } from '../user';

export function fakeUserModel(overrides: Partial<IUserAttributes> = {}): IUserModel {
  const name = (overrides && overrides['name']) || faker.name.findName();

  return UserModel({
    id: faker.random.number().toString(),
    name,
    email: faker.internet.email(),
    avatarURL: faker.internet.avatar(),
    group: 'general',
    isActive: true,
    ...overrides,
  });
}
