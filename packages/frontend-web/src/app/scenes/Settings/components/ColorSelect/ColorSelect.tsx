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
  INPUT_DROP_SHADOW,
  OFFSCREEN,
  PALE_COLOR,
} from '../../../../styles';
import { css, stylesheet } from '../../../../utilx';

const STYLES = stylesheet({
  colorBoxContainer: {
    position: 'relative',
    boxShadow:  INPUT_DROP_SHADOW,
    marginRight: '42px',
    width: '200px',
  },
  selectBox: {
    height: '42px',
    width: '100%',
    appearance: 'none',
    WebkitAppearance: 'none', // Not getting prefixed either
    paddingLeft: '42px',
    border: 'none',
    backgroundColor: PALE_COLOR,
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  colorBox: {
    width: '24px',
    height: '24px',
    position: 'absolute',
    left: 9,
    top: 9,
  },
});

export interface IColorSelectProps {
  color: string;
  tag: string;
  onChange(color: string): any;
}

export class ColorSelect extends React.Component<IColorSelectProps> {
  @autobind
  onChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.preventDefault();

    this.props.onChange(e.target.value);
  }

  render() {
    const {
      color,
      tag,
    } = this.props;

    return (
      <div {...css(STYLES.colorBoxContainer)}>
        <label {...css(OFFSCREEN)} htmlFor={tag}>Choose a color for {tag}</label>
        <input
          type="text"
          {...css(STYLES.selectBox)}
          id={tag}
          name={tag}
          value={color}
          onChange={this.onChange}
        />
        <span {...css(STYLES.colorBox, { backgroundColor: color })}/>
      </div>
    );
  }
}
