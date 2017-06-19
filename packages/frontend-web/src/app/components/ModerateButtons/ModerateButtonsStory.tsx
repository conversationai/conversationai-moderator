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
import { List } from 'immutable';
import { IConfirmationAction } from '../../../types';
import { ModerateButtons } from '../ModerateButtons';

storiesOf('ModerateButtons', {})
  .add('Horizontal', () => (
    <div>
      <ModerateButtons
        darkOnLight
        hideLabel
        containerSize={36}
      />
    </div>
  ))
  .add('Vertical', () => (
    <div>
      <ModerateButtons vertical />
    </div>
  ))
  .add('Vertical Approve', () => (
    <div>
      <ModerateButtons
        activeButtons={List(['approve']) as List<IConfirmationAction>}
        vertical
      />
    </div>
  ))
  .add('Vertical Reject', () => (
    <div>
      <ModerateButtons
        activeButtons={List(['reject']) as List<IConfirmationAction>}
        vertical
      />
    </div>
  ))
  .add('Vertical Highlight', () => (
    <div>
      <ModerateButtons
        activeButtons={List(['approve', 'highlight']) as List<IConfirmationAction>}
        vertical
      />
    </div>
  ))
  .add('Vertical Defer', () => (
    <div>
      <ModerateButtons
        activeButtons={List(['defer']) as List<IConfirmationAction>}
        vertical
      />
    </div>
  ));
