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
import keyboardJS from 'keyboardjs';
import React from 'react';
const FocusTrap = require('focus-trap-react');
import { ICommentScoreModel, ITagModel } from '../../../../../models';
import {
  GREY_COLOR,
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  LIGHT_SECONDARY_TEXT_COLOR,
  MEDIUM_COLOR,
  OFFSCREEN,
  TOOLTIP_Z_INDEX,
  VISUALLY_HIDDEN,
  WHITE_COLOR,
} from '../../../../styles';
import { css, identity, partial, stylesheet } from '../../../../util';
import {
  AddIcon,
} from '../../../Icons';
import { ToolTip } from '../../../ToolTip';

const ICON_SIZE = 24;

const STYLES = stylesheet({
  base: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: `${GUTTER_DEFAULT_SPACING / 2}px`,
    position: 'relative',
  },

  tagsContainer: {
    marginRight: 4,
  },

  tag: {
    borderRadius: 2,
    color: LIGHT_SECONDARY_TEXT_COLOR,
    fontSize: 14,
    marginLeft: 4,
    padding: 10,
  },

  button: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 2,
    cursor: 'pointer',
    marginBottom: 4,
    padding: 6,

    ':hover': {
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },

    ':focus': {
      outline: 0,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },
  },

  addButton: {
    ':hover': {
      backgroundColor: MEDIUM_COLOR,
    },

    ':focus': {
      backgroundColor: MEDIUM_COLOR,
      outline: 0,
    },
  },

  toolTipWithTagsContainer: {
    width: 250,
  },

  toolTipWithTagsUl: {
    listStyle: 'none',
    margin: 0,
    padding: `${GUTTER_DEFAULT_SPACING}px 0`,
  },

  toolTipWithTagsButton: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 0,
    color: MEDIUM_COLOR,
    cursor: 'pointer',
    padding: '8px 20px',
    textAlign: 'left',
    width: '100%',

    ':hover': {
      backgroundColor: MEDIUM_COLOR,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },

    ':focus': {
      backgroundColor: MEDIUM_COLOR,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },
  },

  toolTipWithTagsTagAlreadySet: {
    color: GREY_COLOR,
  },

  offscreen: OFFSCREEN,
});

export interface ICommentTagsProps {
  scores: List<ICommentScoreModel>;
  availableTags?: List<ITagModel>;
  onClick?(tagId: string): Promise<any>;
  onCommentTagClick?(commentScore: ICommentScoreModel): void;
}

export interface ICommentTagsState {
  isTaggingToolTipMetaVisible?: boolean;
  taggingToolTipMetaPosition?: {
    top: number,
    left: number,
  };
  isMetaTagFocused?: boolean;
  isMetaTagHovered?: boolean;
}

export class CommentTags extends React.PureComponent<ICommentTagsProps, ICommentTagsState> {
  taggingTooltip: HTMLElement;
  taggingTooltipButton: HTMLButtonElement;

  state: ICommentTagsState = {
    isTaggingToolTipMetaVisible: false,
    taggingToolTipMetaPosition: {
      top: 0,
      left: 0,
    },
    isMetaTagFocused: false,
    isMetaTagHovered: false,
  };

  @autobind
  saveTaggingTooltipButtonRef(ref: HTMLButtonElement) {
    this.taggingTooltipButton = ref;
  }

  @autobind
  saveTaggingTooltipRef(ref: HTMLDivElement) {
    this.taggingTooltip = ref;
  }

