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
import { CanvasTruncate, RejectIcon } from '../../components';
import { css, stylesheet } from '../../util';

import { ARTICLE_HEADLINE_TYPE, BUTTON_RESET, LIGHT_HIGHLIGHT_COLOR, WHITE_COLOR } from '../../styles';

const STYLES = stylesheet({
  container: {
    border: `2px solid ${WHITE_COLOR}`,
    borderRadius: '16px',
    width: '238px',
    height: '32px',
    boxSizing: 'border-box',
    padding: '6px 10px 6px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    ...ARTICLE_HEADLINE_TYPE,
    color: WHITE_COLOR,
    width: '184px',
  },

  closeButton: {
    ...BUTTON_RESET,
    cursor: 'pointer',
    ':focus': {
      outline: 0,
      background: LIGHT_HIGHLIGHT_COLOR,
    },
  },
});

export interface ISearchAttributeProps {
  title: string;
  onClose?(): any;
}

export class SearchAttribute extends React.PureComponent<ISearchAttributeProps> {
  render() {
    const { title, onClose } = this.props;

    return (
      <div {...css(STYLES.container)}>
        <div {...css(STYLES.title)}>
          <CanvasTruncate lines={1} text={title} fontStyles={STYLES.title} />
        </div>
        <button type="button" onClick={onClose} aria-label={`Remove search attribute ${title}`} {...css(STYLES.closeButton)}>
          <RejectIcon {...css({ color: WHITE_COLOR })} />
        </button>
      </div>
    );
  }
}
