/*
Copyright 2019 Google Inc.

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
import { List } from 'immutable';
import React from 'react';

import { ICategoryModel } from '../../../models';
import { fakeCategoryModel, fakeUserModel } from '../../../models/fake';
import { HeaderBar } from '../../components';
import { CategorySidebar } from './CategorySidebar';

faker.seed(123);

const user = fakeUserModel();

const userNoIcon = fakeUserModel({
  name: 'Algernon Bullwinkle the Third',
  avatarURL: null,
});

const categories = List<ICategoryModel>([
  fakeCategoryModel({unmoderatedCount: 10}),
  fakeCategoryModel({unmoderatedCount: 2}),
  fakeCategoryModel({label: 'N.Y.C. Events Guide', unmoderatedCount: 15}),
  fakeCategoryModel({label: 'ChuChu TV Nursery Rhymes & Kids Songs', unmoderatedCount: 2}),
  fakeCategoryModel({unmoderatedCount: 1000}),
  fakeCategoryModel({unmoderatedCount: 100}),
  fakeCategoryModel({unmoderatedCount: 10}),
  fakeCategoryModel({unmoderatedCount: 12}),
  fakeCategoryModel({unmoderatedCount: 13}),
  fakeCategoryModel({unmoderatedCount: 14}),
  fakeCategoryModel({unmoderatedCount: 15}),
  fakeCategoryModel({unmoderatedCount: 16}),
  fakeCategoryModel({unmoderatedCount: 17}),
  fakeCategoryModel({unmoderatedCount: 18}),
  fakeCategoryModel({unmoderatedCount: 19}),
  fakeCategoryModel({unmoderatedCount: 12}),
  fakeCategoryModel({unmoderatedCount: 22}),
  fakeCategoryModel({unmoderatedCount: 11}),
  fakeCategoryModel({unmoderatedCount: 15}),
  fakeCategoryModel({unmoderatedCount: 10}),
  ]);

const categoriesShort = List<ICategoryModel>([
  fakeCategoryModel({unmoderatedCount: 10}),
  fakeCategoryModel({unmoderatedCount: 2}),
  fakeCategoryModel({label: 'N.Y.C. Events Guide', unmoderatedCount: 15}),
  fakeCategoryModel({label: 'ChuChu TV Nursery Rhymes & Kids Songs', unmoderatedCount: 2}),
  fakeCategoryModel({label: 'ChuChu TV Nursery Rhymes & Kids Songs', unmoderatedCount: 2999}),
  fakeCategoryModel({unmoderatedCount: 1000}),
  fakeCategoryModel({unmoderatedCount: 100}),
]);

const singleCategory = fakeCategoryModel({label: 'ChuChu TV Nursery Rhymes & Kids Songs', unmoderatedCount: 2999});

storiesOf('TableFrame', module)
  .add('Category sidebar overlay', () => {
    function hide() { console.log('hide clicked'); }
    return (
      <CategorySidebar
        user={user}
        categories={categories}
        selectMine={false}
        selectedCategory={categories.get(2)}
        hideSidebar={hide}
      />
    );
  })
  .add('Category sidebar', () => {
    return (
      <CategorySidebar
        user={userNoIcon}
        categories={categoriesShort}
        selectMine={false}
        selectedCategory={categoriesShort.get(3)}
      />
    );
  })
  .add('Header bar with show sidebar', () => {
    function show() { console.log('show clicked'); }
    function logout() { console.log('logout clicked'); }
    return (
      <HeaderBar
        showSidebar={show}
        logout={logout}
      />
    );
  })
  .add('Header bar for admin', () => {
    function logout() { console.log('logout clicked'); }
    return (
      <HeaderBar
        logout={logout}
        category={singleCategory}
      />
    );
  });
