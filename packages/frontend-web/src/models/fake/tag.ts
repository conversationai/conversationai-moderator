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
import { ITagAttributes, ITagModel, TagModel } from '../tag';

export function fakeTagModel(overrides: Partial<ITagAttributes> = {}): ITagModel {
  const label = faker.lorem.words(2);
  const key = label.replace(/\s/, '_').toUpperCase();

  return TagModel({
    id: faker.random.number().toString(),
    color: faker.commerce.color(),
    description: faker.lorem.paragraphs(1),
    key,
    label,
    ...overrides,
  } as ITagAttributes);
}
