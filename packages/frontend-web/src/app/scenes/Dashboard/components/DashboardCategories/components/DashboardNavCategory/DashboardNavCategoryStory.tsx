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
import { MEDIUM_COLOR } from '../../../../../../styles';
import { css } from '../../../../../../utilx';
import { DashboardNavCategory } from './DashboardNavCategory';

storiesOf('DashboardNavCategory', module)
  .add('Default', () => (
    <div {...css({ background: MEDIUM_COLOR })}>
      <DashboardNavCategory
        label="World"
        slug="world"
        count={28}
      />
    </div>
  ))
  .add('Highlight Count', () => (
    <div {...css({ background: MEDIUM_COLOR })}>
      <DashboardNavCategory
        label="World"
        slug="world"
        count={28}
        hasNewItems
      />
    </div>
  ))
  .add('Active', () => (
    <div {...css({ background: MEDIUM_COLOR })}>
      <DashboardNavCategory
        label="World"
        slug="world"
        count={28}
        isActive
      />
    </div>
  ))
  .add('Active and Highlighted', () => (
    <div {...css({ background: MEDIUM_COLOR })}>
      <DashboardNavCategory
        label="World"
        slug="world"
        count={28}
        isActive
        hasNewItems
      />
    </div>
  ));
