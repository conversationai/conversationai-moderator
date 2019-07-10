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
  DARK_SECONDARY_TEXT_COLOR,
  DIVIDER_COLOR,
  MEDIUM_COLOR,
  WHITE_COLOR,
} from './colors';

/*
 * Checkbox/radio input styles
 */
export const LABEL_CHECK = {
  position: 'relative',
};

export const INPUT_CHECK = {
  opacity: 0,
  position: 'absolute',
  width: 0,
  height: 0,
  clip: 'rect(1px, 1px, 1px, 1px)',
  pointerEvents: 'none',
  ':focus': {},
};

export const ELEMENTS_CHECK = {
  backgroundClip: 'padding-box',
  backgroundColor: 'transparent',
  borderColor: DARK_SECONDARY_TEXT_COLOR,
  borderRadius: '50%',
  borderStyle: 'solid',
  borderWidth: '2px',
  display: 'block',
  height: 18,
  marginTop: -9,
  position: 'absolute',
  top: '50%',
  transition: 'all 0.3s ease',
  width: '18px',
};

export const ELEMENT_1_CHECK = {};

export const ELEMENT_2_CHECK = {
  backgroundColor: MEDIUM_COLOR,
  borderColor: WHITE_COLOR,
  transform: 'scale(0)',
  transition: 'all 0.3s ease',
};

export const ELEMENT_1_CHECKED_CHECK = {
  borderColor: DARK_SECONDARY_TEXT_COLOR,
};

export const ELEMENT_2_CHECKED_CHECK = {
  transform: 'scale(1.1, 1.1)',
  borderColor: 'transparent',
};

export const ELEMENT_2_CHECKED_CHECK_DISABLED = {
  transform: 'scale(1, 1)',
  backgroundColor: DIVIDER_COLOR,
};

export const ELEMENT_1_DISABLED = {
  borderColor: DIVIDER_COLOR,
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
  color: MEDIUM_COLOR,
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
