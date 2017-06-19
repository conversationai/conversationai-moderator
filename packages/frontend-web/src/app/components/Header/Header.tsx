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
import { SearchIcon, UserIcon } from '../../components';
import {
  DARK_COLOR,
  HEADER_HEIGHT,
  LIGHT_PRIMARY_TEXT_COLOR,
  OFFSCREEN,
} from '../../styles';
import { css, maybeCallback, stylesheet } from '../../util';

const STYLES = stylesheet({
  bar: {
    alignItems: 'center',
    background: DARK_COLOR,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    height: `${HEADER_HEIGHT}px`,
  },

  button: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: HEADER_HEIGHT,
    width: HEADER_HEIGHT,
    alignSelf: 'flex-end',
    ':focus': {
      outline: 'none',
    },
  },

  childrenContainer: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    flex: 1,
  },

  offscreen: OFFSCREEN,

  iconStyle: {
    fill: LIGHT_PRIMARY_TEXT_COLOR,
    borderBottom: '2px solid transparent',
  },

});

export interface IHeaderProps extends React.HTMLProps<any> {
  onSearchClick?(): void;
  onAuthorSearchClick?(): void;
  hideSearchIcon?: boolean;
}

export interface IHeaderState extends React.HTMLProps<any> {
  isFocused: boolean;
  isUserFocused: boolean;
}

export class Header extends React.PureComponent<IHeaderProps, IHeaderState> {
  state = {
    isFocused: false,
    isUserFocused: false,
  };

  @autobind
  onFocus() {
    this.setState({ isFocused: true });
  }

  @autobind
  onBlur() {
    this.setState({ isFocused: false });
  }

  @autobind
  onUserFocus() {
    this.setState({ isUserFocused: true });
  }

  @autobind
  onUserBlur() {
    this.setState({ isUserFocused: false });
  }

  render() {
    const {
      onSearchClick,
      onAuthorSearchClick,
      hideSearchIcon,
      children,
    } = this.props;

    const { isFocused, isUserFocused } = this.state;

    return (
      <header role="banner">
        <div {...css(STYLES.bar)}>
          <div {...css(STYLES.childrenContainer)}>
            {children}
          </div>
          {!hideSearchIcon && (
            <button
              {...css(STYLES.button)}
              aria-label="Open user search"
              onFocus={this.onUserFocus}
              onBlur={this.onUserBlur}
              role="search"
              onClick={maybeCallback(onAuthorSearchClick)}
            >
              <span {...css(STYLES.offscreen)}>Open user search</span>
              <UserIcon {...css(STYLES.iconStyle, isUserFocused ? ({borderBottomColor: LIGHT_PRIMARY_TEXT_COLOR}) : {borderBottomColor: 'transparent'})} />
            </button>
          )}
          {!hideSearchIcon && (
            <button
              {...css(STYLES.button)}
              aria-label="Open comment search"
              onFocus={this.onFocus}
              onBlur={this.onBlur}
              role="search"
              onClick={maybeCallback(onSearchClick)}
            >
              <span {...css(STYLES.offscreen)}>Open search input</span>
              <SearchIcon {...css(STYLES.iconStyle, isFocused ? ({borderBottomColor: LIGHT_PRIMARY_TEXT_COLOR}) : {borderBottomColor: 'transparent'})} />
            </button>
          )}
        </div>
      </header>
    );
  }
}
