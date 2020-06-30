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
  BASE_Z_INDEX,
  LIGHT_COLOR,
  NICE_MIDDLE_BLUE,
} from '../../styles';
import { css, stylesheet } from '../../utilx';
import { DotChartRenderer, ICommentsByColumn, IRange } from '../../util';
export const ICON_SIZE = 24;

const STYLES = stylesheet({
  base: {
    display: 'inline-block',
    position: 'relative',
  },

  ruleBlock: {
    background: LIGHT_COLOR,
    borderLeft: `1px solid ${NICE_MIDDLE_BLUE}`,
    borderRight: `1px solid ${NICE_MIDDLE_BLUE}`,
    height: '100%',
    position: 'absolute',
    top: 0,

    ':hover': {
      zIndex: BASE_Z_INDEX,
    },
  },

  icon: {
    background: LIGHT_COLOR,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: NICE_MIDDLE_BLUE,
    borderRadius: '50%',
    display: 'block',
    height: `${ICON_SIZE}px`,
    left: '50%',
    margin: '0 auto',
    overflow: 'hidden',
    padding: '2px',
    position: 'absolute',
    top: 0,
    transform: 'translate(-50%, -50%)',
    width: `${ICON_SIZE}px`,
  },
});

export interface IAppliedRule {
  rule: string;
  start: number;
  end: number;
  icon: JSX.Element;
}

export interface IDotChartProps {
  appliedRules?: Array<IAppliedRule>;
  columnCount?: number;
  commentsByColumn: ICommentsByColumn;
  selectedRange?: IRange;
  width: number;
  height: number;
}

export interface IDotChartState {
  showAll?: boolean;
}

export class DotChart extends React.PureComponent<IDotChartProps, IDotChartState> {
  canvasRender: DotChartRenderer;

  state = {
    showAll: false,
  };

  constructor(props: IDotChartProps) {
    super(props);

    this.canvasRender = new DotChartRenderer(
      (width, height) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        return canvas;
      },
    );
  }

  @autobind
  toggleShowAll() {
    this.setState({ showAll: !this.state.showAll });
  }

  @autobind
  saveCanvasRef(canvas: HTMLCanvasElement) {
    if (canvas) {
      this.canvasRender.setProps({ canvas });
    }
  }

  render() {
    const {
      selectedRange,
      appliedRules,
      width,
    } = this.props;

    this.canvasRender.setProps({
      selectedRangeStart: selectedRange ? selectedRange.start : undefined,
      selectedRangeEnd: selectedRange ? selectedRange.end : undefined,
      ...this.props,
      ...this.state,
    });

    return (
      <div
        {...css(STYLES.base)}
        onDoubleClick={this.toggleShowAll}
      >
        <canvas ref={this.saveCanvasRef} />

        {appliedRules && appliedRules.map((rule, i) => (
          <div
            key={i}
            {...css(STYLES.ruleBlock, {
              left: width * rule.start,
              right: width - (width * rule.end),
            })}
          >
            <span {...css(STYLES.icon)}>
              {rule.icon}
            </span>
          </div>
        ))}
      </div>
    );
  }
}
