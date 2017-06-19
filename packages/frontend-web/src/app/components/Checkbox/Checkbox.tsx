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

import { autobind } from 'core-decorators';
import React from 'react';
import {
  ELEMENT_1_CHECK,
  ELEMENT_1_CHECKED_CHECK,
  ELEMENT_1_DISABLED,
  ELEMENT_2_CHECK,
  ELEMENT_2_CHECKED_CHECK,
  ELEMENT_2_CHECKED_CHECK_DISABLED,
  ELEMENTS_CHECK,
  INPUT_CHECK,
  MEDIUM_COLOR,
  PALE_COLOR,
} from '../../styles';
import { css, maybeCallback, partial, stylesheet } from '../../util';

const STYLES = stylesheet({
  input: {
    display: 'block',
    borderWidth: '2px',
    borderColor: 'transparent',
    borderStyle: 'solid',
    overflow: 'hidden',
    height: '24px',
    width: '24px',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },

  inputFocused: {
    borderColor: MEDIUM_COLOR,
    backgroundColor: PALE_COLOR,
  },

  inputCheck: INPUT_CHECK,

  elementsCheck: ELEMENTS_CHECK,
  element1Check: ELEMENT_1_CHECK,
  element1CheckedCheck: ELEMENT_1_CHECKED_CHECK,
  element1Disabled: ELEMENT_1_DISABLED,
  element2Check: ELEMENT_2_CHECK,
  element2CheckedCheck: ELEMENT_2_CHECKED_CHECK,
  element2Disabled: ELEMENT_2_CHECKED_CHECK_DISABLED,
});

export interface ICheckboxProps {
  inputId?: string;
  onCheck?(isSelected: boolean): any;
  isDisabled?: boolean;
  isReadonly?: boolean;
  isSelected?: boolean;
  value?: string;
  style?: object;
}

export interface ICheckboxState {
  isFocused: boolean;
}

export class Checkbox extends React.PureComponent<ICheckboxProps, ICheckboxState> {
  state = {
    isFocused: false,
  };

  render() {
    const {
      isDisabled,
      inputId,
      isReadonly,
      isSelected,
      onCheck,
      value,
      style,
    } = this.props;

    const {
      isFocused,
    } = this.state;

    return (
      <span {...css(STYLES.input, style)}>
        <input
          id={inputId}
          ref={inputId}
          type="checkbox"
          checked={isSelected || false}
          disabled={isDisabled || false}
          readOnly={isReadonly || false}
          value={value}
          onKeyPress={partial(maybeCallback(onCheck), isSelected || false)}
          onChange={partial(maybeCallback(onCheck), isSelected || false)}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          {...css(STYLES.inputCheck)}
        />
        <span
          {...css(
            STYLES.elementsCheck,
            STYLES.element1Check,
            isFocused && STYLES.inputFocused,
            isSelected && STYLES.element1CheckedCheck,
            isDisabled && STYLES.element1Disabled,
          )}
        />
        <span
          {...css(
            STYLES.elementsCheck,
            STYLES.element2Check,
            isSelected && STYLES.element2CheckedCheck,
            (isSelected && isDisabled) && STYLES.element2Disabled,
          )}
        />
      </span>
    );
  }

  @autobind
  onFocus() {
    this.setState({ isFocused: true });
  }

  @autobind
  onBlur() {
    this.setState({ isFocused: false });
  }
}
