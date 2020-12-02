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
import { ARTICLE_HEADLINE_TYPE, DARK_SECONDARY_TEXT_COLOR, WHITE_COLOR } from '../../styles';
import { css } from '../../utilx';
import { Scrim } from '../Scrim';

const STYLES = {
  base: {
    ...ARTICLE_HEADLINE_TYPE,
    color: WHITE_COLOR,
  },
};

storiesOf('Scrim', module)
  .add('dark', () => {
    return (
      <Scrim
        scrimStyles={{backgroundColor: DARK_SECONDARY_TEXT_COLOR}}
        isVisible
        onBackgroundClick={action('clicked bg')}
      >
        <div {...css(STYLES.base)}>Hi!</div>
      </Scrim>
    );
  })
  .add('red', () => {
    return (
      <Scrim
        scrimStyles={{backgroundColor: 'rgba(255,0,0,0.5)'}}
        isVisible
        onBackgroundClick={action('clicked bg')}
      >
        <div {...css(STYLES.base)}>Hi!</div>
      </Scrim>
    );
  });
