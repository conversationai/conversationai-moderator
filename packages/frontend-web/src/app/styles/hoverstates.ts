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

/*
 * Hover opacity for arrow buttons and multiple elements
 */

export const OPACITY_TRANSITION = {
  opacity: 1,
  transition: 'opacity 0.3 ease',
  ':hover': {
    transition: 'opacity 0.3 ease',
    opacity: 0.64,
  },
  ':focus': {
    outline: 0,
    opacity: 0.64,
  },
};

/*
 * Use for link and button elements; color needs to be
 * specified in ':hover'
 */
export const BOTTOM_BORDER_TRANSITION = {
  textDecoration: 'none',
  borderBottomColor: 'transparent',
  borderBottomStyle: 'solid',
  borderBottomWidth: '1px',
  transition: 'all 0.3 ease',
};
