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

import {
  NICE_MIDDLE_BLUE,
} from './colors';

/*
 * Checkbox/radio input styles
 */
export const LABEL_CHECK = {
  position: 'relative',
};

/*
 * Select element styles
 */
export const SELECT_ELEMENT = {
  appearance: 'none',
  WebkitAppearance: 'none', // Not getting prefixed either
  background: 'transparent',
  borderTop: 0,
  borderRight: 0,
  borderBottom: 0,
  borderLeft: 0,
  color: NICE_MIDDLE_BLUE,
  cursor: 'pointer',
  lineHeight: '1.4em', // Prevent descenders from getting clipped.
  width: '100%',
};

export const BUTTON_RESET = {
  background: 'none',
    borderTop: 0,
    borderRight: 0,
    borderBottom: 0,
    borderLeft: 0,
    color: 'inherit',
    lineHeight: 'normal',
    overflow: 'visible',
    padding: 0,
};
