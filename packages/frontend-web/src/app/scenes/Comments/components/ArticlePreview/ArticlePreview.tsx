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
import { IArticleModel, IUserModel } from '../../../../../models';
import { ARTICLE_HEADER,
  BASE_Z_INDEX,
  BODY_TEXT_TYPE,
  BOX_DEFAULT_SPACING,
  BUTTON_RESET,
  DARK_COLOR,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  LABEL_CHECK,
  LIGHT_PRIMARY_TEXT_COLOR,
  LIGHT_SECONDARY_TEXT_COLOR,
  MEDIUM_COLOR,
  TEXT_OFFSET_DEFAULT_SPACING,
  VISUALLY_HIDDEN,
  WHITE_COLOR,
} from '../../../../styles';
import { css, stylesheet } from '../../../../utilx';

import {
  CloseIcon,
  OpenIcon,
} from '../../../../components';
import { abbreviateModerators } from '../../../../utilx';

const STYLES = stylesheet({
  base: {
    position: 'relative',
    maxWidth: 693,
    background: MEDIUM_COLOR,
    display: 'flex',
    zIndex: BASE_Z_INDEX,
  },

  bar: {
    alignItems: 'center',
    background: DARK_COLOR,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    height: `${HEADER_HEIGHT}px`,
  },

  main: {
    flex: 1,
    width: '100%',
    ':focus': {
      outline: 0,
    },
  },

  open: {
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
  },

  externalLink: {
    paddingBottom: '4px',
    borderBottom: `2px solid transparent`,
    ':focus': {
      outline: 0,
      borderBottom: `2px solid ${WHITE_COLOR}`,
    },
  },

  closeButton: {
    padding: 0,
    border: 0,
    background: 'none',
    cursor: 'pointer',
    width: '80px',
    height: '80px',
  },

  title: {
    whiteSpace: 'normal',
    width: 'auto',
  },

  body: {
    color: LIGHT_PRIMARY_TEXT_COLOR,
    paddingLeft: `${TEXT_OFFSET_DEFAULT_SPACING}px`,
    paddingRight: `${TEXT_OFFSET_DEFAULT_SPACING}px`,
  },

  bodyCopy: {
    ...BODY_TEXT_TYPE,
    wordWrap: 'break-word',
  },

  moderation: {
    display: 'flex',
    alignItems: 'center',
  },

  moderateButton: {
    ...BUTTON_RESET,
    paddingRight: `${BOX_DEFAULT_SPACING}px`,
    paddingLeft: `${BOX_DEFAULT_SPACING}px`,
    color: LIGHT_SECONDARY_TEXT_COLOR,
    marginRight: `${BOX_DEFAULT_SPACING}px`,
    cursor: 'pointer',
    borderBottom: `2px solid transparent`,
    ':focus': {
      outline: 0,
      borderBottom: `2px solid ${WHITE_COLOR}`,
    },
  },

  moderators: {
    display: 'flex',
    alignItems: 'center',
    paddingRight: `${BOX_DEFAULT_SPACING}px`,
    color: LIGHT_PRIMARY_TEXT_COLOR,
  },

  center: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
    width: '100%',
    marginBottom: '30px',
  },

  checkbox: {
    marginLeft: 0,
    marginRight: `${BOX_DEFAULT_SPACING}px`,
    padding: '2px',
    position: 'relative',
  },

  backIcon: {
     fill: WHITE_COLOR,
     borderBottom: '2px solid transparent',
  },

  backButton: {
    ...BUTTON_RESET,
    padding: `${GUTTER_DEFAULT_SPACING}px`,
    cursor: 'pointer',
    ':focus': {
      outline: 0,
    },
  },

  buttonIsFocused: {
    borderBottom: `2px solid ${WHITE_COLOR}`,
  },

  ruleButton: {
    ...LABEL_CHECK,
    marginBottom: `${GUTTER_DEFAULT_SPACING * 2}px`,
    borderBottom: `2px solid transparent`,
    ':focus': {
      outline: 0,
      borderBottom: `2px solid ${WHITE_COLOR}`,
    },
  },

  headerMeta: {
    ...ARTICLE_HEADER.meta,
  },

  headerTitle: {
    ...ARTICLE_HEADER.title,
    borderBottom: `2px solid transparent`,
    flex: 1,
    ':focus': {
      outline: 0,
      borderBottom: `2px solid ${WHITE_COLOR}`,
    },
  },
});

export interface IArticlePreviewProps {
  article: IArticleModel;
  moderators?: List<IUserModel>;
  onClose(e: React.MouseEvent<any>): any;
  onAddModeratorClick(e: React.MouseEvent<any>): any;
  isCommentDetail?: boolean;
}

export interface IArticlePreviewState {
  closeIsFocused?: boolean;
}

export class ArticlePreview
    extends React.Component<IArticlePreviewProps, IArticlePreviewState> {

  state = {
    closeIsFocused: false,
  };

  @autobind
  onFocusCloseIcon() {
    this.setState({ closeIsFocused: true });
  }

  @autobind
  onBlurCloseIcon() {
    this.setState({ closeIsFocused: false });
  }

  render() {
    const {
      article,
      moderators,
      onClose,
      onAddModeratorClick,
    } = this.props;

    const { closeIsFocused } = this.state;

    const articleText = article.text ? article.text : '';
    return(
      <div>
        <div {...css(STYLES.base)}>
          <div {...css(STYLES.main)} tabIndex={0}>
            <div {...css(STYLES.bar, { background: MEDIUM_COLOR })}>
              <div {...css(STYLES.headerMeta, { width: '100%' })}>
                <button
                  type="button"
                  onClick={onClose}
                  {...css(STYLES.backButton)}
                  onFocus={this.onFocusCloseIcon}
                  onBlur={this.onBlurCloseIcon}
                >
                  <span {...css(VISUALLY_HIDDEN)}>Back to Article</span>
                  <CloseIcon
                    direction={'left'}
                    label={'Close article preview'}
                    {...css(STYLES.backIcon, closeIsFocused && STYLES.buttonIsFocused)}
                    size={24}
                  />
                </button>
                <h1 {...css(STYLES.headerTitle)}>
                  {article.title}
                </h1>

                <div {...css(STYLES.open)}>
                  <a
                    href={article.url}
                    target="_blank"
                    {...css(STYLES.externalLink)}
                    title="Open article in new window"
                  >
                    <OpenIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} size={22} />
                  </a>
                </div>
              </div>
            </div>

            <div {...css(STYLES.body)}>
              <div {...css(STYLES.bodyCopy)}>{articleText.substring(0, 400)}{articleText.length > 400 && <span>...</span>}</div>
              <div {...css(STYLES.moderation)}>
                <div {...css(STYLES.moderation)}>
                  <p {...css(STYLES.moderators)}>
                    {abbreviateModerators(moderators)}
                  </p>
                </div>

                <button
                  {...css(STYLES.moderateButton)}
                  onClick={onAddModeratorClick}
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
