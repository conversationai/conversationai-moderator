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
import { List } from 'immutable';

import { fakeArticleModel, fakeUserModel } from '../../../../../../../models/fake';
import { css } from '../../../../../../utilx';
import { DashboardArticleItem } from './DashboardArticleItem';

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

const getLinkTarget = () => 'target';

storiesOf('DashboardArticleItem', module)
  .add('singleline', () => {
    const moderators = List([user1, user2, user3]);

    return (
      <div {...css(STYLES.base)}>
        <DashboardArticleItem
          article={fakeArticleModel({
            id: '1',
            sourceCreatedAt: (new Date()).toISOString(),
            title: 'Hello, welcome to this article',
          })}
          articleModerators={moderators}
          getLinkTarget={getLinkTarget}
          onAddArticleModeratorClick={action('Add Moderator Clicked')}
        />
      </div>
    );
  })
  .add('multiline', () => {
    const moderators = List([user1, user2, user3]);

    return (
      <div {...css(STYLES.base)}>
        <DashboardArticleItem
          article={fakeArticleModel({
            id: '1',
            sourceCreatedAt: (new Date()).toISOString(),
            title: 'Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article',
          })}
          articleModerators={moderators}
          getLinkTarget={getLinkTarget}
          onAddArticleModeratorClick={action('Add Moderator Clicked')}
        />
      </div>
    );
  });
