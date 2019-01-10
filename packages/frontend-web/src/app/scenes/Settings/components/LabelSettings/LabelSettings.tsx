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
import { ITagModel } from '../../../../../models';
import { Checkbox } from '../../../../components';
import {
  ARTICLE_CATEGORY_TYPE,
  DARK_TERTIARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  PALE_COLOR,
} from '../../../../styles';
import { partial } from '../../../../util';
import { css, stylesheet } from '../../../../utilx';
import { SETTINGS_STYLES } from '../../settingsStyles';
import { ColorSelect } from '../ColorSelect';

const SMALLER_SCREEN = window.innerWidth < 1200;
const STYLES = stylesheet({
  base: {
    ...ARTICLE_CATEGORY_TYPE,
    color: DARK_TERTIARY_TEXT_COLOR,
  },

  labelColor: {
    ...SETTINGS_STYLES.input,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    width: SMALLER_SCREEN ? 180 : 200,
    padding: 10,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
    borderColor: 'transparent',
  },

  description: {
    ...SETTINGS_STYLES.input,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
    flex: 1,
    width: SMALLER_SCREEN ? 180 : 'auto',
    backgroundColor: PALE_COLOR,
    borderColor: 'transparent',
    paddingLeft: 10,
    height: 40,
  },

  deleteButton: {
    ...SETTINGS_STYLES.button,
    padding: '0 8px',
    right: 0,
  },

  checkboxContainer: {
    width: '100px',
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },

  checkContainer: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
});

export interface ILabelSettingsProps {
  tag: ITagModel;
  onLabelChange(tag: ITagModel, value: string): any;
  onDescriptionChange(tag: ITagModel, value: string): any;
  onColorChange(tag: ITagModel, color: string): any;
  onDeletePress(tag: ITagModel): any;
  onTagChange(tag: ITagModel, key: string, value: boolean, e?: React.ChangeEvent<HTMLInputElement>): any;
}

export class LabelSettings extends React.Component<ILabelSettingsProps> {
  @autobind
  onInputChange(
    callback: (tag: ITagModel, value?: string) => any,
    tag: ITagModel,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    e.preventDefault();

    callback(tag, e.target.value);
  }

  render() {
    const {
      tag,
      tag: {
        color,
        label,
        description,
      },
      onLabelChange,
      onDescriptionChange,
      onTagChange,
      onColorChange,
      onDeletePress,
    } = this.props;

    return (
      <div {...css(STYLES.base)}>
        <div {...css(SETTINGS_STYLES.row)}>
          <input
            type="text"
            {...css(STYLES.labelColor, { backgroundColor: color })}
            value={label ? label : ''}
            onChange={partial(this.onInputChange, onLabelChange, tag)}
          />
          <input
            type="text"
            {...css(STYLES.description)}
            value={description ? description : ''}
            onChange={partial(this.onInputChange, onDescriptionChange, tag)}
          />
          <ColorSelect tag={label} color={color} onChange={partial(onColorChange, tag)} />
          <div {...css(STYLES.checkboxContainer)}>
            <label
              htmlFor={`${tag.key}isInBatchView`}
              onClick={partial(onTagChange, tag, 'isInBatchView', !tag.isInBatchView)}
              {...css(STYLES.checkContainer)}
            >
              <Checkbox isSelected={tag.isInBatchView} inputId={`${tag.key}isInBatchView`} onCheck={null} />
            </label>
          </div>
          <div {...css(STYLES.checkboxContainer)}>
            <label
              htmlFor={`${tag.key}isTaggable`}
              onClick={partial(onTagChange, tag, 'isTaggable', !tag.isTaggable)}
              {...css(STYLES.checkContainer)}
            >
              <Checkbox isSelected={tag.isTaggable} inputId={`${tag.key}isTaggable`} onCheck={null} />
            </label>
          </div>
          <div {...css(STYLES.checkboxContainer)}>
            <label
              htmlFor={`${tag.key}inSummaryScore`}
              onClick={partial(onTagChange, tag, 'inSummaryScore', !tag.inSummaryScore)}
              {...css(STYLES.checkContainer)}
            >
              <Checkbox isSelected={tag.inSummaryScore} inputId={`${tag.key}inSummaryScore`} onCheck={null} />
            </label>
          </div>
          <button {...css(STYLES.deleteButton, SMALLER_SCREEN && {marginLeft: 0})} type="button" onClick={partial(onDeletePress, tag)}>Delete</button>
        </div>
      </div>
    );
  }
}
