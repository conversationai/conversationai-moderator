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

import { storiesOf } from '@kadira/storybook';
import {
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
} from '../../styles';
import { css } from '../../util';
import { CommentActionButton } from '../CommentActionButton';
import {
  ApproveIcon,
  DeferIcon,
} from '../Icons';

storiesOf('CommentActionButton', {})
  .add('Full Width', () => (
    <div {...css({ background: MEDIUM_COLOR, display: 'inline-block' })}>
      <CommentActionButton
        label="Approve"
        icon={<ApproveIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
        iconHovered={<DeferIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
      />
    </div>
  ))
  .add('Hide Label', () => (
    <div {...css({ background: MEDIUM_COLOR, display: 'inline-block' })}>
      <CommentActionButton
        label="Approve"
        hideLabel
        icon={<ApproveIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
        iconHovered={<DeferIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
      />
    </div>
  ))
  .add('Disabled', () => (
    <div {...css({ background: MEDIUM_COLOR, display: 'inline-block' })}>
      <CommentActionButton
        label="Approve"
        disabled
        icon={<ApproveIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
        iconHovered={<DeferIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
      />
    </div>
  ));
