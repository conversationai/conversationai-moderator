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
  IconButton,
  Radio,
} from '@material-ui/core';
import {
  Delete,
} from '@material-ui/icons';

import { ITagModel } from '../../../../../models';
import {
  ARTICLE_CATEGORY_TYPE,
  DARK_TERTIARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  PALE_COLOR,
} from '../../../../styles';
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

  checkboxContainer: {
    width: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export interface ILabelSettingsProps {
  tag: ITagModel;
  onLabelChange(tag: ITagModel, value: string): any;
  onDescriptionChange(tag: ITagModel, value: string): any;
  onColorChange(tag: ITagModel, color: string): any;
  onDeletePress(tag: ITagModel): any;
  onTagChange(tag: ITagModel, key: string, value: boolean): any;
}

export class LabelSettings extends React.Component<ILabelSettingsProps> {
  @autobind
  onLabelChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    this.props.onLabelChange(this.props.tag, e.target.value);
  }

  @autobind
  onDescriptionChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();
    this.props.onDescriptionChange(this.props.tag, e.target.value);
  }

  @autobind
  onColorChange(color: string) {
    this.props.onColorChange(this.props.tag, color);
  }

  @autobind
  onTagIsInBatchViewChange(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();
    const { tag, onTagChange } = this.props;
    onTagChange(tag, 'isInBatchView', !tag.isInBatchView);
  }

  @autobind
  onTagIsTaggableChange(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();
    const { tag, onTagChange } = this.props;
    onTagChange(tag, 'isTaggable', !tag.isTaggable);
  }

  @autobind
  onTagInSummaryScoreChange(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();
    const { tag, onTagChange } = this.props;
    onTagChange(tag, 'inSummaryScore', !tag.inSummaryScore);
  }

  @autobind
  onDeletePress(e: React.MouseEvent<HTMLElement>) {
    e.preventDefault();
    this.props.onDeletePress(this.props.tag);
  }

  render() {
    const {
      tag,
      tag: {
        color,
        label,
        description,
      },
    } = this.props;

    return (
      <div {...css(STYLES.base)}>
        <div {...css(SETTINGS_STYLES.row)}>
          <input
            type="text"
            {...css(STYLES.labelColor, { backgroundColor: color })}
            value={label ? label : ''}
            onChange={this.onLabelChange}
          />
          <input
            type="text"
            {...css(STYLES.description)}
            value={description ? description : ''}
            onChange={this.onDescriptionChange}
          />
          <ColorSelect tag={label} color={color} onChange={this.onColorChange} />
          <div
            {...css(STYLES.checkboxContainer)}
            onClick={this.onTagIsInBatchViewChange}
          >
            <Radio color="primary" checked={tag.isInBatchView}/>
          </div>
          <div
            {...css(STYLES.checkboxContainer)}
            onClick={this.onTagIsTaggableChange}
          >
            <Radio color="primary" checked={tag.isTaggable}/>
          </div>
          <div
            {...css(STYLES.checkboxContainer)}
            onClick={this.onTagInSummaryScoreChange}
          >
            <Radio color="primary" checked={tag.inSummaryScore}/>
          </div>
          <div style={{paddingLeft: '50px'}}>
            <IconButton aria-label={`Delete Tag`} onClick={this.onDeletePress}>
              <Delete color="primary"/>
            </IconButton>
          </div>
        </div>
      </div>
    );
  }
}
