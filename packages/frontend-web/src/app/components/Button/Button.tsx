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

import {
  BUTTON_LINK_TYPE,
  GREY_COLOR,
  LIGHT_COLOR,
  LIGHT_PRIMARY_TEXT_COLOR,
  NICE_MIDDLE_BLUE,
  WHITE_COLOR,
} from '../../styles';
import { css, IStyle, stylesheet } from '../../utilx';

const STYLES = stylesheet({
  button: {
    ...BUTTON_LINK_TYPE,
    background: NICE_MIDDLE_BLUE,
    border: 0,
    borderRadius: '3px',
    color: LIGHT_PRIMARY_TEXT_COLOR,
    cursor: 'pointer',
    padding: '16px 34px 14px 34px',
    ':focus': {
      outline: 'none',
      background: LIGHT_COLOR,
    },
  },

  disabled: {
    color: WHITE_COLOR,
    background: GREY_COLOR,
  },
});

export interface IButtonProps {
  label: string;
  onClick?(e: React.MouseEvent<any>): any;
  disabled?: boolean;
  buttonStyles?: IStyle;
}

export class Button extends React.PureComponent<IButtonProps> {
  render() {
    const {
      label,
      onClick,
      disabled,
      buttonStyles,
    } = this.props;

    return (
      <button key={label} {...css(STYLES.button, disabled && STYLES.disabled, buttonStyles)} onClick={onClick} disabled={disabled}>{label}</button>
    );
  }
}
