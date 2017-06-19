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
import { clamp } from 'lodash';
import React from 'react';
import { css, stylesheet } from '../../util';
const Draggable = require('react-draggable');
import {
  HANDLE_LABEL_TYPE,
  LIGHT_COLOR,
  LIGHT_PRIMARY_TEXT_COLOR,
  LIGHT_TERTIARY_TEXT_COLOR,
  MEDIUM_COLOR,
} from '../../styles';

import {
  DOWN_ARROW_KEY,
  LEFT_ARROW_KEY,
  RIGHT_ARROW_KEY,
  UP_ARROW_KEY,
} from '../../util';

const HANDLE_SIZE = 22;
const HANDLE_HIT_CONTAINER_SIZE = 44;
const BAR_HEIGHT = 6;

const HANDLE_STYLES = stylesheet({
  handleContainer: {
    height: '0px',
    width: '0px',
    ':focus': {
      outline: 0,
    },
  },

  handle: {
    width: `${HANDLE_HIT_CONTAINER_SIZE}px`,
    height: `${HANDLE_HIT_CONTAINER_SIZE}px`,
    position: 'relative',
    transform: `translate(-${HANDLE_HIT_CONTAINER_SIZE / 2}px, -${(HANDLE_HIT_CONTAINER_SIZE - BAR_HEIGHT) / 2}px)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  handleDisplay: {
    display: 'block',
    borderRadius: '50%',
    height: `${HANDLE_SIZE}px`,
    width: `${HANDLE_SIZE}px`,
    background: LIGHT_PRIMARY_TEXT_COLOR,
  },

  handleFocused: {
    background: LIGHT_COLOR,
  },

  label: {
    ...HANDLE_LABEL_TYPE,
    background: MEDIUM_COLOR,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    padding: '3px 3px 1px 3px',
    position: 'absolute',
    textAlign: 'left',
    transform: `translate(-${HANDLE_SIZE / 2}px, 0)`,
    top: `-${HANDLE_SIZE + 5}px`,
    whiteSpace: 'nowrap',
  },

  rightHandle: {
    transform: `translate(calc(-100% + ${HANDLE_HIT_CONTAINER_SIZE / 2}px), -${(HANDLE_HIT_CONTAINER_SIZE - BAR_HEIGHT) / 2}px)`,
  },

  rightLabel: {
    transform: `translate(calc(-100% + ${HANDLE_SIZE / 2}px), 0)`,
    textAlign: 'right',
  },
});

export interface IHandleProps extends React.HTMLProps<any> {
  label?: string;
  positionOnRight?: boolean;
  keyUp?(e: React.KeyboardEvent<any>): any;
}

export interface IHandleState {
  isFocused: boolean;
}

class Handle extends React.PureComponent<IHandleProps, IHandleState> {
  state = {
    isFocused: false,
  };

  render() {
    const { label, positionOnRight, keyUp, style, ...propsCleaned } = this.props;

    const { isFocused } = this.state;

    return (
      <div
        tabIndex={0}
        onKeyUp={keyUp}
        {...propsCleaned}
        {...css(HANDLE_STYLES.handleContainer, style)}
      >
        <div
          {...css(HANDLE_STYLES.label,
              positionOnRight && HANDLE_STYLES.rightLabel)}
          aria-live="polite"
        >
          {label}
        </div>
        <div
          {...css(
            HANDLE_STYLES.handle,
            positionOnRight && HANDLE_STYLES.rightHandle,
          )}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
        >
          <span
            {...css(
              HANDLE_STYLES.handleDisplay,
              isFocused && HANDLE_STYLES.handleFocused,
            )}
          />
        </div>
      </div>
    );
  }

  @autobind
  onMouseEnter() {
    if (document.body.style.cursor !== '-webkit-grabbing') {
      document.body.style.cursor = '-webkit-grab';
    }
  }

  @autobind
  onMouseLeave() {
    if (document.body.style.cursor === '-webkit-grab') {
      document.body.style.cursor = '';
    }
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

export interface IDraggableHandleProps {
  label?: string;
  positionOnRight?: boolean;
  position: number;
  onChange?(position: number): void;
  onChangeEnd?(position: number): void;
}

export interface IDraggableHandleState {
  parentWidth: number;
}

export class DraggableHandle extends
    React.PureComponent<IDraggableHandleProps, IDraggableHandleState> {
  elem?: HTMLElement;

  state: IDraggableHandleState = {
    parentWidth: null,
  };

  @autobind
  saveSliderRef(ref: HTMLDivElement) {
    this.elem = ref;
  }

  render() {
    const { label, positionOnRight, position } = this.props;
    const { parentWidth } = this.state;

    const x = position * parentWidth;

    return (
      <div ref={this.saveSliderRef}>
        <Draggable
          bounds="parent"
          axis="x"
          position={{ x, y: 0 }}
          onStart={this.onDragStart}
          onDrag={this.onDragUpdate}
          onStop={this.onDragEnd}
        >
          <Handle keyUp={this.onKeyUp} label={label} positionOnRight={positionOnRight} />
        </Draggable>
      </div>
    );
  }

  @autobind
  onKeyUp(e: React.KeyboardEvent<any>) {
    if (e.keyCode === LEFT_ARROW_KEY || e.keyCode === DOWN_ARROW_KEY) {
      this.props.onChange(this.props.position - 0.01);
    } else if (e.keyCode === RIGHT_ARROW_KEY || e.keyCode === UP_ARROW_KEY) {
      this.props.onChange(this.props.position + 0.01);
    }
  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize);
    // Wait for Aphrodite styles to start to parse
    setTimeout(() => this.onResize(), 60);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  @autobind
  onResize() {
    if (!this.elem) { return; }

    const parent = this.elem.offsetParent;
    const { width } = parent.getBoundingClientRect();

    this.setState({ parentWidth: width });
  }

  @autobind
  onDragStart(_: any, { x }: { x: number }) {
    document.body.style.cursor = '-webkit-grabbing';

    if (this.props.onChange) {
      this.props.onChange(this.convertToPercentage(x));
    }
  }

  @autobind
  onDragUpdate(_: any, { x }: { x: number }) {
    const n = clamp(this.convertToPercentage(x), 0, 1);

    if (this.props.onChange) {
      this.props.onChange(n);
    }
  }

  @autobind
  onDragEnd(_: any, { x }: { x: number }) {
    if (this.props.onChange) {
      this.props.onChange(this.convertToPercentage(x));
    }

    if (this.props.onChangeEnd) {
      this.props.onChangeEnd(this.convertToPercentage(x));
    }

    document.body.style.cursor = 'default';
  }

  convertToPercentage(x: number): number {
    return x / this.state.parentWidth;
  }
}

const SLIDER_STYLES = {
  base: {
    background: LIGHT_TERTIARY_TEXT_COLOR,
    height: `${BAR_HEIGHT}px`,
    position: 'relative',
    width: '100%',
  },
};

export interface ISliderProps extends React.HTMLProps<any> {
  style?: any;
}

export class Slider extends React.PureComponent<ISliderProps, void> {
  render() {
    const { children, style } = this.props;

    return (
      <div {...css(SLIDER_STYLES.base, style)}>
        {children}
      </div>
    );
  }
}
