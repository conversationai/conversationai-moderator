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
import { ConfirmationCircle } from './ConfirmationCircle';

const APPROVE_COLOR = '#27d073';
const DEFER_COLOR = '#999999';
const HIGHLIGHT_COLOR = '#f9b453';
const REJECT_COLOR = '#fc4a79';

export interface IConfirmationCircleProps {
  backgroundColor: string;
  action: 'approve' | 'defer' | 'highlight' | 'reject';
  size: number;
}

storiesOf('ConfirmationCircle', module)
.add('approve small', () => {
  return (
    <ConfirmationCircle
      size={40}
      backgroundColor={APPROVE_COLOR}
      action={'approve'}
    />
  );
})
.add('defer small', () => {
  return (
    <ConfirmationCircle
      size={40}
      backgroundColor={DEFER_COLOR}
      action={'defer'}
    />
  );
})
.add('highlight small', () => {
  return (
    <ConfirmationCircle
      size={40}
      backgroundColor={HIGHLIGHT_COLOR}
      action={'highlight'}
    />
  );
})
.add('reject small', () => {
  return (
    <ConfirmationCircle
      size={40}
      backgroundColor={REJECT_COLOR}
      action={'reject'}
    />
  );
})
.add('approve large', () => {
  return (
    <ConfirmationCircle
      size={120}
      backgroundColor={APPROVE_COLOR}
      action={'approve'}
    />
  );
})
.add('defer large', () => {
  return (
    <ConfirmationCircle
      size={120}
      backgroundColor={DEFER_COLOR}
      action={'defer'}
    />
  );
})
.add('highlight large', () => {
  return (
    <ConfirmationCircle
      size={120}
      backgroundColor={HIGHLIGHT_COLOR}
      action={'highlight'}
    />
  );
})
.add('reject large', () => {
  return (
    <ConfirmationCircle
      size={120}
      backgroundColor={REJECT_COLOR}
      action={'reject'}
    />
  );
});
