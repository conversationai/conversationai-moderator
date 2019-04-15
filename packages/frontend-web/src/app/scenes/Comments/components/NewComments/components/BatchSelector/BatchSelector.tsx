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
import formatDate from 'date-fns/format';
import { List } from 'immutable';
import { clamp } from 'lodash';
import React from 'react';

import { ICommentDatedModel, ICommentScoredModel, IRuleModel } from '../../../../../../../models';
import { DATE_FORMAT_LONG } from '../../../../../../config';
import { COLCOUNT } from '../../../../../../config';
import { css, stylesheet } from '../../../../../../utilx';
import { groupByDateColumns, groupByScoreColumns, IGroupedComments } from '../../../../../../util';

import {
  BASE_Z_INDEX,
  BOX_DEFAULT_SPACING,
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  NICE_MIDDLE_BLUE,
} from '../../../../../../styles';

import {
  AspectRatio,
  DotChart,
  DraggableHandle,
  RangeBar,
  RuleBars,
  Slider,
} from '../../../../../../components';

const ARROW_SIZE = 6;

const STYLES = stylesheet({
  batchControls: {
    position: 'relative',
    backgroundColor: NICE_MIDDLE_BLUE,
    padding: `8px ${GUTTER_DEFAULT_SPACING * 2}px`, // The overlapping height of the batch circle
  },

  select: {
    paddingRight: `${(ARROW_SIZE * 2) + (BOX_DEFAULT_SPACING * 2)}px`,
    position: 'relative',
    zIndex: BASE_Z_INDEX,
    color: LIGHT_PRIMARY_TEXT_COLOR,
  },

  arrow: {
    position: 'absolute',
    zIndex: BASE_Z_INDEX,
    right: 0,
    top: '8px',
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderTop: `${ARROW_SIZE}px solid ${LIGHT_PRIMARY_TEXT_COLOR}`,
    display: 'block',
    height: 0,
    width: 0,
    marginLeft: `${BOX_DEFAULT_SPACING}px`,
    marginRight: `${BOX_DEFAULT_SPACING}px`,
  },

  dropdown: {
    position: 'relative',
    width: 150,
    paddingLeft: GUTTER_DEFAULT_SPACING,
  },

  slider: {
    paddingTop: `${GUTTER_DEFAULT_SPACING * 2}px`,
  },
});

export interface IBatchSelectorProps {
  defaultSelectionPosition1: number;
  defaultSelectionPosition2: number;
  automatedRuleToast?(rule: IRuleModel): void;
  commentScores: List<ICommentScoredModel | ICommentDatedModel>;
  groupBy: 'date' | 'score';
  rules?: Array<IRuleModel>;
  onSelectionChange?(selectedComments: Array<number>, pos1: number, pos2: number): void;
  onSelectionChangeEnd?(selectedComments: Array<number>, pos1: number, pos2: number): void;
  areAutomatedRulesApplied?: boolean;
}

export interface IBatchSelectorState {
  selectionPosition1?: number;
  selectionPosition2?: number;
  min?: number;
  max?: number;
}

