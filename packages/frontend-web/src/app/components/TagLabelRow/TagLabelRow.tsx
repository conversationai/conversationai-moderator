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
import { ITagModel } from '../../../models';
import { EyeIcon, Link } from '../../components';
import {
  ARTICLE_CATEGORY_TYPE,
  DARK_COLOR,
  DIVIDER_COLOR,
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  LIGHT_SECONDARY_TEXT_COLOR,
  LIGHT_TERTIARY_TEXT_COLOR,
} from '../../styles';
import { css, stylesheet } from '../../util';

const STYLES = stylesheet({
  link: {
    display: 'block',
    background: 'transparent',
    border: 0,
    width: '100%',
    padding: 0,
  },

  row: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '0px',
    cursor: 'pointer',
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING * 8}px`,
    ':focus': {
      outline: 0,
    },
  },

  selectedIcon: {
    width: '24px',
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
  },

  disabled: {
    background: DIVIDER_COLOR,
    cursor: 'default',
  },

  labelContainer: {
    flex: 1,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
  },

  label: {
    ...ARTICLE_CATEGORY_TYPE,
    display: 'block',
    color: LIGHT_PRIMARY_TEXT_COLOR,
    fontSize: '16px',
  },

  description: {
    ...ARTICLE_CATEGORY_TYPE,
    display: 'block',
    color: LIGHT_TERTIARY_TEXT_COLOR,
  },

  image: {
    verticalAlign: 'bottom',
  },

  dotChart: {
    paddingTop: '30px',
  },
});

export interface ITagLabelRowProps {
  tag: ITagModel;
  linkURL?: string;
  isSelected?: boolean;
  background?: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
}

export interface ITagLabelRowState {
  isHovered?: boolean;
}

export class TagLabelRow
  extends React.PureComponent<ITagLabelRowProps, ITagLabelRowState> {

  state = {
    isHovered: false,
  };

  @autobind
  handleRowEnter() {
    this.setState({
      isHovered: true,
    });
  }

  @autobind
  handleRowLeave() {
    this.setState({
      isHovered: false,
    });
  }

  render() {
    const {
      tag,
      background,
      imagePath,
      imageWidth,
      imageHeight,
      isSelected,
      linkURL,
    } = this.props;
    const { isHovered } = this.state;

    let backgroundColor;
    if (isSelected) {
      backgroundColor = DARK_COLOR;
    } else {
      backgroundColor = isHovered ? DARK_COLOR : background;
    }

    return (
      <Link
        {...css(STYLES.link)}
        to={`${linkURL}/${tag.key}`}
        key={tag.key}
        onMouseEnter={this.handleRowEnter}
        onMouseLeave={this.handleRowLeave}
        onFocus={this.handleRowEnter}
        onBlur={this.handleRowLeave}
        tabIndex={0}
      >
        <span
          {...css(STYLES.row, { backgroundColor })}
        >
          <span {...css(STYLES.selectedIcon)}>
            {isSelected && <EyeIcon {...css({fill: LIGHT_SECONDARY_TEXT_COLOR})}/>}
          </span>
          <div {...css(STYLES.labelContainer)}>
            <span {...css(STYLES.label)}>{tag.label}</span>
            {<span {...css(STYLES.description)}>{(isSelected || isHovered) && tag.description}</span>}
          </div>
          <span {...css(STYLES.dotChart)}>
            <img
              width={imageWidth}
              height={imageHeight}
              {...css(STYLES.image)}
              src={imagePath}
              alt={`chart displaying scores by tag ${tag.label}`}
            />
          </span>
        </span>
      </Link>
    );
  }
}
