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
import { ArticleModel, IArticleAttributes, IArticleModel } from '../article';
import { fakeCategoryModel } from './category';

export function fakeArticleModel(overrides: Partial<IArticleAttributes> = {}): IArticleModel {
  return ArticleModel({
    id: faker.random.number().toString(),
    sourceCreatedAt: faker.date.recent().toString(),
    title: faker.lorem.sentence(),
    text: faker.lorem.paragraph(),
    url: faker.internet.url(),
    category: fakeCategoryModel(),
    unprocessedCount: 0,
    unmoderatedCount: 0,
    moderatedCount: 0,
    highlightedCount: faker.random.number(),
    approvedCount: faker.random.number(),
    rejectedCount: faker.random.number(),
    deferedCount: faker.random.number(),
    flaggedCount: faker.random.number(),
    batchedCount: faker.random.number(),
    recommendedCount: faker.random.number(),
    ...overrides,
  } as IArticleAttributes);
}
