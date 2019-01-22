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

import { fakeArticleModel } from '../../../../../../../models/fake';
import { css } from '../../../../../../utilx';
import { DashboardArticleItem } from './DashboardArticleItem';

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
    return (
      <div {...css(STYLES.base)}>
        <DashboardArticleItem
          article={fakeArticleModel({
            id: '1',
            sourceCreatedAt: (new Date()).toISOString(),
            title: 'Hello, welcome to this article',
          })}
          getLinkTarget={getLinkTarget}
        />
      </div>
    );
  })
  .add('multiline', () => {
    return (
      <div {...css(STYLES.base)}>
        <DashboardArticleItem
          article={fakeArticleModel({
            id: '1',
            sourceCreatedAt: (new Date()).toISOString(),
            title: 'Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article Hello, welcome to this article',
          })}
          getLinkTarget={getLinkTarget}
        />
      </div>
    );
  });
