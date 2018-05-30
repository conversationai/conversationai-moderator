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
import { DARK_TERTIARY_TEXT_COLOR } from '../../styles';
import { css, stylesheet } from '../../util';

const STYLES = stylesheet({
  base: {
    display: 'flex',
    padding: 0,
    borderRadius: '50%',
    boxShadow: '0 0 20px ' + DARK_TERTIARY_TEXT_COLOR,
    width: '280px',
    height: '280px',
    justifyContent: 'center',
    alignItems: 'center',
    boxSizing: 'border-box',
  },

  inner: {
    width: '100%',
    height: '100%',
    padding: '10%',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
});

export interface IToastProps extends React.Props<any> {
  backgroundColor: string;
  size?: number;
}

export class Toast extends React.PureComponent<IToastProps> {
  render() {
    const {
      backgroundColor,
      children,
      size,
    } = this.props;

    return (
      <div
        {...css(
          STYLES.base,
          { backgroundColor },
          size && { width: size, height: size },
        )}
        role="dialog"
        aria-labelledby="dialog-title"
      >
        <div {...css(STYLES.inner)}>{children}</div>
      </div>
    );
  }
}
