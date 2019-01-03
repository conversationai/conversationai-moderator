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
import FocusTrap from 'focus-trap-react';
import { List } from 'immutable';
import keyboardJS from 'keyboardjs';
import React from 'react';
import ReactDOM from 'react-dom';

import { ICommentScoreModel, ITagModel, IUserModel } from '../../../../../models';
import {
  ARTICLE_CAPTION_TYPE,
  GREY_COLOR,
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  LIGHT_SECONDARY_TEXT_COLOR,
  MEDIUM_COLOR,
  SCRIM_Z_INDEX,
  SEMI_BOLD_TYPE,
  WHITE_COLOR,
} from '../../../../styles';
import { css, partial, stylesheet } from '../../../../util';
import { ToolTip } from '../../../ToolTip';

const TOOLTIP_ARROW_SIZE = 16;

const STYLES = stylesheet({
  confirmBase: {
    ...SEMI_BOLD_TYPE,
  },

  confirmed: {
    borderColor: 'transparent',
  },

  removed: {},

  toolTipWithTagsContainer: {
    userSelect: 'none',
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
    ':focus': {
      outline: 0,
    },
    ':hover': {
      backgroundColor: MEDIUM_COLOR,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },
  },

  confirmContainer: {
    ...ARTICLE_CAPTION_TYPE,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    fontSize: 16,
    padding: `${GUTTER_DEFAULT_SPACING}px  ${GUTTER_DEFAULT_SPACING * 1.5}px`,
    textAlign: 'center',
    userSelect: 'none',
  },

  confirmTagWrapper: {
    marginBottom: 10,
    marginTop: 4,
  },

  confirmTag: {
    paddingBottom: 2,
    textTransform: 'capitalize',
  },

  confirmMeta: {
    color: LIGHT_SECONDARY_TEXT_COLOR,
    fontSize: 14,
    marginTop: 0,
    whiteSpace: 'nowrap',
  },

  confirmButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: LIGHT_PRIMARY_TEXT_COLOR,
    cursor: 'pointer',
    margin: '0 8px',
    padding: '6px 14px',

    ':hover': {
      textDecoration: 'underline',
    },

    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },
});

export interface IAnnotatedCommentTextProps {
  text: string;
  scores: List<ICommentScoreModel>;
  availableTags: List<ITagModel>;
  onClick?(tag: string, start: number, end: number): Promise<any>;
  onUpdateCommentScore?(commentScore: ICommentScoreModel): void;
  onConfirmCommentScore?(commentid: string, commentScoreId: string): void;
  onRejectCommentScore?(commentid: string, commentScoreId: string): void;
  onResetCommentScore?(commentid: string, commentScoreId: string): void;
  onDeleteCommentTag?(commentScoreId: string): void;
  onRemoveCommentScore?(commentScore: ICommentScoreModel): void;
  loadScores?(commentId: string): void;
  getUserById?(id: string): IUserModel;
  currentUser: IUserModel;
}

export interface IAnnotatedCommentTextState {
  isTaggingToolTipVisible?: boolean;
  taggingToolTipPosition?: {
    top: number,
    left: number,
  };
  isConfirmationToolTipVisible?: boolean;
  confirmationToolTipPosition?: {
    top: number,
    left: number,
  };
  confirmationToolTipColor?: string;
  confirmationTagType?: string;
  confirmationAuthor?: string;
  confirmationTarget?: JSX.Element;
  confirmationStatus?: string;
  confirmationSource?: string;
  confirmationScore?: ICommentScoreModel;
  taggifiedText?: any;
}

export class AnnotatedCommentText extends React.PureComponent<IAnnotatedCommentTextProps, IAnnotatedCommentTextState> {

  currentSelection = {
    start: 0,
    end: 0,
  };
  confirmationRef: HTMLElement = null;
  taggingRef: HTMLElement = null;

  state: IAnnotatedCommentTextState = {
    isTaggingToolTipVisible: false,
    taggingToolTipPosition: {
      top: 0,
      left: 0,
    },
    isConfirmationToolTipVisible: false,
    confirmationToolTipPosition: {
      top: 0,
      left: 0,
    },
    confirmationToolTipColor: MEDIUM_COLOR,
    confirmationTagType: 'other',
    confirmationAuthor: '',
    confirmationTarget: null,
    confirmationStatus: '',
    confirmationSource: '',
    confirmationScore: null,
    taggifiedText: null,
  };

  componentDidMount() {
    if (this.props.text && this.props.scores) {
      this.setState({
        taggifiedText: this.taggifyText(this.props.text, this.props.scores),
      });
    }
  }

