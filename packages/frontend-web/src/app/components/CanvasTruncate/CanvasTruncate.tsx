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
import { fromJS, Map } from 'immutable';
import React from 'react';
import { ITypeStyle } from '../../styles';
import { getTextHeight, measureLine, wordWrap } from '../../util/measureText';
import { css } from '../../utilx';

const canvas = document.createElement('canvas');

function clampLines(text: string, width: number, fontStyles: ITypeStyle, lines: number): Array<string> {
  if (!width) { return []; }

  const wrappedLines = wordWrap(canvas, text, width, fontStyles);

  if (wrappedLines.length <= lines) { return wrappedLines; }

  const clampedLines = wrappedLines.slice(0, lines);
  let lastLine = clampedLines[clampedLines.length - 1];

  let lastLineLength = measureLine(canvas, lastLine + '...', fontStyles);
  let attempts = 3;

  while (lastLineLength > width && attempts--) {
    lastLine = lastLine.substring(0, lastLine.length - 1);
    lastLineLength = measureLine(canvas, lastLine + '...', fontStyles);
  }

  clampedLines[clampedLines.length - 1] = lastLine + '...';

  return clampedLines;
}

let cache = Map<any, Array<string>>();
function memoizedClampLines(text: string, width: number, fontStyles: ITypeStyle, lines: number): Array<string> {
  const params = fromJS({ text, width, fontStyles, lines });

  if (!cache.get(params)) {
    cache = cache.set(params, clampLines(text, width, fontStyles, lines));
  }

  return cache.get(params);
}

export interface ICanvasTruncateProps {
  text: string;
  lines: number;
  fontStyles: ITypeStyle;
  id?: string;
}

export interface ICanvasTruncateState {
  width: number;
}

export class CanvasTruncate extends React.PureComponent<ICanvasTruncateProps, ICanvasTruncateState> {
  elem: HTMLDivElement;

  state: ICanvasTruncateState = {
    width: 0,
  };

  componentDidMount() {
    window.addEventListener('resize', this.onResize);

    // Need to wait for Aphrodite styles to load
    setTimeout(() => this.onResize(), 60);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  @autobind
  onResize() {
    this.setState({
      width: this.elem ? this.elem.getBoundingClientRect().width : 0,
    });
  }

  @autobind
  saveElementRef(elem: HTMLDivElement) {
    this.elem = elem;
  }

  render() {
    const {
      text,
      lines,
      fontStyles,
      id,
    } = this.props;

    const { width } = this.state;

    let height;
    let output;

    if (width) {

      const clamped = memoizedClampLines(text, width, fontStyles, lines);
      height = getTextHeight(clamped, width, fontStyles);
      output = clamped.reduce((sum, line, i, fullArray) => {
        sum.push(<span aria-hidden="true">{line}</span>);

        if (i < fullArray.length - 1) {
          sum.push(<br />);
        }

        return sum;
      }, []);
    } else {
      height = 0;
      output = null;
    }

    return (
      <span
        id={id}
        aria-label={text}
        ref={this.saveElementRef}
        title={text}
        {...css({
          display: 'block',
          width: '100%',
          height: `${height}px`,
          overflow: 'hidden',
        })}
      >
        {output}
      </span>
    );
  }
}
