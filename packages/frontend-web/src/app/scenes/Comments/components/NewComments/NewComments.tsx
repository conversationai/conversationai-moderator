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
import { List, Map, Set } from 'immutable';
import keyboardJS from 'keyboardjs';
import React from 'react';
import { WithRouterProps } from 'react-router';

import {
  convertServerAction,
  IArticleModel,
  ICommentDatedModel,
  ICommentModel,
  ICommentScoredModel,
  IPreselectModel,
  IRuleModel,
  ITagModel,
  ModelId,
  TagModel,
} from '../../../../../models';
import { ICommentAction } from '../../../../../types';
import {
  AddIcon,
  ApproveIcon,
  ArrowPosition,
  ArticleControlIcon,
  AssignTagsForm,
  CommentActionButton,
  CommentList,
  DeferIcon,
  HighlightIcon,
  Link,
  RejectIcon,
  Scrim,
  ToastMessage,
  ToolTip,
} from '../../../../components';
import {
  DEFAULT_DRAG_HANDLE_POS1,
  DEFAULT_DRAG_HANDLE_POS2,
  DEFAULT_SORT,
  REQUIRE_REASON_TO_REJECT,
} from '../../../../config';
import { updateArticle } from '../../../../platform/dataService';
import {
  ARTICLE_CATEGORY_TYPE,
  BASE_Z_INDEX,
  BOX_DEFAULT_SPACING,
  DARK_COLOR,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  LIGHT_PRIMARY_TEXT_COLOR,
  NICE_MIDDLE_BLUE,
  SCRIM_STYLE,
  SCRIM_Z_INDEX,
  SELECT_ELEMENT,
  STICKY_Z_INDEX,
  TOOLTIP_Z_INDEX,
  WHITE_COLOR,
} from '../../../../styles';
import {
  clearReturnSavedCommentRow,
  getReturnSavedCommentRow,
  partial,
  setReturnSavedCommentRow,
} from '../../../../util';
import { css, stylesheet } from '../../../../utilx';
import { articleBase, categoryBase, tagSelectorLink } from '../../../routes';
import { BatchSelector } from './components/BatchSelector';
import { getCommentIDsInRange } from './store';

const ACTION_BAR_HEIGHT_FIXED = 68;
const ARROW_SIZE = 6;
const TOAST_DELAY = 6000;

const ACTION_PLURAL: {
  [key: string]: string;
} = {
  highlight: 'highlighted',
  approve: 'approved',
  defer: 'deferred',
  reject: 'rejected',
  tag: 'tagged',
};

const LOADING_COMMENTS_MESSAGING = 'Loading comments.';
const NO_COMMENTS_MESSAGING = 'No matching comments found.';

