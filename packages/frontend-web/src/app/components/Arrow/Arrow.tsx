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
import { css, stylesheet } from '../../utilx';

import { OPACITY_TRANSITION } from '../../styles';

const STYLES = stylesheet({
  container: {
    ...OPACITY_TRANSITION,
  },

  button: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 0,
    display: 'flex',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    ':disabled': {
      opacity: 0.3,
      pointerEvents: 'none',
    },
  },

  disabled: {
    opacity: 0.5,
  },

  arrow: {
    borderTop: '2px solid transparent',
    borderRight: '2px solid transparent',
    borderBottom: '2px solid transparent',
    borderLeft: '2px solid transparent',
  },

  upArrow: {
    transform: 'rotate(90deg)',
  },

  downArrow: {
    transform: 'rotate(-90deg)',
  },

  rightArrow: {
    transform: 'rotate(180deg)',
  },

  leftArrow: {
    transform: 'rotate(0deg)',
  },
});

export interface IArrowProps {
  direction?: 'up' | 'down' | 'left'| 'right';
  icon: JSX.Element;
  label: string;
  isDisabled?: boolean;
  size?: number;
  isActive?: boolean;
  color?: any;
}

export class Arrow extends React.PureComponent<IArrowProps> {

  render() {
    const {
      direction,
      icon,
      isDisabled,
      size,
      isActive,
      color,
    } = this.props;

    const computedIconStyle = {
      ...(isActive && direction === 'right' && ({ borderTopColor: color })),
      ...(isActive && direction === 'up' && ({ borderRightColor: color })),
      ...(isActive && direction === 'left' && ({ borderBottomColor: color })),
      ...(isActive && direction === 'down' && ({ borderLeftColor: color })),
    };

    return (
      <div {...css(STYLES.container, isDisabled && STYLES.disabled)}>
        <span
          key="arrow button"
          {...css(
            STYLES.button,
            {
              width: size || 64,
              height: size || 64,
            },
          )}
        >
          {direction === 'up' && <div {...css(STYLES.arrow, STYLES.upArrow, computedIconStyle)}>{icon}</div>}
          {direction === 'down' && <div {...css(STYLES.arrow, STYLES.downArrow, computedIconStyle)}>{icon}</div>}
          {direction === 'left' && <div {...css(STYLES.arrow, STYLES.leftArrow, computedIconStyle)}>{icon}</div>}
          {direction === 'right' && <div {...css(STYLES.arrow, STYLES.rightArrow, computedIconStyle)}>{icon}</div>}
        </span>
      </div>
    );
  }
}