  render() {
    const {
      availableTags,
      scores,
      onCommentTagClick,
    } = this.props;

    const {
      isTaggingToolTipMetaVisible,
      taggingToolTipMetaPosition,
      isMetaTagHovered,
      isMetaTagFocused,
    } = this.state;

    return (
      <div {...css(STYLES.base)}>
        <div {...css(STYLES.tagsContainer)}>
          <h4 {...css(STYLES.offscreen)}>Assigned tags</h4>
          <p {...css(STYLES.offscreen)}>Click to remove.</p>

          { scores && scores.map((s, i) => {
            if (!s.tagId || s.annotationEnd || (s.sourceType === 'Machine' && !s.isConfirmed)) {
              return;
            }

            const tag = availableTags.find((t) => (t.get('id') === s.tagId));

            return tag && (
              <button
                key={`${tag.label}-${i}`}
                {...css(
                  STYLES.button,
                  STYLES.tag,
                  { backgroundColor: tag.color },
                )}
                onClick={partial(onCommentTagClick, s)}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
        <button
          aria-label="Add tag to comment"
          ref={this.saveTaggingTooltipButtonRef}
          onMouseEnter={this.onMetaTagMouseEnter}
          onMouseLeave={this.onMetaTagMouseLeave}
          onFocus={this.onMetaTagFocus}
          onBlur={this.onMetaTagBlur}
          {...css(STYLES.button, STYLES.addButton)}
          onClick={this.toggleTaggingToolTip}
        >
          <span {...css(VISUALLY_HIDDEN)}>Add a comment wide tag</span>
          <AddIcon
            {...css({
              fill: isMetaTagHovered || isMetaTagFocused
                  ? LIGHT_PRIMARY_TEXT_COLOR
                  : MEDIUM_COLOR,
            })}
            size={ICON_SIZE}
          />
        </button>
        {isTaggingToolTipMetaVisible && (
          <ToolTip
            arrowPosition="topCenter"
            backgroundColor={WHITE_COLOR}
            hasDropShadow
            isVisible={isTaggingToolTipMetaVisible}
            onDeactivate={this.toggleTaggingToolTip}
            position={taggingToolTipMetaPosition}
            size={16}
            width={250}
            zIndex={TOOLTIP_Z_INDEX}
          >
            <FocusTrap
              focusTrapOptions={{
                clickOutsideDeactivates: true,
                returnFocusOnDeactivate: false,
              }}
            >
              <div {...css(STYLES.toolTipWithTagsContainer)} ref={this.saveTaggingTooltipRef}>
                <h4 {...css(STYLES.offscreen)}>Available tags</h4>
                <ul {...css(STYLES.toolTipWithTagsUl)}>
                { availableTags && availableTags.map((t, i) => {
                  const tagAlreadySet = scores && scores.find((s) => (s.tagId === t.id && s.sourceType === 'Moderator'));

                  return (
                    <li>
                      <button
                        onClick={tagAlreadySet ? identity : partial(this.tagComment, t.id)}
                        key={`tag-${i}`}
                        {...css(
                          STYLES.toolTipWithTagsButton,
                          tagAlreadySet && STYLES.toolTipWithTagsTagAlreadySet,
                        )}
                      >
                        {t.label}
                      </button>
                    </li>
                  );
                })}
                </ul>
              </div>
            </FocusTrap>
          </ToolTip>
        )}
      </div>
    );
  }

  @autobind
  calculateTaggingTriggerPosition(ref?: HTMLElement) {
    if (!ref) {
      return;
    }

    const buttonRect = ref.getBoundingClientRect();

    this.setState({
      taggingToolTipMetaPosition: {
        top: buttonRect.height,
        left: (ref.parentNode as HTMLElement).offsetWidth - buttonRect.width / 2,
      },
    });
  }

  @autobind
  onPressEscape() {
    this.closeTaggingTooltip();
  }

  componentDidMount() {
    keyboardJS.bind('escape', this.onPressEscape);
    this.calculateTaggingTriggerPosition(this.taggingTooltipButton);
    window.addEventListener('click', this.checkTaggingTooltipStatus);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.onPressEscape);
    window.removeEventListener('click', this.checkTaggingTooltipStatus);
  }

  @autobind
  toggleTaggingToolTip() {
    if (!this.state.isTaggingToolTipMetaVisible) {
      this.openTaggingTooltip();
    } else {
      this.closeTaggingTooltip();
    }
  }

  @autobind
  openTaggingTooltip() {
    this.calculateTaggingTriggerPosition(this.taggingTooltipButton);
    this.setState({
      isTaggingToolTipMetaVisible: true,
    });
  }

  @autobind
  closeTaggingTooltip() {
    this.setState({
      isTaggingToolTipMetaVisible: false,
    });
  }

  @autobind
  checkTaggingTooltipStatus(e: Event) {
    if (!this.state.isTaggingToolTipMetaVisible) { return; }

    const target = e.target as HTMLElement;

    if (!this.taggingTooltip.contains(target) && !this.taggingTooltipButton.contains(target) && this.taggingTooltipButton !== target) {
      this.closeTaggingTooltip();
    }
  }

  @autobind
  tagComment(id: string): void {
    this.props.onClick(id);
    this.closeTaggingTooltip();
  }

  @autobind
  onMetaTagMouseEnter() {
    this.setState({ isMetaTagHovered: true });
  }

  @autobind
  onMetaTagMouseLeave() {
    this.setState({ isMetaTagHovered: false });
  }

  @autobind
  onMetaTagFocus() {
    this.setState({ isMetaTagFocused: true });
  }

  @autobind
  onMetaTagBlur() {
    this.setState({ isMetaTagFocused: false });
  }
}
