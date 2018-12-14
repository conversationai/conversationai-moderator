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
  ARTICLE_CATEGORY_TYPE,
  ARTICLE_HEADLINE_TYPE,
  BUTTON_LINK_TYPE,
  BUTTON_RESET,
  DARK_LINK_TEXT_COLOR,
  MODAL_DROP_SHADOW,
} from '../../styles';
import { css, stylesheet } from '../../utilx';

const STYLES = stylesheet({
  base: {
    ...ARTICLE_CATEGORY_TYPE,
    backgroundColor: 'white',
    width: 230,
    height: 230,
    borderRadius: 115,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: MODAL_DROP_SHADOW,
  },

  comments: {
    ...ARTICLE_HEADLINE_TYPE,
    textAlign: 'center',
    marginBottom: 29,
  },

  button: {
    ...BUTTON_RESET,
    ...BUTTON_LINK_TYPE,
    color: DARK_LINK_TEXT_COLOR,
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
});

export interface IToastMessageProps extends React.Props<any> {
  buttonLabel?: string;
  onClick?(e: React.MouseEvent<any>): any;
  icon?: JSX.Element;
}

export class ToastMessage extends React.PureComponent<IToastMessageProps> {
  render() {
    const {
      buttonLabel,
      onClick,
      icon,
      children,
    } = this.props;

    return (
      <div {...css(STYLES.base)}>
        <div id="dialog-title" {...css(STYLES.comments)}>{children}</div>
        {buttonLabel ? (
          <button
            {...css(STYLES.button)}
            onClick={onClick}
          >
            {buttonLabel}
          </button>
          ) : (
            <div>{icon}</div>
          )
        }
      </div>
    );
  }
}
