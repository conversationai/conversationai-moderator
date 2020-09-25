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
  ARTICLE_CATEGORY_TYPE,
  BASE_Z_INDEX,
  BOX_DEFAULT_SPACING,
  DARK_SECONDARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  INPUT_DROP_SHADOW,
  NICE_MIDDLE_BLUE,
  PALE_COLOR, WHITE_COLOR,
} from '../../styles';

const ARROW_SIZE = 6;
const ROW_HEIGHT = 42;

export const SETTINGS_STYLES = {
  row: {
    position: 'relative',
    padding: `0 0 ${GUTTER_DEFAULT_SPACING}px 0`,
    display: 'flex',
    alignItems: 'center',
    maxWidth: '100%',
    overflow: 'hidden',
  },

  label: {
    ...ARTICLE_CATEGORY_TYPE,
    marginRight: '24px',
    minWidth: '120px',
    display: 'flex',
    alignItems: 'center',
    height: ROW_HEIGHT,
  },

  input: {
    borderRadius: 2,
    boxShadow: INPUT_DROP_SHADOW,
    borderWidth: 0,
    fontSize: '16px',
    marginRight: GUTTER_DEFAULT_SPACING,
    paddingLeft: 10,
    backgroundColor: PALE_COLOR,
    height: ROW_HEIGHT,
    boxSizing: 'border-box',
  },

  selectBox: {
    width: 280,
    height: ROW_HEIGHT,
    paddingLeft: 10,
    appearance: 'none',
    WebkitAppearance: 'none', // Not getting prefixed either
    border: 'none',
    borderRadius: 2,
    boxShadow: INPUT_DROP_SHADOW,
    backgroundColor: PALE_COLOR,
    fontSize: '16px',
    boxSizing: 'border-box',
  },

  selectBoxRow: {
    position: 'relative',
  },

  button: {
    alignSelf: 'flex-end',
    backgroundColor: 'transparent',
    border: 'none',
    color: NICE_MIDDLE_BLUE,
    cursor: 'pointer',
    height: ROW_HEIGHT,
    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  checkbox: {
    marginLeft: `${GUTTER_DEFAULT_SPACING / 2}px`,
  },

  arrow: {
    position: 'absolute',
    zIndex: BASE_Z_INDEX,
    right: 28,
    top: 15,
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderTop: `${ARROW_SIZE}px solid ${DARK_SECONDARY_TEXT_COLOR}`,
    display: 'block',
    height: 0,
    width: 0,
    marginLeft: `${BOX_DEFAULT_SPACING}px`,
    marginRight: `${BOX_DEFAULT_SPACING}px`,
    pointerEvents: 'none',
  },

  userTableCell: {
    textAlign: 'left',
    padding: '5px 30px',
  },

  heading: {
    backgroundColor: PALE_COLOR,
    color: NICE_MIDDLE_BLUE,
    padding: `4px ${GUTTER_DEFAULT_SPACING}px`,
  },
  headingText: {
    fontSize: '1.3em',
  },
  section: {
    paddingTop: `${GUTTER_DEFAULT_SPACING}px`,
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
    paddingBottom: `${GUTTER_DEFAULT_SPACING * 2}px`,
    backgroundColor: WHITE_COLOR,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    padding: `${GUTTER_DEFAULT_SPACING}px`,
  },
};
