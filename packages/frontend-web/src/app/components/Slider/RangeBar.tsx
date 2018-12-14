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
import ReactDOM from 'react-dom';
import {
  LIGHT_PRIMARY_TEXT_COLOR,
} from '../../styles';
import { css, stylesheet } from '../../utilx';

const BAR_HEIGHT = 6;

const STYLES = stylesheet({
  base: {
    background: LIGHT_PRIMARY_TEXT_COLOR,
    height: `${BAR_HEIGHT}px`,
    position: 'absolute',
    width: '100%',
  },
});

export interface IRange {
  start: number;
  end: number;
}

export interface IRangeBarProps extends React.HTMLProps<any> {
  selectedRange?: IRange;
}

export interface IRangeBarState {
  parentWidth: number;
}

export class RangeBar extends
    React.PureComponent<IRangeBarProps, IRangeBarState> {
  state: IRangeBarState = {
    parentWidth: null,
  };

  render() {
    const { selectedRange } = this.props;
    const { parentWidth } = this.state;
    const positionX = selectedRange.start * parentWidth;
    const width = (selectedRange.end * parentWidth) - positionX;

    return (
      <div
        {...css(STYLES.base, {
          transform: `translateX(${positionX}px)`,
          width,
        })}
      />
    );
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
    const node = ReactDOM.findDOMNode(this) as HTMLElement;
    const parent = node.offsetParent;
    const { width } = parent.getBoundingClientRect();

    this.setState({ parentWidth: width });
  }
}
