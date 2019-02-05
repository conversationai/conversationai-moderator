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
import { css, IStyle, stylesheet } from '../../utilx';

import {
  BUTTON_LINK_TYPE,
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
  MEDIUM_OPACITY,
  SHORT_SCREEN_QUERY,
  WHITE_COLOR,
} from '../../styles';

export const ICON_SIZE = 24;

const STYLES = stylesheet({
  base: {
    position: 'relative',
    background: 'none',
    border: 0,
    cursor: 'pointer',
    padding: GUTTER_DEFAULT_SPACING,
    display: 'flex',
    justifyContent: 'center',
    ':hover': {},
    ':focus': {
      outline: 0,
    },
    [SHORT_SCREEN_QUERY] : {
      padding: '16px',
    },
  },

  disabledButton: {
    opacity: MEDIUM_OPACITY,
    cursor: 'default',
  },

  content: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto',
    borderBottom: '2px solid transparent',
  },

  baseLabel: {
    ...BUTTON_LINK_TYPE,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    marginLeft: 16,
    borderBottom: '2px solid transparent',
  },

  labelFocused: {
    borderBottom: `2px solid ${WHITE_COLOR}`,
  },

  iconFocused: {
    borderBottom: `2px solid ${MEDIUM_COLOR}`,
  },

  noLabel: {
    display: 'none',
  },
});

export interface ICommentActionProps {
  style?: IStyle;
  label: string;
  disabled?: boolean;
  icon: JSX.Element;
  iconHovered?: JSX.Element;
  hideLabel?: boolean;
  onClick?(e: React.MouseEvent<any>): any;
  buttonRef?: React.Ref<HTMLButtonElement>;
  isActive?: boolean;
}

export interface ICommentActionState {
  isFocused?: boolean;
  isHovered?: boolean;
}

export class CommentActionButton
    extends React.PureComponent<ICommentActionProps, ICommentActionState> {

  state = {
    isFocused: false,
    isHovered: false,
  };

  render() {
    const {
      style,
      disabled,
      label,
      icon,
      iconHovered,
      hideLabel,
      buttonRef,
      isActive,
      onClick,
    } = this.props;

    const {
      isHovered,
      isFocused,
    } = this.state;

    const showActive = iconHovered && (isActive || (!disabled && isHovered));

    return (
      <button
        type="button"
        ref={buttonRef}
        disabled={disabled}
        {...css(
          STYLES.base,
          disabled && STYLES.disabledButton,
          style,
        )}
        aria-label={label}
        onClick={onClick}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onFocus={this.onFocus}
        onBlur={this.onBlur}
      >
        <div aria-hidden {...css(STYLES.content, isFocused && STYLES.iconFocused)}>
          <div>
            {showActive ? iconHovered : icon}
          </div>
          <div {...css(STYLES.baseLabel, hideLabel && STYLES.noLabel, isFocused && STYLES.labelFocused)}>
            {label}
          </div>
        </div>
      </button>
    );
  }

  @autobind
  onMouseEnter() {
    this.setState({ isHovered: true });
  }

  @autobind
  onMouseLeave() {
    this.setState({ isHovered: false });
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