  componentWillUpdate(nextProps: IAnnotatedCommentTextProps) {
    if (this.props.scores !== nextProps.scores || this.props.text !== nextProps.text) {
      this.setState({
        taggifiedText: this.taggifyText(nextProps.text, nextProps.scores),
      });
    }
  }

  componentWillMount() {
    keyboardJS.bind('escape', this.onPressEscape);
    window.addEventListener('mouseup', this.onGlobalClick);
    window.addEventListener('touchend', this.onGlobalClick);
    window.addEventListener('touchMove', this.onTouchMove);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.onPressEscape);
    window.removeEventListener('mouseup', this.onGlobalClick);
    window.removeEventListener('touchend', this.onGlobalClick);
  }

  render() {
    const {
      availableTags,
    } = this.props;

    const {
      isTaggingToolTipVisible,
      taggingToolTipPosition,
      isConfirmationToolTipVisible,
      confirmationToolTipPosition,
      confirmationToolTipColor,
      confirmationTagType,
      confirmationAuthor,
      confirmationStatus,
      confirmationSource,
      confirmationScore,
      taggifiedText,
    } = this.state;
    let confirmationToolTipContent;
    const confirmed = confirmationScore && confirmationScore.isConfirmed;
    if (confirmed !== null) {

      const actionString = confirmationSource !== 'Machine' &&
          confirmationStatus === 'confirmed' ? 'Tagged' : confirmationStatus;

      confirmationToolTipContent = (
        <div key="confirmationTooltipConfirmed">
          <p key="question" {...css(STYLES.confirmTagWrapper)}>
            <span {...css(STYLES.confirmTag)}>{confirmationTagType}</span>
          </p>
          <p key="text" {...css(STYLES.confirmMeta)}>
            <span>{actionString} by {confirmationAuthor}</span>
          </p>
          <button key="confirm-undo" {...css(STYLES.confirmButton)} onClick={this.undoTag}>
            Undo
          </button>
        </div>
      );
    } else {
      confirmationToolTipContent = (
        <div key="confirmationTooltip">
          <p key="question" {...css(STYLES.confirmTagWrapper)}>
            Is this "<span {...css(STYLES.confirmTag)}>{confirmationTagType}</span>"?
          </p>
          <p key="text" {...css(STYLES.confirmMeta)}>Flagged by {confirmationAuthor}</p>
          <button key="confirm-yes" {...css(STYLES.confirmButton)} onClick={this.confirmTag}>
            Yes
          </button>
          <button key="confirm-no" {...css(STYLES.confirmButton)} onClick={this.removeTag}>
            No
          </button>
        </div>
      );
    }

    return (
      <div>
        <div
          onMouseDown={this.onMouseDown}
          onTouchStart={this.onTouchStart}
        >
          {taggifiedText}
        </div>
        {isTaggingToolTipVisible && (
          <ToolTip
            key="tagging"
            arrowPosition="topCenter"
            backgroundColor={WHITE_COLOR}
            hasDropShadow
            isVisible={isTaggingToolTipVisible}
            position={taggingToolTipPosition}
            size={TOOLTIP_ARROW_SIZE}
            width={250}
            zIndex={SCRIM_Z_INDEX}
          >
            <FocusTrap>
              <div {...css(STYLES.toolTipWithTagsContainer)} ref={this.saveTaggingRef}>
                <ul {...css(STYLES.toolTipWithTagsUl)}>
                  {availableTags && availableTags.map((t, i) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={partial(this.tagText, t.id)}
                        key={`tag-${i}`}
                        {...css(STYLES.toolTipWithTagsButton)}
                      >
                        {t.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </FocusTrap>
          </ToolTip>
        )}
        {isConfirmationToolTipVisible && (
          <ToolTip
            key="focus"
            arrowPosition="bottomCenter"
            backgroundColor={confirmationToolTipColor}
            isVisible={isConfirmationToolTipVisible}
            position={confirmationToolTipPosition}
            size={TOOLTIP_ARROW_SIZE}
            width={250}
            zIndex={SCRIM_Z_INDEX}
          >
            <FocusTrap>
              <div {...css(STYLES.confirmContainer)} ref={this.saveConfirmationRef}>
                {confirmationToolTipContent}
              </div>
            </FocusTrap>
          </ToolTip>
        )}
      </div>
    );
  }

  @autobind
  saveConfirmationRef(el: HTMLElement) {
    this.confirmationRef = el;
  }

  @autobind
  saveTaggingRef(el: HTMLElement) {
    this.taggingRef = el;
  }

  @autobind
  onMouseDown() {
    window.removeEventListener('mouseup', this.onGlobalClick);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  @autobind
  onMouseUp() {
    this.handleSelection();
    window.removeEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mouseup', this.onGlobalClick);
  }

  @autobind
  onTouchStart() {
    window.removeEventListener('touchend', this.onGlobalClick);
    window.addEventListener('touchend', this.onTouchEnd);
  }

  @autobind
  onTouchMove() {
    window.removeEventListener('touchend', this.onGlobalClick);
  }

  @autobind
  onTouchEnd() {
    this.handleSelection();
    window.removeEventListener('touchend', this.onTouchEnd);
    window.addEventListener('touchend', this.onGlobalClick);
  }

  @autobind
  onPressEscape() {
    if (this.state.isTaggingToolTipVisible || this.state.isConfirmationToolTipVisible) {
      this.closeToolTips();
    }
  }

  @autobind
  onGlobalClick(e: any) {
    if (
      (!this.confirmationRef && !this.taggingRef) ||
      (this.confirmationRef && this.confirmationRef.contains(e.target)) ||
      (this.taggingRef && this.taggingRef.contains(e.target))
    ) {
      return;
    }
    if (this.state.isTaggingToolTipVisible || this.state.isConfirmationToolTipVisible) {
      // Needs a delay so the events can fire through
      setTimeout(() => this.closeToolTips(), 10);
    }
  }

  @autobind
  closeToolTips() {
    if (this.state.isTaggingToolTipVisible) {
      this.closeTaggingToolTip();
    }
    if (this.state.isConfirmationToolTipVisible) {
      this.closeConfirmationToolTip();
    }
    this.clearSelection();
  }

  @autobind
  closeTaggingToolTip() {
    this.setState({ isTaggingToolTipVisible: false });
    this.clearSelection();
    // TODO: reset focus element.
  }

  clearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      }
    }
  }

  @autobind
  toggleConfirmationToolTip(score: ICommentScoreModel, event: React.MouseEvent<HTMLSpanElement>) {
    const target: any = event.target;

    if (target === this.state.confirmationTarget || window.getSelection().toString().length !== 0) {
      this.closeConfirmationToolTip();

      return;
    }

    const top = target.offsetTop;
    const targetRect = target.getBoundingClientRect();
    const container = ReactDOM.findDOMNode(this).parentElement;
    const containerRect = container.getBoundingClientRect();
    const left = (targetRect.left - containerRect.left) + (targetRect.width / 2);

    this.setState({
      confirmationScore: score,
      confirmationTarget: target,
      confirmationAuthor: target.dataset.author,
      confirmationTagType: target.dataset.tag,
      confirmationStatus: target.dataset.status,
      confirmationSource: target.dataset.source,
      confirmationToolTipColor: target.dataset.color,
      confirmationToolTipPosition: { top, left },
      isConfirmationToolTipVisible: true,
    });
  }

  @autobind
  closeConfirmationToolTip() {
    this.setState({
      confirmationTarget: null,
      isConfirmationToolTipVisible: false,
    });
    // TODO: reset focus element.
  }

  @autobind
  handleSelection(): void {
    if (!window.getSelection) {
      this.closeTaggingToolTip();

      return;
    }

    const selection = window.getSelection();

    // Delay to make sure selection type is updated.
    setTimeout(() => {
      const selectionString = selection.toString();
      this.currentSelection.start = this.props.text.indexOf(selectionString);
      this.currentSelection.end = this.currentSelection.start + selectionString.length;
      if (this.currentSelection.start === this.currentSelection.end) {

        return;
      }
      this.positionToolTip(selection);
    }, 10);
  }

  @autobind
  positionToolTip(selection: Selection): void {
    // Get the union of all rects in range. Use this to calculate horizontal
    // center of the selection.
    const unionRect = selection.getRangeAt(0).getBoundingClientRect();

    // Compute top and left positions based on offsetParent.
    const container = ReactDOM.findDOMNode(this).parentElement;
    const containerRect = container.getBoundingClientRect();
    const top = unionRect.bottom - containerRect.top;
    const left = (unionRect.left - containerRect.left) + (unionRect.width / 2);

    this.setState({
      isTaggingToolTipVisible: true,
      taggingToolTipPosition: { top, left },
    });
  }

  @autobind
  async tagText(id: string) {
    await this.props.onClick(id, this.currentSelection.start, this.currentSelection.end);

    this.closeTaggingToolTip();

    if (this.props.loadScores && this.state.confirmationScore) {
      await this.props.loadScores(this.state.confirmationScore.commentId);
    }
  }

  @autobind
  async confirmTag() {
    if (this.props.onUpdateCommentScore) {
      await this.props.onUpdateCommentScore(this.state.confirmationScore.set('isConfirmed', true).set('confirmedUserId', this.props.currentUser.id));
    }
    if (this.props.onConfirmCommentScore) {
      await this.props.onConfirmCommentScore(this.state.confirmationScore.commentId, this.state.confirmationScore.id);
    }

    this.closeConfirmationToolTip();
  }

  @autobind
  async undoTag() {
    if (
      this.props.currentUser.name === this.state.confirmationAuthor &&
      this.state.confirmationSource !== 'Machine' &&
      this.props.onDeleteCommentTag && this.props.onRemoveCommentScore
    ) {
      this.props.onRemoveCommentScore(this.state.confirmationScore);
      await this.props.onDeleteCommentTag(this.state.confirmationScore.id);
      this.closeConfirmationToolTip();

      return;
    }

    if (this.props.onUpdateCommentScore) {
      await this.props.onUpdateCommentScore(this.state.confirmationScore.set('isConfirmed', null));
    }

    if (this.props.onResetCommentScore) {
      await this.props.onResetCommentScore(this.state.confirmationScore.commentId, this.state.confirmationScore.id);
    }

    this.closeConfirmationToolTip();
  }

  @autobind
  async removeTag() {
    if (this.props.onUpdateCommentScore) {
      await this.props.onUpdateCommentScore(
        this.state.confirmationScore.set('isConfirmed', false).set('confirmedUserId', this.props.currentUser.id),
      );
    }
    if (this.props.onRejectCommentScore) {
      this.props.onRejectCommentScore(this.state.confirmationScore.commentId, this.state.confirmationScore.id);
    }

    this.closeConfirmationToolTip();
  }

  taggifyText(text: string, scores: List<ICommentScoreModel>): JSX.Element {
    if (typeof scores === 'undefined') {
      return <div>{text}</div>;
    }
    const sortedNodes =
        scores.sort((a, b) => a.annotationStart - b.annotationStart);
    let currentIndex = 0;
    const output: Array<any> = [];
    sortedNodes.forEach((n, i) => {
      if (n.annotationStart === null || n.annotationEnd  === null) { return; }

      const startIndex =
          n.annotationStart < currentIndex ? currentIndex : n.annotationStart;
      const endIndex =
          n.annotationEnd < currentIndex ? currentIndex : n.annotationEnd;
      const confirmedUser = this.props.getUserById(n.confirmedUserId) && this.props.getUserById(n.confirmedUserId).name;
      const author = confirmedUser ? confirmedUser : n.sourceType;

      output.push(this.addRange(text, currentIndex, startIndex));

      output.push(this.addRange(
        text,
        startIndex,
        endIndex,
        n.tagId,
        n.isConfirmed,
        author,
        n.sourceType,
        i,
        n,
      ));
      currentIndex = endIndex;
    });

    output.push(this.addRange(
      text,
      currentIndex,
      text.length,
    ));

    return <div>{output}</div>;
  }

  addRange(
    originalString: string,
    start: number,
    end: number,
    tagId?: string,
    isConfirmed?: boolean,
    author?: string,
    source?: string,
    key?: number,
    score?: ICommentScoreModel,
  ) {
    const str = originalString.slice(start, end);
    if (str.length > 0) {
      if (tagId) {
        const tag = this.props.availableTags.find((t) => (t.get('id') === tagId));

        if (author !== 'Machine' && author !== null) {
          status = 'tagged';
        } else if (isConfirmed === true) {
          status = 'confirmed';
        }
        if (isConfirmed === false) {
          status = 'rejected';
        } else if (isConfirmed === null) {
          status = 'unmoderated';
        }

        const color = status && status === 'rejected' || !tag ? GREY_COLOR : tag.color;

        return (
          <span
            key={key}
            role="button"
            tabIndex={0}
            onClick={partial(this.toggleConfirmationToolTip, score)}
            data-color={color}
            data-tag={tag && tag.label}
            data-author={author}
            data-status={status}
            data-source={source}
            {...css(
              !isConfirmed && status !== 'rejected' && STYLES.confirmBase,
              { color },
            )}
          >
            {str}
          </span>
        );
      } else {
        return (
          <span>{str}</span>
        );
      }
    }
  }
}
