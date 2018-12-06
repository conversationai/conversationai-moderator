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
import { action } from '@storybook/addon-actions';
import { List } from 'immutable';

import { fakeCategoryModel, fakeUserModel } from '../../../../../../../models/fake';
import { css } from '../../../../../../util';
import { DashboardCategoryItem } from '../DashboardCategoryItem';

const user1 = fakeUserModel({
  name: 'Person1',
});

const user2 = fakeUserModel({
  name: 'Person2',
});

const user3 = fakeUserModel({
  name: 'Person3',
});

const STYLES = {
  base: {
    width: '738px',
    padding: '20px 24px',
    borderWidth: 1,
    borderColor: 'gray',
    borderStyle: 'solid',
  },
};

storiesOf('DashboardArticleItem', module)
  .add('default', () => {
    const moderators = List([user1, user2, user3]);

    return (
      <div {...css(STYLES.base)}>
        <DashboardCategoryItem
          category={fakeCategoryModel({
            id: '1',
            label: 'Category Name',
          })}
          categoryModerators={moderators}
          onAddCategoryModeratorClick={action('Add Moderator Clicked')}
        />
      </div>
    );
  });
