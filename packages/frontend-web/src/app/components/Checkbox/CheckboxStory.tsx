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

import { css } from '../../utilx';
import { Checkbox } from '../Checkbox';

storiesOf('Checkbox', module)
  .add('checked', () => {
    return (
      <div {...css({ width: `22px`, position: 'relative' })}>
        <Checkbox
          inputId={'some-id'}
          isSelected
          onCheck={action('add unchecked style')}
          value={'checked'}
        />
      </div>
    );
  })
  .add('unchecked', () => {
    return (
      <div {...css({ width: `22px`, position: 'relative' })}>
        <Checkbox
          onCheck={action('add checked style')}
          value={'unchecked'}
        />
      </div>
    );
  })
  .add('checked and disabled', () => {
    return (
      <div {...css({ width: `22px`, position: 'relative' })}>
        <Checkbox
          isSelected
          isDisabled
          isReadonly
        />
      </div>
    );
  })
  .add('unchecked and disabled', () => {
    return (
      <div {...css({ width: `22px`, position: 'relative' })}>
        <Checkbox
          isDisabled
          isReadonly
        />
      </div>
    );
  });
