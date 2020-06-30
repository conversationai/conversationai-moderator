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
import { ARTICLE_CATEGORY_TYPE,
  BOX_DEFAULT_SPACING,
  DARK_PRIMARY_TEXT_COLOR,
  DARK_SECONDARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  HEADLINE_TYPE,
  NICE_MIDDLE_BLUE,
} from '../../../../styles';
import { css, stylesheet } from '../../../../utilx';

import {
  ApproveIcon,
  ArrowIcon,
  DeferIcon,
  HighlightIcon,
  KeyDownIcon,
  KeyUpIcon,
  RejectIcon,
} from '../../../../components';

const KEY = 'alt';

const STYLES = stylesheet({
  base: {
    color: DARK_PRIMARY_TEXT_COLOR,
    width: '100%',
    height: '100%',
    background: '#fff',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    ...HEADLINE_TYPE,
    marginTop: GUTTER_DEFAULT_SPACING,
    marginBottom: GUTTER_DEFAULT_SPACING,
  },

  closeButton: {
    border: 0,
    padding: `${BOX_DEFAULT_SPACING}px`,
    background: 'none',
    cursor: 'pointer',
  },

  shorcuts: {
    marginTop: GUTTER_DEFAULT_SPACING,
  },

  shorcut: {
    ...ARTICLE_CATEGORY_TYPE,
    display: 'flex',
    color: DARK_SECONDARY_TEXT_COLOR,
    fontSize: '16px',
    marginBottom: GUTTER_DEFAULT_SPACING,
  },

  name: {
    width: '200px',
    display: 'flex',
    alignItems: 'center',
  },

  nameText: {
    marginLeft: GUTTER_DEFAULT_SPACING,
  },

  keys: {
    display: 'flex',
  },

  key: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    marginRight: `${BOX_DEFAULT_SPACING}px`,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: DARK_SECONDARY_TEXT_COLOR,
  },
});

export interface IShortcutProps {
  onClose?(e: React.MouseEvent<any>): any;
}

export class Shortcuts extends React.Component<IShortcutProps> {
  render() {
    const {
      onClose,
    } = this.props;

    return (
      <div {...css(STYLES.base)}>
        <div {...css(STYLES.header)}>
          <h2 {...css(STYLES.title)}>Keyboard Shortcuts</h2>
          <button {...css(STYLES.closeButton)} aria-label="close modal" onClick={onClose}>
            <RejectIcon {...css({ color: DARK_SECONDARY_TEXT_COLOR })} />
          </button>
        </div>
        <div {...css(STYLES.shorcuts)}>
          <div {...css(STYLES.shorcut)}>
            <div {...css(STYLES.name)}>
              <ApproveIcon {...css({ color: NICE_MIDDLE_BLUE })} />
              <span {...css(STYLES.nameText)}>Approve</span>
            </div>
            <div {...css(STYLES.keys)}>
              <div {...css(STYLES.key)}>{KEY}</div>
              <div {...css(STYLES.key)}>A</div>
            </div>
          </div>
          <div {...css(STYLES.shorcut)}>
            <div {...css(STYLES.name)}>
              <HighlightIcon {...css({ color: NICE_MIDDLE_BLUE })} />
              <span {...css(STYLES.nameText)}>Highlight</span>
            </div>
            <div {...css(STYLES.keys)}>
              <div {...css(STYLES.key)}>{KEY}</div>
              <div {...css(STYLES.key)}>H</div>
            </div>
          </div>
          <div {...css(STYLES.shorcut)}>
            <div {...css(STYLES.name)}>
              <RejectIcon {...css({ color: NICE_MIDDLE_BLUE })} />
              <span {...css(STYLES.nameText)}>Reject</span>
            </div>
            <div {...css(STYLES.keys)}>
              <div {...css(STYLES.key)}>{KEY}</div>
              <div {...css(STYLES.key)}>R</div>
            </div>
          </div>
          <div {...css(STYLES.shorcut)}>
            <div {...css(STYLES.name)}>
              <DeferIcon {...css({ color: NICE_MIDDLE_BLUE })} />
              <span {...css(STYLES.nameText)}>Defer</span>
            </div>
            <div {...css(STYLES.keys)}>
              <div {...css(STYLES.key)}>{KEY}</div>
              <div {...css(STYLES.key)}>D</div>
            </div>
          </div>
          <div {...css(STYLES.shorcut)}>
            <div {...css(STYLES.name)}>
              <ArrowIcon
                {...css({
                  fill: DARK_SECONDARY_TEXT_COLOR,
                  transform: 'rotate(90deg)',
                }) }
                size={24}
              />
              <span {...css(STYLES.nameText)}>Previous</span>
            </div>
            <div {...css(STYLES.keys)}>
              <div {...css(STYLES.key)}>{KEY}</div>
              <div aria-label="Up arrow" {...css(STYLES.key)}>
                <KeyUpIcon {...css({ fill: DARK_SECONDARY_TEXT_COLOR })} />
              </div>
            </div>
          </div>
          <div {...css(STYLES.shorcut)}>
            <div {...css(STYLES.name)}>
              <ArrowIcon
                {...css({
                  fill: DARK_SECONDARY_TEXT_COLOR,
                  transform: 'rotate(-90deg)',
                })}
                size={24}
              />
              <span {...css(STYLES.nameText)}>Next</span>
            </div>
            <div {...css(STYLES.keys)}>
              <div {...css(STYLES.key)}>{KEY}</div>
              <div aria-label="Down arrow" {...css(STYLES.key)}>
                <KeyDownIcon {...css({ fill: DARK_SECONDARY_TEXT_COLOR })} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
