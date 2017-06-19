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

import { storiesOf } from '@kadira/storybook';
import { List } from 'immutable';
import { fakeCategoryModel, fakeRuleModel, fakeTagModel } from '../../../../../models/fake';
import { RuleRow } from './RuleRow';

const categories = List([
  fakeCategoryModel({ id: '1', label: 'Category 1' }),
  fakeCategoryModel({ id: '2', label: 'Category 2' }),
  fakeCategoryModel({ id: '3', label: 'Category 3' }),
  fakeCategoryModel({ id: '4', label: 'Category 4' }),
  fakeCategoryModel({ id: '5', label: 'Category 5' }),
  fakeCategoryModel({ id: '6', label: 'Category 6' }),
]);

const tags = List([
  fakeTagModel({ id: '1', label: 'Tag 1' }),
  fakeTagModel({ id: '2', label: 'Tag 2' }),
  fakeTagModel({ id: '3', label: 'Tag 3' }),
  fakeTagModel({ id: '4', label: 'Tag 4' }),
  fakeTagModel({ id: '5', label: 'Tag 5' }),
  fakeTagModel({ id: '6', label: 'Tag 6' }),
]);

const rangeBottom = 0;
const rangeTop = 100;

storiesOf('RuleRow', {})
  .add('Rule Row', () => {
    return (
      <RuleRow
        tags={tags}
        rangeBottom={rangeBottom}
        rangeTop={rangeTop}
        categories={categories}
        rule={fakeRuleModel({ id: '1' })}
        selectedCategory={'2'}
      />
    );
  });
