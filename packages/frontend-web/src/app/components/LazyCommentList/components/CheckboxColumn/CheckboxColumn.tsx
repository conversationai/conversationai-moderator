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
import { ICommentModel } from '../../../../../models';
import { Checkbox } from '../../../../components';
import { css, maybeCallback, partial, stylesheet } from '../../../../util';

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

export interface ICheckboxColumnProps extends React.Props<any> {
  comment?: ICommentModel;
  isSelected?: boolean;
  onCheck?(comment: ICommentModel): void;
  inputId: string;
  isItemChecked?(id: string): boolean;
}

export class CheckboxColumn extends React.PureComponent<ICheckboxColumnProps> {
  render() {
    const {
      isSelected,
      onCheck,
      comment,
      isItemChecked,
      inputId,
    } = this.props;
    const smallerScreen = window.innerWidth < 1025;

    return (
      <div {...css(STYLES.base)}>
        <label
          {...css(STYLES.label, smallerScreen && STYLES.labelSlim)}
          htmlFor={inputId}
          onClick={partial(maybeCallback(onCheck), comment)}
        >
          <Checkbox
            inputId={inputId}
            isSelected={isItemChecked && comment ? isItemChecked(comment.id) : isSelected}
            onCheck={partial(maybeCallback(onCheck), comment)}
          />
          <span {...css(VISUALLY_HIDDEN)}>Select item</span>
        </label>
      </div>
    );
  }
}
