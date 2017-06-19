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
import { MEDIUM_COLOR } from '../../styles';
import { css } from '../../util';
import { DraggableHandle, Slider } from '../Slider';

storiesOf('Slider', {})
  .add('default', () => (
    <div {...css({ background: MEDIUM_COLOR, padding: '20px' })}>
      <Slider>
        <DraggableHandle
          position={0.25}
          onChange={action('handle a position')}
        />
        <DraggableHandle
          position={0.75}
          onChange={action('handle b position')}
          positionOnRight
        />
      </Slider>
    </div>
  ));
