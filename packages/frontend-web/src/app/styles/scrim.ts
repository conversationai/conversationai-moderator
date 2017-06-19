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

import { GUTTER_DEFAULT_SPACING, MODAL_DROP_SHADOW, WHITE_COLOR } from '../styles';

/*
 * Select element styles
 */
export const SCRIM_STYLE = {
  scrim: {
    background: 'rgba(255, 255, 255, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },

  popup: {
    background: WHITE_COLOR,
    paddingTop: `${GUTTER_DEFAULT_SPACING}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
    paddingBottom: `${GUTTER_DEFAULT_SPACING}px`,
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    width: 400,
    boxShadow: MODAL_DROP_SHADOW,
    outline: 0,
    ':focus': {
      outline: 'none',
    },
  },
};
