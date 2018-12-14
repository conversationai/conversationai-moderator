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
import { ArrowIcon } from '../../components';
import { DARK_COLOR } from '../../styles';
import { css } from '../../utilx';
import { Arrow } from '../Arrow';

storiesOf('Arrow', module)
  .add('default', () => (
    <div>
      <Arrow
        direction={'up'}
        label={'Up arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
      <Arrow
        direction={'down'}
        label={'Down arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
      <Arrow
        direction={'right'}
        label={'Right arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
      <Arrow
        direction={'left'}
        label={'Left arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
    </div>
  ))
  .add('active', () => (
    <div>
      <Arrow
        isActive
        direction={'up'}
        label={'Up arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
      <Arrow
        isActive
        direction={'down'}
        label={'Down arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
      <Arrow
        isActive
        direction={'right'}
        label={'Right arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
      <Arrow
        isActive
        direction={'left'}
        label={'Left arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
    </div>
  ))
  .add('disabled', () => (
    <div>
      <Arrow
        isDisabled
        direction={'up'}
        label={'Up arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
      <Arrow
        isDisabled
        direction={'down'}
        label={'Down arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
      <Arrow
        isDisabled
        direction={'right'}
        label={'Right arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
      <Arrow
        isDisabled
        direction={'left'}
        label={'Left arrow'}
        color={DARK_COLOR}
        icon={<ArrowIcon {...css({ fill: DARK_COLOR })} size={24}/>}
      />
    </div>
  ));
