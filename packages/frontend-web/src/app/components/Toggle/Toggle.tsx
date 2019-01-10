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
  DARK_COLOR,
  DIVIDER_COLOR,
  ELEMENTS_CHECK,
  INPUT_CHECK,
  LIGHT_TERTIARY_TEXT_COLOR,
  WHITE_COLOR,
} from '../../styles';
import { maybeCallback, partial } from '../../util';
import { css, stylesheet } from '../../utilx';

const STYLES = stylesheet({
  input: {
    display: 'block',
    overflow: 'hidden',
    height: '24px',
    width: '48px',
    cursor: 'pointer',
    position: 'relative',
    borderRadius: '12px',
    border: '1px solid transparent',
    backgroundColor: DARK_COLOR,
  },

  inputFocused: {
    borderColor: LIGHT_TERTIARY_TEXT_COLOR,
  },

  inputCheck: INPUT_CHECK,

  elementsCheck: {
    ...ELEMENTS_CHECK,
    width: '22px',
    height: '22px',
    marginTop: '-11px',
    borderWidth: 0,
    backgroundColor: LIGHT_TERTIARY_TEXT_COLOR,
  },
  element1Check: {
    transform: `translateX(0)`,
  },
  element1CheckedCheck: {
    transform: `translateX(26px)`,
    backgroundColor: WHITE_COLOR,
  },
  element1Disabled: {
    backgroundColor: DIVIDER_COLOR,
  },
  element2Check: {
    transform: `translateX(0)`,
  },
  element2CheckedCheck: {
    transform: `translateX(26px)`,
    backgroundColor: WHITE_COLOR,
  },
  element2Disabled: {
    backgroundColor: DIVIDER_COLOR,
  },
});

export interface IToggleProps {
  inputId?: string;
  onToggle?(isSelected: boolean): any;
  isDisabled?: boolean;
  isReadonly?: boolean;
  isSelected?: boolean;
  value?: string;
  style?: object;
}

export interface IToggleState {
  isFocused: boolean;
}

export class Toggle extends React.PureComponent<IToggleProps, IToggleState> {
  state = {
    isFocused: false,
  };

  render() {
    const {
      isDisabled,
      inputId,
      isReadonly,
      isSelected,
      onToggle,
      value,
      style,
    } = this.props;

    const {
      isFocused,
    } = this.state;

    return (
      <span
        {...css(
          STYLES.input,
          style,
          isFocused && STYLES.inputFocused,
        )}
      >
        <input
          id={inputId}
          ref={inputId}
          type="checkbox"
          checked={isSelected || false}
          disabled={isDisabled || false}
          readOnly={isReadonly || false}
          value={value}
          onKeyPress={partial(maybeCallback(onToggle), isSelected || false)}
          onChange={partial(maybeCallback(onToggle), isSelected || false)}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
          {...css(STYLES.inputCheck)}
        />
        <span
          {...css(
            STYLES.elementsCheck,
            STYLES.element1Check,
            isSelected && STYLES.element1CheckedCheck,
            isDisabled && STYLES.element1Disabled,
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
