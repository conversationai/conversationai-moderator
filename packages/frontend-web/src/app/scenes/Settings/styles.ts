/*
Copyright 2020 Google Inc.

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
  ARTICLE_CATEGORY_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  WHITE_COLOR
} from '../../styles';
import {stylesheet} from '../../utilx';

export const STYLES: any = stylesheet({
  base: {
    ...ARTICLE_CATEGORY_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
    position: 'relative',
    height: '100%',
    boxSizing: 'border-box',
  },
  body: {
    height: `calc(100% - ${2 * HEADER_HEIGHT + 12}px)`,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  formContainer: {
    background: WHITE_COLOR,
    paddingBottom: `${GUTTER_DEFAULT_SPACING}px`,
  },
});