const STYLES = stylesheet({
  container: {
    height: '100%',
    overflowY: 'scroll',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
  },

  buttonContainer: {
    alignItems: 'center',
    backgroundColor: NICE_MIDDLE_BLUE,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    padding: `0px ${GUTTER_DEFAULT_SPACING}px 0 0`,
    width: '100%',
  },

  buttonContainerStuck: {
    left: 0,
    position: 'fixed',
    top: HEADER_HEIGHT,
    padding: `0px ${GUTTER_DEFAULT_SPACING}px`,
    zIndex: STICKY_Z_INDEX,
  },

  commentCount: {
    ...ARTICLE_CATEGORY_TYPE,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    textAlign: 'left',
    marginLeft: `${GUTTER_DEFAULT_SPACING * 2}px`,
  },

  moderateButtons: {
    display: 'flex',
    position: 'relative',
    right: `${-GUTTER_DEFAULT_SPACING}px`,
  },

  commentActionButton: {
    padding: `${GUTTER_DEFAULT_SPACING}px ${GUTTER_DEFAULT_SPACING}px  ${GUTTER_DEFAULT_SPACING}px  0`,
  },

  filler: {
    backgroundColor: NICE_MIDDLE_BLUE,
    height: 0,
  },

  buttonContainerFiller: {
    height: ACTION_BAR_HEIGHT_FIXED,
  },

  actionToastCount: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    lineHeight: 1.5,
    textIndent: 4,
  },

  scrim: {
    zIndex: SCRIM_Z_INDEX,
    background: 'none',
  },

  listContainer: {
    height: `calc(100% - ${ACTION_BAR_HEIGHT_FIXED}px)`,
  },

  topSelectRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING * 2}px`,
    boxSizing: 'border-box',
    backgroundColor: NICE_MIDDLE_BLUE,
    height: HEADER_HEIGHT,
  },

  dropdown: {
    position: 'relative',
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },

  select: {
    ...SELECT_ELEMENT,
    paddingRight: `${(ARROW_SIZE * 2) + (BOX_DEFAULT_SPACING * 2)}px`,
    position: 'relative',
    zIndex: BASE_Z_INDEX,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    ':focus': {
      outline: 0,
      borderBottom: `1px solid ${LIGHT_PRIMARY_TEXT_COLOR}`,
    },
  },

  arrow: {
    position: 'absolute',
    zIndex: BASE_Z_INDEX,
    right: '0px',
    top: '8px',
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderTop: `${ARROW_SIZE}px solid ${LIGHT_PRIMARY_TEXT_COLOR}`,
    display: 'block',
    height: 0,
    width: 0,
    marginLeft: `${BOX_DEFAULT_SPACING}px`,
    marginRight: `${BOX_DEFAULT_SPACING}px`,
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
    color: NICE_MIDDLE_BLUE,
    cursor: 'pointer',
    padding: '8px 20px',
    textAlign: 'left',
    width: '100%',

    ':hover': {
      backgroundColor: NICE_MIDDLE_BLUE,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },

    ':focus': {
      backgroundColor: NICE_MIDDLE_BLUE,
      color: LIGHT_PRIMARY_TEXT_COLOR,
      outline: 0,
    },
  },

  commentsNotFoundMessaging: {
    padding: `${GUTTER_DEFAULT_SPACING}px 0`,
    marginLeft: GUTTER_DEFAULT_SPACING,
  },

  toggleLabel: {
    ...ARTICLE_CATEGORY_TYPE,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    color: LIGHT_PRIMARY_TEXT_COLOR,
  },
});

export interface INewCommentsProps extends WithRouterProps {
  article?: IArticleModel;
  preselects?: List<IPreselectModel>;
  commentScores: List<ICommentScoredModel | ICommentDatedModel>;
  isLoading: boolean;
  selectedTag?: ITagModel;
  areNoneSelected?: boolean;
  areAllSelected: boolean;
  isItemChecked(id: string): boolean;
  tags: List<ITagModel>;
  rules?: List<IRuleModel>;
  getLinkTarget(comment: ICommentModel): string;
  textSizes?: Map<number, number>;
  tagComments?(ids: Array<string>, tagId: string): any;
  dispatchAction?(action: ICommentAction, idsToDispatch: Array<string>): any;
  removeCommentScore?(idsToDispatch: Array<string>): any;
  toggleSelectAll?(): any;
  toggleSingleItem({ id }: { id: string }): any;
  getComment?(id: string): any;
  setCommentModerationStatus?(
    commentIds: Array<string>,
    action: string,
  ): any;
  loadData(
    categoryId: string | null,
    articleId: string | null,
    tag: string,
    pos1: number,
    pos2: number,
    sort: string,
  ): void;
  loadScoresForCommentId?(id: string): void;
  getTagIdsAboveThresholdByCommentId?(commentId: string): Set<string>;
  confirmCommentSummaryScore?(id: string, tagId: string): void;
  rejectCommentSummaryScore?(id: string, tagId: string): void;
}

export interface INewCommentsState {
  categoryId?: ModelId;
  articleId?: ModelId;
  tag?: string;
  defaultPos1?: number;
  defaultPos2?: number;
  pos1?: number;
  pos2?: number;
  sort?: string;
  commentIds?: List<string>;
  isNavStuck?: boolean;
  isConfirmationModalVisible?: boolean;
  isRuleInfoVisible?: boolean;
  confirmationAction?: ICommentAction;
  actionCount?: number;
  actionText?: string;
  toastButtonLabel?: 'Undo';
  toastIcon?: JSX.Element;
  ruleToastIcon?: JSX.Element;
  showCount?: boolean;
  isTaggingToolTipMetaVisible?: boolean;
  taggingToolTipMetaPosition?: {
    top: number;
    left: number;
  };
  taggingToolTipPosition?: {
    top: number;
    left: number;
  };
  taggingToolTipArrowPosition: ArrowPosition;
  selectedRow?: number;
  taggingTooltipVisible?: boolean;
  moderateButtonsRef?: HTMLDivElement;
  taggingCommentId?: string;
  articleControlOpen: boolean;
  rulesInCategory?: Array<IRuleModel>;
}

export class NewComments extends React.Component<INewCommentsProps, INewCommentsState> {

  commentActionCancelled = false;
  overflowContainer: HTMLDivElement = null;
  listContainerRef: any = null;
  batchContainer: any = null;
  batchContainerHeight: number = null;

  state: INewCommentsState = {
    isNavStuck: false,
    isConfirmationModalVisible: false,
    isRuleInfoVisible: false,
    confirmationAction: null,
    actionCount: 0,
    actionText: '',
    toastButtonLabel: null,
    toastIcon: null,
    ruleToastIcon: null,
    showCount: false,
    isTaggingToolTipMetaVisible: false,
    taggingToolTipMetaPosition: {
      top: 0,
      left: 0,
    },
    taggingToolTipPosition: {
      top: 0,
      left: 0,
    },
    taggingToolTipArrowPosition: null,
    selectedRow: null,
    taggingTooltipVisible: false,
    taggingCommentId: null,
    moderateButtonsRef: null,
    articleControlOpen: false,
  };

  static getDerivedStateFromProps(props: INewCommentsProps, state: INewCommentsState) {
    let preselect: IPreselectModel;
    let categoryId = props.params.categoryId;
    const articleId = props.params.articleId;
    const tag = props.params.tag;
    if (props.article) {
      categoryId = props.article.categoryId;
    }
    if (props.preselects) {
      if (categoryId && categoryId !== 'all' && props.selectedTag) {
        preselect = props.preselects.find((p) => (p.categoryId === categoryId && p.tagId === props.selectedTag.id));
      }
      if (!preselect && categoryId && categoryId !== 'all') {
        preselect = props.preselects.find((p) => (p.categoryId === categoryId && !p.tagId));
      }
      if (!preselect && props.selectedTag) {
        preselect = props.preselects.find((p) => (!p.categoryId && p.tagId === props.selectedTag.id));
      }
      if (!preselect) {
        preselect = props.preselects.find((p) => (!p.categoryId && !p.tagId));
      }
    }

    const defaultPos1 = preselect ? preselect.lowerThreshold : DEFAULT_DRAG_HANDLE_POS1;
    const defaultPos2 = preselect ? preselect.upperThreshold : DEFAULT_DRAG_HANDLE_POS2;
    const pos1 = props.location.query.pos1 ? Number.parseFloat(props.location.query.pos1) : defaultPos1;
    const pos2 = props.location.query.pos2 ? Number.parseFloat(props.location.query.pos2) : defaultPos2;
    const sort = props.location.query.sort || DEFAULT_SORT;

    const commentIds = getCommentIDsInRange(
      props.commentScores,
      pos1,
      pos2,
      props.params.tag === 'DATE',
    );

    let rulesInCategory: List<IRuleModel>;
    if (props.rules) {
      if (categoryId && categoryId !== 'all') {
        rulesInCategory = props.rules.filter((r) => (r.categoryId === categoryId || !r.categoryId)) as List<IRuleModel>;
      }
      else {
        rulesInCategory = props.rules.filter((r) => (!r.categoryId)) as List<IRuleModel>;
      }
    }

    if ((categoryId !== state.categoryId) || (articleId !== state.articleId) || (tag !== state.tag) ||
        (pos1 !== state.pos1) || (pos2 !== state.pos2) || (sort !== state.sort)) {
      props.loadData(categoryId, articleId, tag, pos1, pos2, sort);
    }

    return {
      categoryId,
      articleId,
      tag,
      commentIds,
      defaultPos1,
      defaultPos2,
      pos1,
      pos2,
      sort,
      rulesInCategory,
    };
  }

  async componentDidUpdate(_prevProps: INewCommentsProps) {
    // We need to wait for commentIDsInRange to load so we can check that against the saved row
    const commentId = getReturnSavedCommentRow();

    if ((typeof commentId !== 'undefined') && !this.props.isLoading && this.state.isNavStuck === false && this.state.commentIds.size > 0 ) {

      if (!this.props.getComment(commentId)) {
        return false;
      }

      // need to wait to make sure dom and other items are loaded before scrolling you down to the saved comment
      // Maybe we need a better has loaded thing to see if a single row has been rendered and bubble that up to here?
      setTimeout(() => {
        this.overflowContainer.scrollTop = this.batchContainer.clientHeight;
        this.setState({
          isNavStuck: true,
        });
      }, 60);

      const row = this.state.commentIds.findIndex((idInRange) => idInRange === commentId);
      this.setState({ selectedRow: row });
      clearReturnSavedCommentRow();
    }
  }

  componentDidMount() {
    keyboardJS.bind('escape', this.onPressEscape);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.onPressEscape);
  }

  @autobind
  onPressEscape() {
    this.setState({
      taggingTooltipVisible: false,
      isConfirmationModalVisible: false,
      isRuleInfoVisible: false,
      isTaggingToolTipMetaVisible: false,
    });
  }

  @autobind
  saveOverflowContainerRef(ref: HTMLDivElement) {
    this.overflowContainer = ref;
  }

  @autobind
  saveBatchContainerRef(ref: HTMLDivElement) {
    this.batchContainer = ref;
  }

  @autobind
  saveListContainerRef(ref: HTMLDivElement) {
    this.listContainerRef = ref;
  }

  @autobind
  handleAssignTagsSubmit(selectedTagIds: Set<string>) {
    const {
      confirmCommentSummaryScore,
      rejectCommentSummaryScore,
      getTagIdsAboveThresholdByCommentId,
    } = this.props;
    const { taggingCommentId } = this.state;

    selectedTagIds.forEach((tagId) => {
      confirmCommentSummaryScore(taggingCommentId, tagId);
    });

    const rejectedTags = getTagIdsAboveThresholdByCommentId(taggingCommentId).subtract(selectedTagIds);
    rejectedTags.forEach((tagId) => {
      rejectCommentSummaryScore(taggingCommentId, tagId);
    });

    this.dispatchConfirmedAction('reject', [taggingCommentId]);
    this.setState({
      taggingTooltipVisible: false,
      taggingCommentId: null,
    });
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
      top: rect.top + (rect.height / 2) - HEADER_HEIGHT,
      left: rect.left + (rect.width / 2) - 10,
    };
  }

  @autobind
  async handleRejectWithTag(
    commentId: string,
    tooltipRef: HTMLDivElement,
  ) {
    // we need to load the comment data so we can asses all the scores
    await this.props.loadScoresForCommentId(commentId);
    const tooltipPosition = this.getModerateButtonsPosition(tooltipRef);
    let arrowPosition: ArrowPosition;
    const top = tooltipPosition.top;
    // unfortunate use of magic numbers to work on minimum screen height of 768 for ipad

    if (top > window.innerHeight - 280) {
      arrowPosition = 'leftBottom';
    } else if (top < window.innerHeight - 490) {
      arrowPosition = 'leftTop';
    } else {
      arrowPosition = 'leftCenter';
    }

    this.setState({
      taggingCommentId: commentId,
      taggingToolTipPosition: tooltipPosition,
      taggingTooltipVisible: true,
      taggingToolTipArrowPosition: arrowPosition,
      moderateButtonsRef: tooltipRef,
    });
  }

  render() {
    const {
      article,
      commentScores,
      textSizes,
      getLinkTarget,
      areNoneSelected,
      areAllSelected,
      isItemChecked,
      tags,
      selectedTag,
      isLoading,
      getTagIdsAboveThresholdByCommentId,
    } = this.props;

    const {
      pos1,
      pos2,
      commentIds,
      isNavStuck,
      isConfirmationModalVisible,
      isRuleInfoVisible,
      isTaggingToolTipMetaVisible,
      taggingToolTipMetaPosition,
      taggingToolTipPosition,
      taggingToolTipArrowPosition,
      selectedRow,
      taggingTooltipVisible,
      taggingCommentId,
      rulesInCategory,
    } = this.state;

    const IS_SMALL_SCREEN = window.innerWidth < 1024;

    let filterSortOptions = List([
      TagModel({
        id: '-1',
        label: 'Newest',
        key: 'newest',
        color: '',
      }),
      TagModel({
        id: '-2',
        label: 'Oldest',
        key: 'oldest',
        color: '',
      }),
    ]);

    switch (selectedTag && selectedTag.key) {
      case undefined:
        break;
      case 'DATE':
        break;
      case 'SUMMARY_SCORE':
        filterSortOptions = filterSortOptions
          .push(TagModel({
            id: '-3',
            label: `Highest ${selectedTag && selectedTag.label}`,
            key: 'highest',
            color: '',
          }))
          .push(TagModel({
            id: '-4',
            label: `Lowest ${selectedTag && selectedTag.label}`,
            key: 'lowest',
            color: '',
          }));
        break;
      default:
        filterSortOptions = filterSortOptions
          .push(TagModel({
            id: '-3',
            label: `Most ${selectedTag && selectedTag.label}`,
            key: 'highest',
            color: '',
          }))
          .push(TagModel({
            id: '-4',
            label: `Least ${selectedTag && selectedTag.label}`,
            key: 'lowest',
            color: '',
          }));
    }

    const tagLinkURL = this.props.params.articleId ?
      tagSelectorLink(articleBase, this.props.params.articleId, selectedTag && selectedTag.id) :
      tagSelectorLink(categoryBase, this.props.params.categoryId, selectedTag && selectedTag.id);

    const rules = selectedTag && selectedTag.key !== 'DATE' && rulesInCategory;
    const disableAllButtons = areNoneSelected || commentScores.size <= 0;
    const groupBy = (selectedTag && selectedTag.key === 'DATE') ? 'date' : 'score';

    const totalScoresInView = commentIds.size;
    let commentsMessaging: string = null;

    if (isLoading) {
      commentsMessaging = LOADING_COMMENTS_MESSAGING;
    } else {
      if (totalScoresInView === 0) {
        commentsMessaging = NO_COMMENTS_MESSAGING;
      }
    }

    const showMessaging = !!commentsMessaging;
    const selectedIdsCount = this.getSelectedIDs().length;

    return (
      <div
        ref={this.saveOverflowContainerRef}
        onScroll={this.handleContainerScroll}
        {...css(STYLES.container, isNavStuck && {width: window.innerWidth + 17, paddingRight: '17px'})}
      >
        <div ref={this.saveBatchContainerRef} >
          <div {...css(STYLES.topSelectRow)}>
            <div {...css(STYLES.dropdown)}>
              <Link {...css(STYLES.select)} to={tagLinkURL}>
                {selectedTag && selectedTag.label}
              </Link>
              <span aria-hidden="true" {...css(STYLES.arrow)} />
            </div>
            { this.props.params.articleId && (
              <ArticleControlIcon
                article={article}
                open={this.state.articleControlOpen}
                clearPopups={this.closePopup}
                openControls={this.openPopup}
                saveControls={this.applyRules}
                whiteBackground
              />
            )}
          </div>

          { selectedTag && (
            <BatchSelector
              groupBy={groupBy}
              rules={rules}
              areAutomatedRulesApplied={article && article.isAutoModerated}
              defaultSelectionPosition1={pos1}
              defaultSelectionPosition2={pos2}
              commentScores={commentScores}
              onSelectionChangeEnd={this.onBatchCommentsChangeEnd}
              automatedRuleToast={this.handleRemoveAutomatedRule}
            />
          )}
        </div>

        <div
          {...css(
            STYLES.filler,
            isNavStuck && STYLES.buttonContainerFiller,
          )}
        />

        <div
          {...css(
            STYLES.buttonContainer,
            isNavStuck && STYLES.buttonContainerStuck,
          )}
        >

          <div {...css(STYLES.commentCount)}>
            { commentScores.size > 0 && (
              <div>
                <span>{selectedIdsCount} of {commentScores.size} comments selected</span>
              </div>
            )}
          </div>

          <div {...css(STYLES.moderateButtons)}>
            <CommentActionButton
              disabled={disableAllButtons}
              style={IS_SMALL_SCREEN && STYLES.commentActionButton}
              label="Approve"
              onClick={partial(
                this.triggerActionToast,
                'approve',
                selectedIdsCount,
                this.dispatchConfirmedAction,
              )}
              icon={(
                  <ApproveIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />
              )}
            />

            <CommentActionButton
              disabled={disableAllButtons}
              style={IS_SMALL_SCREEN && STYLES.commentActionButton}
              label="Reject"
              onClick={partial(
                this.triggerActionToast,
                'reject',
                selectedIdsCount,
                this.dispatchConfirmedAction,
              )}
              icon={(
                <RejectIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />
              )}
            />

            <CommentActionButton
              disabled={disableAllButtons}
              style={IS_SMALL_SCREEN && STYLES.commentActionButton}
              label="Defer"
              onClick={partial(
                this.triggerActionToast,
                'defer',
                selectedIdsCount,
                this.dispatchConfirmedAction,
              )}
              icon={(
                <DeferIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />
              )}
            />

            <div {...css(STYLES.dropdown)}>
              <CommentActionButton
                style={IS_SMALL_SCREEN && STYLES.commentActionButton}
                disabled={disableAllButtons}
                buttonRef={this.calculateTaggingTriggerPosition}
                label="Tag"
                onClick={this.toggleTaggingToolTip}
                icon={(
                  <AddIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />
                )}
              />
              {isTaggingToolTipMetaVisible && (
                <ToolTip
                  arrowPosition="topRight"
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
                    }}
                  >
                    <div {...css(STYLES.toolTipWithTagsContainer)}>
                      <ul {...css(STYLES.toolTipWithTagsUl)}>
                        {tags && tags.map((t, i) => (
                          <li key={t.id}>
                            <button
                              onClick={partial(this.onTagButtonClick, t.id)}
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
            </div>
          </div>
        </div>

        {/* Table View */}
        <div ref={this.saveListContainerRef}>
          { showMessaging ? (
            <p {...css(STYLES.commentsNotFoundMessaging)}>{commentsMessaging}</p>
          ) : (
            <CommentList
              ownerHeight={window.innerHeight - (this.listContainerRef && this.listContainerRef.getBoundingClientRect().top)}
              heightOffset={HEADER_HEIGHT - ACTION_BAR_HEIGHT_FIXED + 5}
              textSizes={textSizes}
              commentIds={commentIds}
              selectedTag={selectedTag}
              commentScores={commentScores}
              areAllSelected={areAllSelected}
              getLinkTarget={getLinkTarget}
              isItemChecked={isItemChecked}
              onSelectAllChange={this.onSelectAllChange}
              onSelectionChange={this.onSelectionChange}
              showAllComments={isNavStuck}
              tags={tags}
              onRejectWithTag={this.handleRejectWithTag}
              tagRejectionModalVisible={{
                id: taggingCommentId,
                isVisible: taggingTooltipVisible,
              }}
              requireReasonForReject={REQUIRE_REASON_TO_REJECT}
              taggingTooltipVisible={taggingTooltipVisible}
              sortOptions={filterSortOptions}
              getCurrentSort={this.getCurrentSort}
              onSortChange={this.onSortChange}
              onCommentClick={this.saveCommentRow}
              scrollToRow={selectedRow}
              totalItems={commentIds.size}
              triggerActionToast={this.triggerActionToast}
              dispatchConfirmedAction={this.dispatchConfirmedAction}
              displayArticleTitle={!!this.props.params.categoryId}
              onTableScroll={this.handleTableScroll}
            />
          )}
        </div>

        <Scrim
          key="confirmationScrim"
          scrimStyles={{...STYLES.scrim, ...SCRIM_STYLE.scrim}}
          isVisible={isConfirmationModalVisible}
          onBackgroundClick={this.confirmationClose}
        >
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
            }}
          >
            <ToastMessage
              icon={this.state.toastIcon}
              buttonLabel={this.state.toastButtonLabel}
              onClick={this.handleUndoClick}
            >
              <div key="toastContent">
                { this.state.showCount && (
                  <span key="toastCount" {...css(STYLES.actionToastCount)}>
                    {this.state.toastIcon}
                    {this.state.actionCount}
                  </span>
                )}
                <p key="actionText">{this.state.actionText}</p>
              </div>
            </ToastMessage>
          </FocusTrap>
        </Scrim>

        <Scrim
          key="ruleScrim"
          scrimStyles={{...STYLES.scrim, ...SCRIM_STYLE.scrim}}
          isVisible={isRuleInfoVisible}
          onBackgroundClick={this.onRuleInfoClose}
        >
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
            }}
          >
            <ToastMessage icon={this.state.ruleToastIcon}>
              <p>{this.state.actionText}</p>
            </ToastMessage>
          </FocusTrap>
        </Scrim>
        {tags && taggingTooltipVisible && (
          <ToolTip
            arrowPosition={taggingToolTipArrowPosition}
            backgroundColor={WHITE_COLOR}
            hasDropShadow
            isVisible={taggingTooltipVisible}
            onDeactivate={this.onTaggingTooltipClose}
            position={taggingToolTipPosition}
            size={16}
            zIndex={SCRIM_Z_INDEX}
          >
            <FocusTrap
              focusTrapOptions={{
                clickOutsideDeactivates: true,
              }}
            >
              <AssignTagsForm
                tags={tags}
                tagsPreselected={getTagIdsAboveThresholdByCommentId(taggingCommentId)}
                onSubmit={this.handleAssignTagsSubmit}
              />
            </FocusTrap>
          </ToolTip>
        )}
      </div>
    );
  }

  @autobind
  handleTableScroll() {
    if (!this.state.moderateButtonsRef) {
      return true;
    }
    const buttonPosition = this.getModerateButtonsPosition(this.state.moderateButtonsRef);
    if (buttonPosition.top <= HEADER_HEIGHT + ACTION_BAR_HEIGHT_FIXED) {
      this.setState({
        taggingTooltipVisible: false,
      });

      return true;
    }
    this.setState({
      taggingToolTipPosition: buttonPosition,
    });

    return true;
  }

  @autobind
  handleContainerScroll(_: any) {
    if (this.state.moderateButtonsRef) {
      this.setState({
        taggingToolTipPosition: this.getModerateButtonsPosition(this.state.moderateButtonsRef),
      });
    }
    // Set this once so we don't recheck client height on every scroll tick
    if (!this.batchContainerHeight) {
      this.batchContainerHeight = this.batchContainer.clientHeight;
    }
    const {
      isNavStuck,
    } = this.state;

    if (isNavStuck && (this.overflowContainer.scrollTop < this.batchContainerHeight)) {
      // reset the amount of visible items, so it can scroll properly again
      this.setState({
        isNavStuck: false,
        selectedRow: null,
      });
    } else if (!isNavStuck && (this.overflowContainer.scrollTop >= this.batchContainerHeight)) {
      this.setState({
        isNavStuck: true,
      });
    }
  }

  matchAction(action: ICommentAction) {
    let showActionIcon;

    if (action === 'approve') {
      showActionIcon = <ApproveIcon {...css({ fill: DARK_COLOR })} />;
    } else if (action === 'reject') {
      showActionIcon = <RejectIcon {...css({ fill: DARK_COLOR })} />;
    } else if (action === 'highlight') {
      showActionIcon = <HighlightIcon {...css({ fill: DARK_COLOR })} />;
    } else if (action === 'defer') {
      showActionIcon = <DeferIcon {...css({ fill: DARK_COLOR })} />;
    }

    return showActionIcon;
  }

  @autobind
  triggerActionToast(action: ICommentAction, count: number, callback: (action?: ICommentAction) => any) {
    this.setState({
      isConfirmationModalVisible: true,
      confirmationAction: action,
      actionCount: count,
      actionText: `Comment${count > 1 ? 's' : ''} ` + ACTION_PLURAL[action],
      toastButtonLabel: 'Undo',
      toastIcon: this.matchAction(action),
      showCount: true,
    });
    setTimeout(async () => {
      if (this.commentActionCancelled) {
        this.commentActionCancelled = false;
        this.confirmationClose();

        return false;
      } else {
        this.setState({
          toastButtonLabel: null,
        });
        await callback(action);
        this.confirmationClose();
      }
    }, TOAST_DELAY);
  }

  @autobind handleRemoveAutomatedRule(rule: IRuleModel) {
    const icon = this.matchAction(convertServerAction(rule.action));

    this.setState({
      isRuleInfoVisible: true,
      actionText: 'These comments are auto ' + rule.action,
      ruleToastIcon: icon,
    });
  }

  @autobind
  calculateTaggingTriggerPosition(ref: any) {
    if (!ref) {
      return;
    }

    const buttonRect = ref.getBoundingClientRect();

    this.setState({
      taggingToolTipMetaPosition: {
        top: buttonRect.height,
        left: buttonRect.width - 5,
      },
    });
  }

  @autobind
  onTagButtonClick(tagId: string) {
    const ids = this.getSelectedIDs();
    this.triggerActionToast('tag', ids.length, () => this.props.tagComments(ids, tagId));
    this.toggleTaggingToolTip();
  }

  @autobind
  toggleTaggingToolTip() {
    this.setState({
      isTaggingToolTipMetaVisible: !this.state.isTaggingToolTipMetaVisible,
    });
  }

  @autobind
  async dispatchConfirmedAction(action: ICommentAction, ids?: Array<string>) {

    const idsToDispatch = ids || this.getSelectedIDs();

    this.props.setCommentModerationStatus(
      idsToDispatch,
      action,
    );

    // Send event
    await this.props.dispatchAction(action, idsToDispatch);

    // remove these from the ui because they are now 'moderated'
    this.props.removeCommentScore(idsToDispatch);
  }

  @autobind
  getSelectedIDs(): Array<string> {
    return this.state.commentIds
        .filter((commentId) => this.props.isItemChecked(commentId)).toArray();
  }

  @autobind
  confirmationClose() {
    this.setState({ isConfirmationModalVisible: false });
  }

  @autobind
  onRuleInfoClose() {
    this.setState({ isRuleInfoVisible: false });
  }

  @autobind
  onTaggingTooltipClose() {
    this.setState({ taggingTooltipVisible: false });
  }

  @autobind
  handleUndoClick() {
    this.commentActionCancelled = true;
    this.confirmationClose();
  }

  @autobind
  setQueryStringParam(pos1: number, pos2: number, sort: string): void {
    if ((pos1 === this.state.pos1) && (pos2 === this.state.pos2) && (sort === this.state.sort)) {
      return;
    }

    const query: any = {};
    if (pos1 !== this.state.defaultPos1) {
      query['pos1'] = pos1;
    }
    if (pos2 !== this.state.defaultPos2) {
      query['pos2'] = pos2;
    }
    if (sort !== DEFAULT_SORT) {
      query['sort'] = sort;
    }
    this.props.router.replace({
      pathname: this.props.location.pathname,
      query,
    });
  }

  @autobind
  saveCommentRow(commentId: string): void {
    setReturnSavedCommentRow(commentId);
  }

  @autobind
  getCurrentSort(): string {
    return this.state.sort;
  }

  @autobind
  onSortChange(event: React.FormEvent<any>) {
    this.setQueryStringParam(this.state.pos1, this.state.pos2, (event.target as any).value);
  }

  @autobind
  onBatchCommentsChangeEnd(_commentIds: Array<number>, pos1: number, pos2: number) {
    this.setQueryStringParam(pos1, pos2, this.state.sort);
  }

  @autobind
  async onSelectAllChange() {
    await this.props.toggleSelectAll();
  }

  @autobind
  async onSelectionChange(id: string) {
    await this.props.toggleSingleItem({ id });
  }

  @autobind
  openPopup() {
    this.setState({articleControlOpen: true});
  }

  @autobind
  closePopup() {
    this.setState({articleControlOpen: false});
  }

  @autobind
  applyRules(isCommentingEnabled: boolean, isAutoModerated: boolean): void {
    this.closePopup();
    updateArticle(this.props.article.id, isCommentingEnabled, isAutoModerated);
  }
}
