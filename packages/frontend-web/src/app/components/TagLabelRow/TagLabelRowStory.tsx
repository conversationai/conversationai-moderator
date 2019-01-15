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

import { fakeTagModel } from '../../../models/fake';
import { DARK_COLOR, MEDIUM_COLOR } from '../../styles';
import { css } from '../../utilx';
import { TagLabelRow } from '../TagLabelRow';

const tag1 = fakeTagModel({
  color: '#ff0000',
  description: 'Hello World',
  key: 'INFLAMMATORY',
  label: 'Inflammatory',
});
const tag2 = fakeTagModel({
  color: '#ff00ff',
  description: 'Hello World',
  key: 'OFF_TOPIC',
  label: 'Off Topic',
});

const ACTION_STYLES = {
  button: {
    background: 'transparent',
    border: 0,
    width: '100%',
    padding: 0,
  },
};

const SNAPSHOT_WIDTH = 264;
const SNAPSHOT_HEIGHT = 76;

storiesOf('TagLabelRow', module)
  .add('Default', () => (
    <div>
      <button
        key="inflammatory"
        {...css(ACTION_STYLES.button)}
        onClick={action('Tag Row Clicked')}
        aria-label="Inflammatory"
      >
        <TagLabelRow
          imageHeight={SNAPSHOT_WIDTH}
          imageWidth={SNAPSHOT_HEIGHT}
          tag={tag1}
          imagePath=""
          background={MEDIUM_COLOR}
        />
      </button>
      <button
        key="off-topic"
        {...css(ACTION_STYLES.button)}
        onClick={action('Tag Row Clicked')}
        aria-label="Off Topic"
      >
        <TagLabelRow
          imageHeight={SNAPSHOT_WIDTH}
          imageWidth={SNAPSHOT_HEIGHT}
          tag={tag2}
          imagePath=""
          background={DARK_COLOR}
        />
      </button>
    </div>
  ));
