/*
Copyright 2019 Google Inc.

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
import { List, Set } from 'immutable';
import keyboardJS from 'keyboardjs';
import React from 'react';
import { Link, WithRouterProps } from 'react-router';

import {
  CommentScoreModel,
  IAuthorCountsModel,
  ICommentFlagModel,
  ICommentModel,
  ICommentScoreModel,
  ICommentSummaryScoreModel,
  ITaggingSensitivityModel,
  ITagModel,
  IUserModel,
} from '../../../../../models';
import {
  IConfirmationAction,
  IModerationAction,
} from '../../../../../types';
import {
  Arrow,
  ArrowIcon,
  ArrowPosition,
  AssignTagsForm,
  ConfirmationCircle,
  InfoIcon,
  LoadMoreIcon,
  ModerateButtons,
  ReplyIcon,
  ScoresList,
  Scrim,
  SingleComment,
  ToolTip,
} from '../../../../components';
import { REQUIRE_REASON_TO_REJECT } from '../../../../config';
import {
  COMMENTS_EDITABLE_FLAG,
  MODERATOR_GUIDELINES_URL,
  SUBMIT_FEEDBACK_URL,
} from '../../../../config';
import {
  BASE_Z_INDEX,
  BOTTOM_BORDER_TRANSITION,
  BOX_DEFAULT_SPACING,
  BUTTON_LINK_TYPE,
  BUTTON_RESET,
  DARK_COLOR,
  DARK_SECONDARY_TEXT_COLOR,
  DARK_TERTIARY_TEXT_COLOR,
  DIVIDER_COLOR,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  MEDIUM_COLOR,
  PALE_COLOR,
  SCRIM_STYLE,
  SCRIM_Z_INDEX,
  SELECT_Z_INDEX,
  TEXT_OFFSET_DEFAULT_SPACING,
  TOOLTIP_Z_INDEX,
  VISUALLY_HIDDEN,
  WHITE_COLOR,
} from '../../../../styles';
import { clearReturnSavedCommentRow, partial, setReturnSavedCommentRow, timeout } from '../../../../util';
import { css, stylesheet } from '../../../../utilx';
import { Shortcuts } from '../Shortcuts';

const ACTION_PROPERTY_MAP: {
  [key: string]: string | null;
} = {
  highlight: 'isHighlighted',
  approve: 'isAccepted',
  reject: 'isAccepted',
  defer: 'isDeferred',
  reset: null,
};

const COMMENT_WRAPPER_WIDTH = 696;
const KEYBOARD_SHORTCUTS_POPUP_ID = 'keyboard-shortcuts';
const SCORES_POPUP_ID = 'scores-popup';
const CONFIRMATION_POPUP_ID = 'confirmation-popup';
const INFO_DROPDOWN_ID = 'info-dropdown';
const APPROVE_SHORTCUT = 'alt + a';
const REJECT_SHORTCUT = 'alt + r';
const DEFER_SHORTCUT = 'alt + d';
const HIGHLIGHT_SHORTCUT = 'alt + h';
const ESCAPE_SHORTCUT = 'escape';
const PREV_SHORTCUT = 'alt + up';
const NEXT_SHORTCUT = 'alt + down';

const STYLES = stylesheet({
  wrapper: {
    height: '100%',
  },

  commentWrapper: {
    display: 'flex',
    position: 'relative',
    boxSizing: 'border-box',
    padding: '0 142px 0 76px',
    height: '100%',
    overflowY: 'scroll',
  },

  comment: {
    padding: `${TEXT_OFFSET_DEFAULT_SPACING}px 0`,
    width: '100%',
    maxWidth: `${COMMENT_WRAPPER_WIDTH}px`,
    margin: '0 auto',
  },

  sidebar: {
    position: 'fixed',
    display: 'flex',
    top: HEADER_HEIGHT,
    bottom: 10,
    right: GUTTER_DEFAULT_SPACING,
    zIndex: SELECT_Z_INDEX,
  },

  buttons: {
    alignSelf: 'center',
  },

  pagers: {
    width: '58px',
    position: 'absolute',
    bottom: '0px',
    right: '0px',
  },

  popup: {
    ...SCRIM_STYLE.popup,
    width: '100%',
    minWidth: '500px',
    maxHeight: '600px',
  },

  infoTrigger: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    background: 'none',
    border: '0px',
    cursor: 'pointer',
    ':focus': {
      outline: 0,
    },
  },

  infoList: {
    listStyle: 'none',
    padding: '5px',
    width: '200px',
  },

  infoTooltipButton: {
    ...BUTTON_LINK_TYPE,
    width: '100%',
    textAlign: 'left',
    paddingLeft: `${BOX_DEFAULT_SPACING}px`,
    paddingRight: `${BOX_DEFAULT_SPACING}px`,
    background: 'none',
    border: '0px',
    color: DARK_COLOR,
    cursor: 'pointer',
  },

  scrim: {
    zIndex: SCRIM_Z_INDEX,
  },

  scrim1: {
    zIndex: BASE_Z_INDEX,
  },

  subHeading: {
    ...BUTTON_RESET,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    background: PALE_COLOR,
    height: HEADER_HEIGHT,
    paddingLeft: GUTTER_DEFAULT_SPACING,
    paddingRight: GUTTER_DEFAULT_SPACING,
    position: 'absolute',
    width: '100%',
    zIndex: BASE_Z_INDEX,
    textDecoration: 'none',
    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  selectedInfo: {
    ...BOTTOM_BORDER_TRANSITION,
    marginLeft: GUTTER_DEFAULT_SPACING,
    color: DARK_COLOR,
  },

  replyButton: {
    border: 'none',
    backgroundColor: 'transparent',
    color: DARK_COLOR,
    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  replyIcon: {
    marginRight: `${BOX_DEFAULT_SPACING}px`,
    display: 'inline-block',
    transform: 'translateY(-4px)',
  },

  loadIcon: {
    fill: DARK_COLOR,
    display: 'flex',
    margin: '50% auto 0 auto',
  },

  replyToContainer: {
    borderBottom: `2px solid ${DIVIDER_COLOR}`,
    height: HEADER_HEIGHT,
    display: 'flex',
    alignItems: 'center',
  },

  resultsHeader: {
    alignItems: 'center',
    backgroundColor: PALE_COLOR,
    color: MEDIUM_COLOR,
    display: 'flex',
    flexWrap: 'no-wrap',
    justifyContent: 'space-between',
  },

  resultsHeadline: {
    marginLeft: '29px',
  },

  resultsLink: {
    color: MEDIUM_COLOR,
    cursor: 'pointer',
  },

  paginationArrow: {
    display: 'block',
    ':focus': {
      outline: 0,
      textDecoration: 'underline,',
    },
  },

  confirmationPopup: {
    ':focus': {
      outline: 0,
    },
  },
});

export interface ICommentDetailProps extends WithRouterProps {
  comment: ICommentModel;
  allTags: List<ITagModel>;
  availableTags: List<ITagModel>;
  allScores?: List<ICommentScoreModel>;
  allScoresAboveThreshold: List<ICommentScoreModel>;
  reducedScoresAboveThreshold: List<ICommentScoreModel>;
  reducedScoresBelowThreshold: List<ICommentScoreModel>;
  flags?: List<ICommentFlagModel>;
  getThresholdForTag(score: ICommentScoreModel): any;
  currentCommentIndex?: number;
  nextCommentId?: string;
  previousCommentId?: string;
  isFromBatch?: boolean;
  isLoading?: boolean;
  onUpdateCommentScore?(commentScore: ICommentScoreModel): void;
  onConfirmCommentScore?(commentid: string, commentScoreId: string): void;
  onRejectCommentScore?(commentid: string, commentScoreId: string): void;
  onResetCommentScore?(commentid: string, commentScoreId: string): void;
  onDeleteCommentTag?(id: string, commentScoreId: string): void;
  onUpdateComment?(comment: ICommentModel): void;
  onAddCommentScore?(commentScore: ICommentScoreModel): void;
  onRemoveCommentScore?(commentScore: ICommentScoreModel): void;
  loadData?(commentId: string): void;
  loadScores?(commentId: string): void;
  onCommentAction?(action: IConfirmationAction, idsToDispatch: Array<string>, userId: string): void;
  onTagComment?(ids: Array<string>, tagId: string, userId: string): void;
  onAnnotateComment?(id: string, tagId: string, start: number, end: number): void;
  onModerateStatusChange?(shouldResetStatus: boolean): Promise<any>;
  authorCountById?(id: string | number): IAuthorCountsModel;
  getUserById?(id: string | number): IUserModel;
  currentUser: IUserModel;
  detailSource?: string;
  linkBackToList?: string;
  summaryScores?: List<ICommentSummaryScoreModel>;
  summaryScoresAboveThreshold?: List<ICommentSummaryScoreModel>;
  summaryScoresBelowThreshold?: List<ICommentSummaryScoreModel>;
  tagCommentSummaryScore?(ids: Array<string>, tagId: string, userId?: string): void;
  confirmCommentSummaryScore?(id: string, tagId: string, userId?: string): void;
  rejectCommentSummaryScore?(id: string, tagId: string, userId?: string): void;
  getTagIdsAboveThresholdByCommentId?(commentId: string): Set<string>;
}

export interface ICommentDetailState {
  loadedCommentId?: string;
  isKeyboardModalVisible?: boolean;
  isConfirmationModalVisible?: boolean;
  isScoresModalVisible?: boolean;
  scoresSelectedByTag?: List<ICommentScoreModel>;
  thresholdByTag?: ITaggingSensitivityModel;
  confirmationAction?: IConfirmationAction;
  isInfoDropdownVisible?: boolean;
  infoToolTipPosition?: {
    top: number,
    left: number,
  };
  activeButtons?: List<IModerationAction>;
  upArrowIsFocused?: boolean;
  downArrowIsFocused?: boolean;
  infoIconFocused?: boolean;
  taggingToolTipMetaPosition?: {
    top: number;
    left: number;
  };
  taggingToolTipArrowPosition?: ArrowPosition;
  selectedRow?: number;
  taggingTooltipVisible?: boolean;
  taggingCommentId?: string;
}

export class CommentDetail extends React.Component<ICommentDetailProps, ICommentDetailState> {

  state: ICommentDetailState = {
    isKeyboardModalVisible: false,
    isConfirmationModalVisible: false,
    confirmationAction: null,
    isInfoDropdownVisible: false,
    isScoresModalVisible: false,
    scoresSelectedByTag: null,
    thresholdByTag: null,
    infoToolTipPosition: {
      top: 0,
      left: 0,
    },
    activeButtons: this.getActiveButtons(this.props),
    upArrowIsFocused: false,
    downArrowIsFocused: false,
    infoIconFocused: false,
    taggingToolTipMetaPosition: {
      top: 0,
      left: 0,
    },
    taggingToolTipArrowPosition: null,
    taggingTooltipVisible: false,
    taggingCommentId: null,
  };

  buttonRef: HTMLElement = null;
  moderateButtonsRef: HTMLDivElement = null;

  componentDidMount() {
    this.attachEvents();
  }

  componentWillUnmount() {
    this.detachEvents();
  }

  static getDerivedStateFromProps(nextProps: ICommentDetailProps, prevState: ICommentDetailState) {
    if (prevState.loadedCommentId !== nextProps.params.commentId) {
      nextProps.loadData(nextProps.params.commentId);
    }
    return {
      loadedCommentId: nextProps.params.commentId,
    };
  }

  @autobind
  saveModerateButtonsRef(ref: HTMLDivElement) {
    this.moderateButtonsRef = ref;
  }

  @autobind
  onFocusUpArrow() {
    this.setState({ upArrowIsFocused: true });
  }

  @autobind
  onBlurUpArrow() {
    this.setState({ upArrowIsFocused: false });
  }

  @autobind
  onFocusDownArrow() {
    this.setState({ downArrowIsFocused: true });
  }

  @autobind
  onBlurDownArrow() {
    this.setState({ downArrowIsFocused: false });
  }

  @autobind
  onFocusInfoIcon() {
    this.setState({ infoIconFocused: true });
  }

  @autobind
  onBlurInfoIcon() {
    this.setState({ infoIconFocused: false });
  }

  @autobind
  saveButtonRef(ref: HTMLButtonElement) {
    this.buttonRef = ref;
  }

  @autobind
  saveReturnRow(commentId: string): void {
    setReturnSavedCommentRow(commentId);
  }

  @autobind
  getModerateButtonsPosition(ref: HTMLDivElement): {
    top: number;
    left: number;
  } {
    if (!ref) {
      return;
    }

    const rect = ref.getBoundingClientRect();

    return {
      top: rect.top + (rect.width / 2) - 10,
      left: rect.left + (rect.width / 2) - 10,
    };
  }

  @autobind
  async handleRejectWithTag() {
    const tooltipPosition = this.getModerateButtonsPosition(this.moderateButtonsRef);

    this.setState({
      taggingToolTipMetaPosition: tooltipPosition,
      taggingTooltipVisible: true,
      taggingToolTipArrowPosition: 'rightCenter',
    });
  }

  @autobind
  handleAssignTagsSubmit(selectedTagIds: Set<string>) {
    selectedTagIds.forEach((tagId) => {
      this.props.tagCommentSummaryScore([this.props.comment.id], tagId);
    });
    this.moderateComment('reject');
    this.setState({
      taggingTooltipVisible: false,
      taggingCommentId: null,
    });
  }

  @autobind
  onTaggingTooltipClose() {
    this.setState({ taggingTooltipVisible: false });
  }

  render() {
    const {
      comment,
      availableTags,
      allTags,
      allScores,
      allScoresAboveThreshold,
      reducedScoresAboveThreshold,
      reducedScoresBelowThreshold,
      flags,
      currentCommentIndex,
      nextCommentId,
      previousCommentId,
      loadScores,
      onUpdateCommentScore,
      onConfirmCommentScore,
      onRejectCommentScore,
      onResetCommentScore,
      onDeleteCommentTag,
      onRemoveCommentScore,
      authorCountById,
      getUserById,
      detailSource,
      linkBackToList,
      summaryScoresAboveThreshold,
      summaryScoresBelowThreshold,
      currentUser,
      onUpdateComment,
      getTagIdsAboveThresholdByCommentId,
    } = this.props;

    const {
      isKeyboardModalVisible,
      isConfirmationModalVisible,
      isScoresModalVisible,
      scoresSelectedByTag,
      thresholdByTag,
      confirmationAction,
      isInfoDropdownVisible,
      infoToolTipPosition,
      upArrowIsFocused,
      downArrowIsFocused,
      infoIconFocused,
      taggingTooltipVisible,
      taggingToolTipArrowPosition,
      taggingToolTipMetaPosition,
    } = this.state;

    if (!comment) {
      return null;
    }

    const inReplyTo = comment.replyTo;
    const isArticle = !!this.props.params.articleId;

    let batchURL;

    if (isArticle) {
      batchURL = `/articles/${this.props.params.articleId}/new`;
    } else {
      batchURL = `/categories/${this.props.params.category}/new`;
    }

    return (
      <div {...css({ height: '100%' })}>
        <div>
          { detailSource && (typeof currentCommentIndex === 'number') ? (
            <Link to={linkBackToList} {...css(STYLES.subHeading)}>
              <ArrowIcon direction="left" {...css({fill: DARK_COLOR, margin: 'auto 0'})} size={24} />
              <p {...css(STYLES.selectedInfo)}>
                {detailSource.replace('%i', (currentCommentIndex + 1).toString())}
              </p>
            </Link>
          ) : (
            <Link to={batchURL} {...css(STYLES.subHeading)}>
              <ArrowIcon direction="left" {...css({fill: DARK_COLOR, margin: 'auto 0'})} size={24} />
              <p {...css(STYLES.selectedInfo)}>
                {`Back to ${isArticle ? 'article' : 'category'}`}
              </p>
            </Link>
          )}
        </div>

        <div {...css(STYLES.wrapper)}>
          <div {...css(STYLES.sidebar)}>
            <div {...css(STYLES.buttons)} ref={this.saveModerateButtonsRef}>
              <ModerateButtons
                vertical
                activeButtons={this.state.activeButtons}
                onClick={this.moderateComment}
                disabled={this.props.isLoading}
                requireReasonForReject={comment.isAccepted === false ? false : REQUIRE_REASON_TO_REJECT}
                onRejectWithTag={this.handleRejectWithTag}
              />
            </div>
            { (previousCommentId || nextCommentId) && (
              <div {...css(STYLES.pagers)}>
                { previousCommentId ? (
                  <Link
                    {...css(STYLES.paginationArrow)}
                    to={this.generatePagingLink(previousCommentId)}
                    onFocus={this.onFocusUpArrow}
                    onBlur={this.onBlurUpArrow}
                    onClick={partial(this.saveReturnRow, previousCommentId)}
                  >
                    <Arrow
                      direction={'up'}
                      label={'up arrow'}
                      size={58}
                      color={upArrowIsFocused ? MEDIUM_COLOR : DARK_TERTIARY_TEXT_COLOR}
                      icon={<ArrowIcon {...css({ fill: upArrowIsFocused ? MEDIUM_COLOR : DARK_TERTIARY_TEXT_COLOR })} size={24} />}
                    />
                    <span {...css(VISUALLY_HIDDEN)}>Previous Comment</span>
                  </Link>
                ) : (
                  <Arrow
                    isDisabled
                    direction={'up'}
                    label={'up arrow'}
                    size={58}
                    color={DARK_TERTIARY_TEXT_COLOR}
                    icon={<ArrowIcon {...css({ fill: DARK_TERTIARY_TEXT_COLOR })} size={24} />}
                  />
                )}

                { nextCommentId ? (
                  <Link
                    {...css(STYLES.paginationArrow)}
                    to={this.generatePagingLink(nextCommentId)}
                    onFocus={this.onFocusDownArrow}
                    onBlur={this.onBlurDownArrow}
                    onClick={partial(this.saveReturnRow, nextCommentId)}
                  >
                    <Arrow
                      direction={'down'}
                      label={'down arrow'}
                      size={58}
                      color={upArrowIsFocused ? MEDIUM_COLOR : DARK_TERTIARY_TEXT_COLOR}
                      icon={<ArrowIcon {...css({ fill: downArrowIsFocused ? MEDIUM_COLOR : DARK_TERTIARY_TEXT_COLOR })} size={24} />}
                    />
                    <span {...css(VISUALLY_HIDDEN)}>Next Comment</span>
                  </Link>
                ) : (
                  <Arrow
                    isDisabled
                    direction={'down'}
                    label={'down arrow'}
                    size={58}
                    color={DARK_TERTIARY_TEXT_COLOR}
                    icon={<ArrowIcon {...css({fill: DARK_TERTIARY_TEXT_COLOR})} size={24} />}
                  />
                )}
              </div>
            )}
          </div>

          <div {...css(STYLES.commentWrapper)}>
            <div {...css(STYLES.comment)}>
              { inReplyTo && !this.props.isLoading && (
                <div {...css(STYLES.replyToContainer)}>
                  <Link
                    to={`/articles/${comment.articleId}/comments/${inReplyTo.id}/${comment.id}/replies`}
                    {...css(STYLES.replyButton)}
                  >
                    <div {...css(STYLES.replyIcon)}>
                      <ReplyIcon {...css({fill: DARK_COLOR})} size={24} />
                    </div>
                    This is a reply to {inReplyTo.author.name}
                  </Link>
                </div>
              )}
              { !this.props.isLoading ? (
                <SingleComment
                  authorCounts={authorCountById(comment.authorSourceId)}
                  comment={comment}
                  allScores={allScores}
                  allScoresAboveThreshold={allScoresAboveThreshold}
                  reducedScoresAboveThreshold={reducedScoresAboveThreshold}
                  reducedScoresBelowThreshold={reducedScoresBelowThreshold}
                  summaryScoresAboveThreshold={summaryScoresAboveThreshold}
                  summaryScoresBelowThreshold={summaryScoresBelowThreshold}
                  flags={flags}
                  allTags={allTags}
                  availableTags={availableTags}
                  loadScores={loadScores}
                  getUserById={getUserById}
                  onScoreClick={this.handleScoreClick}
                  onTagButtonClick={this.onTagButtonClick}
                  onCommentTagClick={this.onCommentTagClick}
                  onAnnotateTagButtonClick={this.onAnnotateTagButtonClick}
                  onConfirmCommentScore={onConfirmCommentScore}
                  onRejectCommentScore={onRejectCommentScore}
                  onResetCommentScore={onResetCommentScore}
                  onDeleteCommentTag={onDeleteCommentTag}
                  onRemoveCommentScore={onRemoveCommentScore}
                  onUpdateCommentScore={onUpdateCommentScore}
                  currentUser={currentUser}
                  onUpdateCommentText={onUpdateComment}
                  commentEditingEnabled={COMMENTS_EDITABLE_FLAG}
                />
              ) : (
                <LoadMoreIcon {...css(STYLES.loadIcon)} />
              )}
            </div>
          </div>

          <Scrim
            key="keyboardScrim"
            scrimStyles={{...STYLES.scrim, ...SCRIM_STYLE.scrim}}
            isVisible={isKeyboardModalVisible}
            onBackgroundClick={this.onKeyboardClose}
          >
            <FocusTrap
              focusTrapOptions={{
                clickOutsideDeactivates: true,
              }}
            >
              <div key="keyboardContainer" id={KEYBOARD_SHORTCUTS_POPUP_ID} {...css(STYLES.popup)}>
                {/* keyboard shortcuts */}
                <Shortcuts onClose={this.onKeyboardClose}/>
              </div>
            </FocusTrap>
          </Scrim>

          <Scrim
            key="confirmationScrim"
            scrimStyles={{...STYLES.scrim, ...SCRIM_STYLE.scrim}}
            isVisible={isConfirmationModalVisible}
            onBackgroundClick={this.closeToast}
          >
            <FocusTrap
              focusTrapOptions={{
                clickOutsideDeactivates: true,
              }}
            >
              <div id={CONFIRMATION_POPUP_ID} tabIndex={0} {...css(STYLES.confirmationPopup)}>
                {/* Confirmation popup */}
                <ConfirmationCircle backgroundColor={DARK_COLOR} action={confirmationAction} size={120} iconSize={40} />
              </div>
            </FocusTrap>
          </Scrim>

          {/* ToolTip and Scrim */}
          <Scrim
            key="tooltipScrim"
            scrimStyles={STYLES.scrim1}
            isVisible={isInfoDropdownVisible}
            onBackgroundClick={this.onDropdownClose}
            id={INFO_DROPDOWN_ID}
          >
            <ToolTip
              hasDropShadow
              backgroundColor={WHITE_COLOR}
              arrowPosition="leftBottom"
              size={16}
              isVisible={isInfoDropdownVisible}
              position={infoToolTipPosition}
              zIndex={SCRIM_Z_INDEX}
            >
              <ul {...css(STYLES.infoList)}>
                <li>
                  <button
                    {...css(STYLES.infoTooltipButton)}
                    onClick={this.onKeyboardOpen}
                  >
                    Keyboard Shortcuts
                  </button>
                </li>
                {MODERATOR_GUIDELINES_URL && (
                  <li>
                    <a
                      {...css(STYLES.infoTooltipButton)}
                      href={MODERATOR_GUIDELINES_URL}
                      target="_blank"
                    >
                      Moderator Guidelines
                    </a>
                  </li>
                )}
                {SUBMIT_FEEDBACK_URL && (
                  <li>
                    <a
                      {...css(STYLES.infoTooltipButton)}
                      href={SUBMIT_FEEDBACK_URL}
                      target="_blank"
                    >
                      Submit Feedback
                    </a>
                  </li>
                )}
              </ul>
            </ToolTip>
          </Scrim>
          {availableTags && taggingTooltipVisible && (
            <FocusTrap
              focusTrapOptions={{
                clickOutsideDeactivates: true,
              }}
            >
              <ToolTip
                arrowPosition={taggingToolTipArrowPosition}
                backgroundColor={WHITE_COLOR}
                hasDropShadow
                isVisible={taggingTooltipVisible}
                onDeactivate={this.onTaggingTooltipClose}
                position={taggingToolTipMetaPosition}
                size={16}
                zIndex={TOOLTIP_Z_INDEX}
              >
                <AssignTagsForm
                  tags={availableTags}
                  onSubmit={this.handleAssignTagsSubmit}
                  tagsPreselected={getTagIdsAboveThresholdByCommentId(this.props.comment.id)}
                />
              </ToolTip>
            </FocusTrap>
          )}

          <button
            tabIndex={0}
            ref={this.saveButtonRef}
            {...css(STYLES.infoTrigger)}
            onClick={this.onDropdownOpen}
            onFocus={this.onFocusInfoIcon}
            onBlur={this.onBlurInfoIcon}
          >
            <InfoIcon {...css({fill: infoIconFocused ? MEDIUM_COLOR : DARK_SECONDARY_TEXT_COLOR})} />
            <span {...css(VISUALLY_HIDDEN)}>Tag Information</span>
          </button>
        </div>

        <Scrim
          key="scoresScrim"
          scrimStyles={{...STYLES.scrim, ...SCRIM_STYLE.scrim}}
          isVisible={isScoresModalVisible}
          onBackgroundClick={this.onScoresModalClose}
        >
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
            }}
          >
            <div
              key="scoresContainer"
              id={SCORES_POPUP_ID}
              {...css(
                STYLES.popup,
                { width: `${COMMENT_WRAPPER_WIDTH}px`},
              )}
            >
              {/* All scores popup */}
              <ScoresList
                comment={comment}
                scores={scoresSelectedByTag}
                threshold={thresholdByTag}
                tags={allTags}
                onClose={this.onScoresModalClose}
              />
            </div>
          </FocusTrap>
        </Scrim>
      </div>
    );
  }

  generatePagingLink(commentId: string) {
    const isArticle = !!this.props.params.articleId;

    let articleURLPrefix;

    if (isArticle) {
      articleURLPrefix = `/articles/${this.props.params.articleId}/comments`;
    } else {
      articleURLPrefix = `/categories/${this.props.params.category}/comments`;
    }

    const queryString = (this.props.location && this.props.location.search) || '';

    return `${articleURLPrefix}/${commentId}${queryString}`;
  }

  @autobind
  calculateInfoTrigger(ref: any) {
    if (!ref) {
      return;
    }

    const infoIconRect = ref.getBoundingClientRect();

    this.setState({
      infoToolTipPosition: {
        // get height of tooltip, use that to offset
        top: (infoIconRect.bottom - 24),
        left: infoIconRect.right,
      },
    });
  }

  @autobind
  onResize() {
    this.calculateInfoTrigger(this.buttonRef);
  }

  @autobind
  onKeyboardOpen() {
    this.setState({ isKeyboardModalVisible: true });
  }

  @autobind
  onKeyboardClose() {
    this.setState({ isKeyboardModalVisible: false });
  }

  @autobind
  onDropdownOpen() {
    this.setState({ isInfoDropdownVisible: true });
    this.calculateInfoTrigger(this.buttonRef);
  }

  @autobind
  onDropdownClose() {
    this.setState({ isInfoDropdownVisible: false });
  }

  @autobind
  onScoresModalClose() {
    this.setState({ isScoresModalVisible: false });
  }

  @autobind
  attachEvents() {
    keyboardJS.bind(APPROVE_SHORTCUT, this.approveComment);
    keyboardJS.bind(REJECT_SHORTCUT, this.rejectComment);
    keyboardJS.bind(DEFER_SHORTCUT, this.deferComment);
    keyboardJS.bind(HIGHLIGHT_SHORTCUT, this.highlightComment);
    keyboardJS.bind(ESCAPE_SHORTCUT, this.onPressEscape);
    keyboardJS.bind(PREV_SHORTCUT, this.goToPrevComment);
    keyboardJS.bind(NEXT_SHORTCUT, this.goToNextComment);

    window.addEventListener('resize', this.onResize);
  }

  @autobind
  detachEvents() {
    keyboardJS.unbind(APPROVE_SHORTCUT, this.approveComment);
    keyboardJS.unbind(REJECT_SHORTCUT, this.rejectComment);
    keyboardJS.unbind(DEFER_SHORTCUT, this.deferComment);
    keyboardJS.unbind(HIGHLIGHT_SHORTCUT, this.highlightComment);
    keyboardJS.unbind(ESCAPE_SHORTCUT, this.onPressEscape);
    keyboardJS.unbind(PREV_SHORTCUT, this.goToPrevComment);
    keyboardJS.unbind(NEXT_SHORTCUT, this.goToNextComment);
    window.removeEventListener('resize', this.onResize);
  }

  getChangeByAction(action: IConfirmationAction): ICommentModel {
    const { comment } = this.props;

    if (action === 'reset') {
      return comment.set('isHighlighted', false)
                    .set('isAccepted', null)
                    .set('isModerated', null)
                    .set('isDeferred', false);
    }

    if (action === 'highlight') {
      return comment.set('isHighlighted', true)
                    .set('isAccepted', true)
                    .set('isModerated', true)
                    .set('isDeferred', false);
    }

    return comment.set('isModerated', true)
                  .set('isAccepted', null)
                  .set('isHighlighted', false)
                  .set('isDeferred', false)
                  .set(ACTION_PROPERTY_MAP[action], action === 'reject' ? false : true);
  }

  @autobind
  onBackClick() {
    window.history.back();
  }

  @autobind
  async moderateComment(action: IModerationAction) {
    const isModerated = this.props.comment.isModerated;
    const shouldResetAction = this.state.activeButtons && this.state.activeButtons.includes(action);
    const commentAction: IConfirmationAction = shouldResetAction ? 'reset' : action;
    this.setState({
      isConfirmationModalVisible: true,
      confirmationAction: commentAction,
    });
    if (this.props.onUpdateComment) {
      await this.props.onUpdateComment(this.getChangeByAction(commentAction));
    }

    await Promise.all([
      this.props.onCommentAction && this.props.onCommentAction(commentAction, [this.props.comment.id], this.props.currentUser.id),
      (!isModerated || isModerated && shouldResetAction) && this.props.onModerateStatusChange && this.props.onModerateStatusChange(shouldResetAction),
      timeout(2000),
    ]);

    if (this.props.loadScores) {
      await this.props.loadScores(this.props.comment.id);
    }

    this.closeToast();

    // clear saved for batch view, since this one has now been moderated.
    clearReturnSavedCommentRow();

    if (this.props.isFromBatch) {
      this.goToNextComment();
    }
  }

  @autobind
  approveComment() {
    return this.moderateComment('approve');
  }

  @autobind
  rejectComment() {
    return this.moderateComment('reject');
  }

  @autobind
  deferComment() {
    return this.moderateComment('defer');
  }

  @autobind
  highlightComment() {
    return this.moderateComment('highlight');
  }

  @autobind
  goToPrevComment() {
    const { previousCommentId } = this.props;

    if (!previousCommentId) { return; }

    this.saveReturnRow(previousCommentId);
    this.props.router.push(this.generatePagingLink(previousCommentId));
  }

  @autobind
  goToNextComment() {
    const { nextCommentId } = this.props;

    if (!nextCommentId) { return; }

    this.saveReturnRow(nextCommentId);
    this.props.router.push(this.generatePagingLink(nextCommentId));
  }

  @autobind
  async onTagButtonClick(tagId: string) {
    const localStatePayload = CommentScoreModel({
      id: null,
      commentId: this.props.comment.id,
      isConfirmed: true,
      sourceType: 'Moderator',
      score: 1,
      tagId,
    });

    if (this.props.onAddCommentScore) {
      await this.props.onAddCommentScore(localStatePayload);
    }
    if (this.props.onTagComment) {
      await this.props.onTagComment([this.props.comment.id], tagId, this.props.currentUser.id);
    }
    await this.props.loadScores(this.props.comment.id);
    this.closeToast();
  }

  @autobind
  async onAnnotateTagButtonClick(tag: string, start: number, end: number): Promise<any> {

    const localStatePayload = CommentScoreModel({
      id: null,
      commentId: this.props.comment.id,
      confirmedUserId: this.props.currentUser.id,
      isConfirmed: true,
      tagId: tag,
      annotationStart: start,
      annotationEnd: end,
      sourceType: 'Moderator',
      score: 1,
    });

    if (this.props.onAddCommentScore) {
      await this.props.onAddCommentScore(localStatePayload);
    }
    if (this.props.onAnnotateComment) {
      await this.props.onAnnotateComment(this.props.comment.id, tag, start, end);
    }

    await this.props.loadScores(this.props.comment.id);

    this.closeToast();
  }

  @autobind
  async onCommentTagClick(commentScore: ICommentScoreModel) {
    console.log(this.props.comment.id, commentScore.id);
    if (this.props.onRemoveCommentScore) {
      await this.props.onRemoveCommentScore(commentScore);
    }
    if (this.props.onDeleteCommentTag) {
      await this.props.onDeleteCommentTag(this.props.comment.id, commentScore.id);
    }

    this.closeToast();
  }

  @autobind
  closeToast() {
    this.setState({ isConfirmationModalVisible: false });
  }

  getActiveButtons(props: ICommentDetailProps): List<IModerationAction> {
    const comment: ICommentModel = props.comment;
    if (!comment) { return null; }
    let activeButtons = List();

    if (comment.isAccepted === true) { activeButtons = List(['approve']); }
    if (comment.isAccepted === false) { activeButtons = List(['reject']); }
    if (comment.isHighlighted) { activeButtons = activeButtons.push('highlight'); }
    if (comment.isDeferred) { activeButtons = List(['defer']); }

    return activeButtons as List<IModerationAction>;
  }

  @autobind
  handleScoreClick(scoreClicked: ICommentScoreModel) {
    this.setState({
      isScoresModalVisible: true,
      scoresSelectedByTag: this.props.allScores.filter(
        (score) => score.tagId === scoreClicked.tagId,
      ).sort((a, b) => a.score > b.score ? -1 : a.score < b.score ? 1 : 0) as List<ICommentScoreModel>,
      thresholdByTag: this.props.getThresholdForTag(scoreClicked),
    });
  }

  @autobind
  onPressEscape() {
    if (this.state.isKeyboardModalVisible) {
      this.onKeyboardClose();
    }

    if (this.state.isInfoDropdownVisible) {
      this.onDropdownClose();
    }

    if (this.state.isScoresModalVisible) {
      this.onScoresModalClose();
    }

    if (this.state.taggingTooltipVisible) {
      this.onTaggingTooltipClose();
    }
  }
}
