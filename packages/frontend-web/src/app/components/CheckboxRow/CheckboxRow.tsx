/*
Copyright 2019 Google Inc.

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

import React from 'react';

import {
  Radio,
} from '@material-ui/core';

import {
  ARTICLE_CATEGORY_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  LABEL_CHECK,
} from '../../styles';
import { css, stylesheet } from '../../utilx';

export const GOOD_IMAGE_SIZE = 46;

const STYLES = stylesheet({
  base: {
    position: 'relative',
  },

  row: {
    ...ARTICLE_CATEGORY_TYPE,
    alignItems: 'center',
    justifyContent: 'space-between',
    display: 'flex',
    marginBottom: '14px',
    userSelect: 'none',
    width: '100%',
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  rowDisabled: {
    opacity: '0.75',
    backgroundColor: '#eee',
  },

  avatar: {
    marginRight: '28px',
  },

  name: {
    flex: 1,
  },

  center: {
    ...LABEL_CHECK,
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
    width: '100%',
  },
});

export interface ICheckboxRowProps<T> {
  label: string;
  value: T;
  image?: React.ReactNode;
  isSelected?: boolean;
  isDisabled?: boolean;
  onChange?(value: T): void;
}

export function CheckboxRow<T>(props: ICheckboxRowProps<T>) {
  const {label, value, image, isSelected, isDisabled} = props;
  const id = label.replace(/\s/g, '');
  function handleClick(e: any) {
    e.preventDefault();
    props.onChange(value);
  }

  return (
    <div {...css(STYLES.base)}>
      <div {...css(STYLES.row, isDisabled ? STYLES.rowDisabled : {})}>
        <label
          htmlFor={id}
          onClick={handleClick}
          {...css(STYLES.center)}
        >
          {image && (
            <span {...css(STYLES.avatar)} aria-hidden="true">
              {image}
            </span>
          )}
          <span {...css(STYLES.name)}>{label}</span>
          <Radio color="primary" checked={isSelected}/>
        </label>
      </div>
    </div>
  );
}
