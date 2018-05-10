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

import React from 'react';
import {
  SCRIM_Z_INDEX,
} from '../../styles';
import { css, stylesheet } from '../../util';

const STYLES = stylesheet({
  background: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: SCRIM_Z_INDEX,
  },

  children: {
    display: 'inline-block',
    zIndex: SCRIM_Z_INDEX + 1,
  },
});

export interface IScrimProps extends React.HTMLProps<any> {
  isVisible?: boolean;
  onBackgroundClick?(e: React.MouseEvent<any>): any;
  scrimStyles?: object;
  wrapperStyles?: object;
}

export class Scrim extends React.PureComponent<IScrimProps> {
  render() {
    const {
      isVisible,
      onBackgroundClick,
      children,
      scrimStyles,
      wrapperStyles,
    } = this.props;

    return (
      <div {...css(STYLES.background, scrimStyles, !isVisible && { display: 'none' })}>
        <div
          {...css(STYLES.background)}
          onClick={onBackgroundClick}
        />
        <div {...css(STYLES.children, wrapperStyles)}>
          {isVisible && children}
        </div>
      </div>
    );
  }
}
