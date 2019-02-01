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
import { List } from 'immutable';
import React from 'react';
import {
  convertClientAction,
  convertServerAction,
  ICategoryModel,
  IPreselectModel,
  IRuleModel,
  IServerAction,
  ITaggingSensitivityModel,
  ITagModel,
} from '../../../../../models';
import { IModerationAction } from '../../../../../types';
import { ModerateButtons } from '../../../../components';
import {
  ARTICLE_CATEGORY_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  INPUT_DROP_SHADOW,
  MEDIUM_COLOR,
  OFFSCREEN,
  PALE_COLOR,
} from '../../../../styles';
import { maybeCallback, partial } from '../../../../util';
import { sortByLabel } from '../../../../util';
import { css, stylesheet } from '../../../../utilx';
import { SETTINGS_STYLES } from '../../settingsStyles';

const INPUT_HEIGHT = 36;
const STYLES = stylesheet({
  base: {
    ...ARTICLE_CATEGORY_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  selectContainer: {
    position: 'relative',
  },

  select: {
    width: 'auto',
    height: INPUT_HEIGHT,
    marginRight: GUTTER_DEFAULT_SPACING,
    paddingLeft: `${GUTTER_DEFAULT_SPACING / 2}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
    appearance: 'none',
    WebkitAppearance: 'none', // Not getting prefixed either
    border: 'none',
    borderRadius: 2,
    boxShadow: INPUT_DROP_SHADOW,
    backgroundColor: PALE_COLOR,
    fontSize: '16px',
  },

  input: {
    ...SETTINGS_STYLES.input,
    width: 84,
    height: INPUT_HEIGHT,
  },

  button: {
    position: 'absolute',
    right: GUTTER_DEFAULT_SPACING,
    height: INPUT_HEIGHT,
    marginLeft: 180,
    backgroundColor: 'transparent',
    border: 'none',
    color: MEDIUM_COLOR,
    cursor: 'pointer',
    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  deleteButton: {
    right: 0,
    marginLeft: 0,
  },
});

export interface IRuleRowProps {
  categories: List<ICategoryModel>;
  tags: List<ITagModel>;
  rangeBottom: number;
  rangeTop: number;
  selectedAction?: IServerAction;
  hasTagging?: boolean;
  onModerateButtonClick?(
    rule: IRuleModel,
    action: IServerAction,
  ): any;
  buttons?: JSX.Element;
  selectedCategory: string;
  selectedTag?: string;
  onDelete?(rule: IRuleModel | ITaggingSensitivityModel | IPreselectModel): any;
  onCategoryChange?(value: string): any;
  onTagChange?(value: string): any;
  onLowerThresholdChange?(value: number): any;
  onUpperThresholdChange?(value: number): any;
  rule: IRuleModel | ITaggingSensitivityModel | IPreselectModel;
}

export class RuleRow extends React.Component<IRuleRowProps> {

  @autobind
  onNumberFieldChange(callback: ((value: number) => any), e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    callback(parseInt(e.target.value, 10) / 100);
  }

  @autobind
  onCategoryFieldChange(callback: ((value: string) => any), e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault();
    callback(e.target.value);
  }

  @autobind
  notifyWrapperOfActionChange(action: IModerationAction) {
    const {
      onModerateButtonClick,
      rule,
    } = this.props;
    const saction = convertClientAction(action);

    if (onModerateButtonClick) {
      onModerateButtonClick(rule as IRuleModel, saction);
    }
  }
  render() {
    const {
      categories,
      tags,
      rangeBottom,
      rangeTop,
      hasTagging,
      selectedCategory,
      selectedTag,
      selectedAction,
      onCategoryChange,
      onTagChange,
      onLowerThresholdChange,
      onUpperThresholdChange,
      onDelete,
      rule,
    } = this.props;

    const sortedCategories = sortByLabel(categories);
    const sortedTags = sortByLabel(tags);

    return (
      <div {...css(STYLES.base, SETTINGS_STYLES.row)}>
        <div {...css(STYLES.selectContainer)}>
          <label {...css(OFFSCREEN)} htmlFor={`categories-${rule.id}`}>Select a section</label>
          <select
            {...css(STYLES.select)}
            id={`categories-${rule.id}`}
            name={`categories-${rule.id}`}
            value={selectedCategory ? selectedCategory : ''}
            onChange={partial(this.onCategoryFieldChange, maybeCallback(onCategoryChange))}
          >
            {sortedCategories && sortedCategories.map((category, i) => (
              <option value={category.id ? category.id.toString() : ''} key={i}>{category.label}</option>
            ))}
          </select>
          <span aria-hidden="true" {...css(SETTINGS_STYLES.arrow)} />
        </div>
        <div {...css(STYLES.selectContainer)}>
          <label {...css(OFFSCREEN)} htmlFor={`tags-${rule.id}`}>Select a tag</label>
          <select
            {...css(STYLES.select)}
            id={`tags-${rule.id}`}
            name={`tags-${rule.id}`}
            value={selectedTag ? selectedTag : ''}
            onChange={partial(this.onCategoryFieldChange, maybeCallback(onTagChange))}
          >
            {sortedTags && sortedTags.map((tag, i) => (
              <option value={tag.id ? tag.id.toString() : ''} key={i}>{tag.label}</option>
            ))}
          </select>
          <span aria-hidden="true" {...css(SETTINGS_STYLES.arrow)} />
        </div>
        <label {...css(OFFSCREEN)} htmlFor={`rangeBottom-${rule.id}`}>Bottom of range</label>
        <input
          {...css(STYLES.input, {marginRight: 10})}
          type="number"
          min="0"
          max="100"
          id={`rangeBottom-${rule.id}`}
          value={rangeBottom ? rangeBottom.toString() : '0'}
          onChange={partial(this.onNumberFieldChange, maybeCallback(onLowerThresholdChange))}
        />
        <label {...css(OFFSCREEN)} htmlFor={`rangeTop-${rule.id}`}>Top of range</label>
        <span {...css({fontSize: 14})}>–</span>
        <input
          {...css(STYLES.input, {marginLeft: 10})}
          type="number"
          min="0"
          max="100"
          id={`rangeTop-${rule.id}`}
          value={rangeTop ? rangeTop.toString() : ''}
          onChange={partial(this.onNumberFieldChange, maybeCallback(onUpperThresholdChange))}
        />
          { hasTagging && (
            <ModerateButtons
              darkOnLight
              hideLabel
              activeButtons={List<IModerationAction>().push(convertServerAction(selectedAction))}
              containerSize={36}
              onClick={this.notifyWrapperOfActionChange}
            />
          )}
        <button
          {...css(STYLES.button, STYLES.deleteButton)}
          type="button"
          onClick={partial(maybeCallback(onDelete), rule)}
        >
          Delete
        </button>
      </div>
    );
  }
}
