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
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  INPUT_DROP_SHADOW,
  NICE_MIDDLE_BLUE,
  PALE_COLOR,
} from '../../styles';
import { stylesheet } from '../../utilx';

export const CELL_HEIGHT = 96;

export const ARTICLE_TABLE_STYLES = stylesheet({
  dataTable: {
    borderSpacing: 0,
    width: '100%',
  },
  dataHeader: {
    color: 'rgba(255,255,255,0.54)',
    backgroundColor: NICE_MIDDLE_BLUE,
    fontSize: '12px',
    fontWeight: 500,
  },
  dataBody: {
    background: 'white',
  },
  headerCell: {
    height: `${HEADER_HEIGHT}px`,
  },
  dataCell: {
    borderBottom: '1px solid rgba(38,50,56,0.12)',
    height: `${CELL_HEIGHT}px`,
    fontSize: '14px',
    fontWeight: '500',
  },
  summaryCell: {
    borderBottom: '1px solid rgba(38,50,56,0.12)',
    height: `${HEADER_HEIGHT}px`,
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#FAFAFA',
  },
  iconCell: {
    width: `${HEADER_HEIGHT}px`,
    minHeight: `${HEADER_HEIGHT}px`,
    textAlign: 'center',
  },
  textCell: {
    textAlign: 'left',
    paddingLeft: '10px',
  },
  numberCell: {
    textAlign: 'right',
    width: '80px',
    paddingRight: '10px',
  },
  timeCell: {
    textAlign: 'right',
    width: '100px',
    paddingRight: '20px',
  },
  select: {
    width: 'auto',
    height: '36px',
    paddingLeft: `${GUTTER_DEFAULT_SPACING / 2}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
    border: 'none',
    borderRadius: 2,
    boxShadow: INPUT_DROP_SHADOW,
    backgroundColor: PALE_COLOR,
    fontSize: '16px',
  },
});

export const COMMON_STYLES = stylesheet({
  cellLink: {
    fontWeight: '500',
    color: 'inherit',
    ':hover': {
      textDecoration: 'underline',
    },
  },
});
