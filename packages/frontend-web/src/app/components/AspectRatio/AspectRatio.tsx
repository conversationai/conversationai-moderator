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
import { css } from '../../util';

export interface IAspectRatioProps extends React.HTMLProps<any> {
  ratio: number;
  contents: (width: number, height: number) => React.ReactNode;
}

export interface IAspectRatioState {
  width: number;
  height: number;
}

export class AspectRatio extends React.PureComponent<
  IAspectRatioProps, IAspectRatioState
> {
  state: IAspectRatioState = {
    width: null,
    height: null,
  };

  render() {
    const style = {
      width: `100%`,
      height: `${this.state.height}px`,
      position: 'relative',
    };

    return (
      <div {...css(style)}>
        {this.props.contents(this.state.width, this.state.height)}
      </div>
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
  private onResize() {
    const { width } = (ReactDOM.findDOMNode(this) as Element).getBoundingClientRect();

    this.setState({
      width,
      height: Math.ceil(width * (1 / this.props.ratio)),
    });
  }
}