export class BatchSelector
    extends React.Component<IBatchSelectorProps, IBatchSelectorState> {

  groupedByColumn: IGroupedComments;

  state: IBatchSelectorState = {
    selectionPosition1: this.props.defaultSelectionPosition1,
    selectionPosition2: this.props.defaultSelectionPosition2,
    min: Math.min(this.props.defaultSelectionPosition1, this.props.defaultSelectionPosition2),
    max: Math.max(this.props.defaultSelectionPosition1, this.props.defaultSelectionPosition2),
  };

  componentWillUpdate(nextProps: IBatchSelectorProps) {
    if (!this.groupedByColumn || !this.props.commentScores.equals(nextProps.commentScores)) {
      if (this.props.groupBy === 'score') {
        this.groupedByColumn = groupByScoreColumns<ICommentScoredModel>(nextProps.commentScores.toArray() as Array<ICommentScoredModel>, COLCOUNT);
      } else {
        this.groupedByColumn = groupByDateColumns<ICommentDatedModel>(nextProps.commentScores.toArray() as Array<ICommentDatedModel>, COLCOUNT);
      }

      this.onDataChange(this.state.selectionPosition1, this.state.selectionPosition2);
      this.onDataChangeEnd(this.state.selectionPosition1, this.state.selectionPosition2);
    }

    if (this.props.defaultSelectionPosition1 !== nextProps.defaultSelectionPosition1 ||
        this.props.defaultSelectionPosition2 !== nextProps.defaultSelectionPosition2) {
      this.setState({
        selectionPosition1: nextProps.defaultSelectionPosition1,
        selectionPosition2: nextProps.defaultSelectionPosition2,
        min: Math.min(nextProps.defaultSelectionPosition1, nextProps.defaultSelectionPosition2),
        max: Math.max(nextProps.defaultSelectionPosition1, nextProps.defaultSelectionPosition2),
      });
    }
  }

  render() {
    const {
      selectionPosition1,
      selectionPosition2,
      min,
      max,
    } = this.state;

    const {
      rules,
      automatedRuleToast,
      areAutomatedRulesApplied,
    } = this.props;

    return (
      <div {...css(STYLES.batchControls)}>
        <div {...css({position: 'relative'})}>
          <AspectRatio
            ratio={5 / 1}
            contents={(width: number, height: number) => (
              <DotChart
                height={height}
                width={width}
                commentsByColumn={this.groupedByColumn}
                columnCount={COLCOUNT}
                selectedRange={{
                  start: min,
                  end: max,
                }}
              />
            )}
          />
          {rules && rules.length > 0 && areAutomatedRulesApplied && (
            <RuleBars
              rules={rules}
              automatedRuleToast={automatedRuleToast}
            />
          )}
        </div>

        <div {...css(STYLES.slider)}>
          <Slider>
            <RangeBar
              selectedRange={{
                start: min,
                end: max,
              }}
            />
            <DraggableHandle
              label={this.convertPositionToLabel(min)}
              position={selectionPosition1}
              onChange={this.onHandle1Change}
              onChangeEnd={this.onHandle1ChangeEnd}
            />
            <DraggableHandle
              label={this.convertPositionToLabel(max)}
              position={selectionPosition2}
              onChange={this.onHandle2Change}
              onChangeEnd={this.onHandle2ChangeEnd}
              positionOnRight
            />
          </Slider>
        </div>
      </div>
    );
  }

  private getSelectedComments(selectionPosition1: number, selectionPosition2: number): Array<number> {
    const min = Math.min(selectionPosition1, selectionPosition2);
    const max = Math.max(selectionPosition1, selectionPosition2);
    const selectedRange = {
      start: min,
      end: max,
    };

    const columnKeys = Object.keys(this.groupedByColumn).sort();

    return columnKeys.reduce((sum, key, i) => {
      const colPercent = i / columnKeys.length;
      const isSelected = selectedRange &&
        (colPercent >= selectedRange.start && colPercent < selectedRange.end);

      if (isSelected) {
        sum = sum.concat(this.groupedByColumn[key]);
      }

      return sum;
    }, [] as Array<number>);
  }

  @autobind
  onHandle1Change(num: number) {
    const clampedNum = parseFloat(num.toFixed(2));

    this.setState({
      min: Math.min(clampedNum, this.state.selectionPosition2),
      max: Math.max(clampedNum, this.state.selectionPosition2),
    });
    this.onDataChange(clampedNum, this.state.selectionPosition2);
  }

  @autobind
  onHandle2Change(num: number) {
    const clampedNum = parseFloat(num.toFixed(2));

    this.setState({
      min: Math.min(this.state.selectionPosition1, clampedNum),
      max: Math.max(this.state.selectionPosition1, clampedNum),
    });
    this.onDataChange(this.state.selectionPosition1, clampedNum);
  }

  @autobind
  onHandle1ChangeEnd(num: number) {
    const clampedNum = parseFloat(num.toFixed(2));

    this.onDataChangeEnd(clampedNum, this.state.selectionPosition2);
  }

  @autobind
  onHandle2ChangeEnd(num: number) {
    const clampedNum = parseFloat(num.toFixed(2));

    this.onDataChangeEnd(this.state.selectionPosition1, clampedNum);
  }

  onDataChange(pos1: number, pos2: number): void {
    if (this.props.onSelectionChange) {
      this.props.onSelectionChange(
        this.getSelectedComments(pos1, pos2),
        pos1,
        pos2,
      );
    }
  }

  onDataChangeEnd(pos1: number, pos2: number): void {
    if (this.props.onSelectionChangeEnd) {
      this.props.onSelectionChangeEnd(
        this.getSelectedComments(pos1, pos2),
        pos1,
        pos2,
      );
    }
  }

  private convertPositionToLabel(x: number) {
    if (this.props.groupBy === 'date') {
      if (!this.groupedByColumn) { return ''; }

      const columnKeys = Object.keys(this.groupedByColumn).sort();
      const startDate = parseFloat(columnKeys[0]);
      const endDate = parseFloat(columnKeys[columnKeys.length - 1]);
      const date = startDate + (endDate - startDate) * x;

      return formatDate(date, DATE_FORMAT_LONG);
    } else {
      const n = clamp(x, 0, 1);

      return `${Math.round((n) * 100)}%`;
    }
  }
}
