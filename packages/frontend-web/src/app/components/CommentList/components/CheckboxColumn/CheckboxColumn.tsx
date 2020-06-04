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

import React from 'react';
import { ModelId } from '../../../../../models';
import { maybeCallback, partial } from '../../../../util';
import { css, stylesheet } from '../../../../utilx';
import { Checkbox } from '../../../Checkbox';

import {
  ARTICLE_CATEGORY_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  LABEL_CHECK,
  VISUALLY_HIDDEN,
} from '../../../../styles';

const STYLES = stylesheet({
  base: {
    display: 'flex',
    boxSizing: 'border-box',
    justifyContent: 'space-between',
    minWidth: `${GUTTER_DEFAULT_SPACING}px`,
    paddingLeft: '22px',
    height: '100%',
  },

  label: {
    ...LABEL_CHECK,
    ...ARTICLE_CATEGORY_TYPE,
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
    userSelect: 'none',
    width: '100%',
    color: DARK_PRIMARY_TEXT_COLOR,
    paddingBottom: 0,
    justifyContent: 'flex-end',
    marginRight: `${GUTTER_DEFAULT_SPACING * 2}px`,
  },

  labelSlim: {
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },
});

export interface ICheckboxColumnProps {
  commentId?: ModelId;
  isSelected?: boolean;
  inputId: string;
  isItemChecked?(commentId: ModelId): boolean;
  onCheck?(commentId: ModelId): void;
}

export function CheckboxColumn(props: ICheckboxColumnProps) {
  const {
    isSelected,
    onCheck,
    commentId,
    isItemChecked,
    inputId,
  } = props;
  const smallerScreen = window.innerWidth < 1025;

  return (
    <div {...css(STYLES.base)}>
      <label
        {...css(STYLES.label, smallerScreen && STYLES.labelSlim)}
        htmlFor={inputId}
        onClick={partial(maybeCallback(onCheck), commentId)}
      >
        <Checkbox
          inputId={inputId}
          isSelected={isItemChecked ? isItemChecked(commentId) : isSelected}
          onCheck={partial(maybeCallback(onCheck), commentId)}
        />
        <span {...css(VISUALLY_HIDDEN)}>Select item</span>
      </label>
    </div>
  );
}
