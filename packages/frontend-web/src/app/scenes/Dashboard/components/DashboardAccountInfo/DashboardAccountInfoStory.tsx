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

import { action, storiesOf } from '@kadira/storybook';
import { fakeUserModel } from '../../../../../models/fake';
import { MEDIUM_COLOR } from '../../../../styles';
import { css } from '../../../../util';
import { DashboardAccountInfo } from '../DashboardAccountInfo';
const user = fakeUserModel({
  name: 'Person Name',
  avatarURL: 'https://s3.amazonaws.com/uifaces/faces/twitter/jnmnrd/128.jpg',
});

const STORY_STYLES = {
  base: {
    background: MEDIUM_COLOR,
    maxWidth: '300px',
  },
};

storiesOf('DashboardAccountInfo', {})
  .add('Default', () => (
    <div {...css(STORY_STYLES.base)}>
      <DashboardAccountInfo
        user={user}
        onDropdownClick={action('Dash Account Dropdown Clicked')}
      />
    </div>
  ));
