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

import { IArticleModel, ICommentModel, ITagModel, TagModel } from '../../../../../models';
import { ICommentAction, IConfirmationAction } from '../../../../../types';
import { ArticleControlIcon, AssignTagsForm, Scrim } from '../../../../components';
import {
  AddIcon,
  ApproveIcon,
  ArrowPosition,
  CommentActionButton,
  CommentList,
  DeferIcon,
  HighlightIcon,
  RejectIcon,
  ToastMessage,
  ToolTip,
} from '../../../../components';
import { REQUIRE_REASON_TO_REJECT } from '../../../../config';
import { updateArticle } from '../../../../platform/dataService';
import {
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
  SHORT_SCREEN_QUERY,
  TOOLTIP_Z_INDEX,
  WHITE_COLOR,
} from '../../../../styles';
import { partial } from '../../../../util';
import { css, stylesheet } from '../../../../utilx';
import { getSortDefault } from '../../../../utilx';

const ARROW_SIZE = 6;
// magic number = height of the moderation status dropdown and the row of tabs
const MODERATION_CONTAINER_HEIGHT = 269;
const MODERATION_CONTAINER_HEIGHT_SHORT = 202;
const TOAST_DELAY = 6000;

const BATCH_SELECT_BY_STATUS = 'status';
const BATCH_SELECT_BY_DATE = 'date';

const sortOptions = List.of(
  TagModel({
    key: 'newest',
    label: 'Newest',
    color: null,
  }),
  TagModel({
    key: 'oldest',
    label: 'Oldest',
    color: null,
  }),
  TagModel({
    key: 'updated',
    label: 'Last Modified',
    color: null,
  }),
);

const ACTION_PLURAL: {
  [key: string]: string;
} = {
  highlight: 'highlighted',
  approve: 'approved',
  defer: 'deferred',
  reject: 'rejected',
  tag: 'tagged',
};

const STYLES = stylesheet({
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    backgroundColor: NICE_MIDDLE_BLUE,
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
    boxSizing: 'border-box',
  },

  moderatedInfo: {
    color: LIGHT_PRIMARY_TEXT_COLOR,
  },

  actionLabel: {
    display: 'inline-block',
    textTransform: 'capitalize',
    marginLeft: 4,
  },

  moderateButtons: {
    display: 'flex',
  },

  topSelectRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
    boxSizing: 'border-box',
    backgroundColor: NICE_MIDDLE_BLUE,
    height: HEADER_HEIGHT,
    [SHORT_SCREEN_QUERY]: {
      height: '56px',
    },
  },

  dropdown: {
    position: 'relative',
    width: 170,
  },

  select: {
    ...SELECT_ELEMENT,
    paddingRight: `${(ARROW_SIZE * 2) + (BOX_DEFAULT_SPACING * 2)}px`,
    position: 'relative',
    zIndex: BASE_Z_INDEX,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    appearance: 'none', // SELECT_ELEMENT mixin not passing this down?
    WebkitAppearance: 'none', // Not getting prefixed either
    borderBottom: `2px solid transparent`,
    ':focus': {
      outline: 0,
      borderBottom: `2px solid ${WHITE_COLOR}`,
      borderRadius: 0,
    },
  },

  arrow: {
    position: 'absolute',
    zIndex: BASE_Z_INDEX,
    right: '8px',
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
    },
  },

  commentsNotFoundMessaging: {
    marginLeft: GUTTER_DEFAULT_SPACING,
    padding: `${GUTTER_DEFAULT_SPACING}px 0`,
  },
});

const LOADING_COMMENTS_MESSAGING = 'Loading comments.';
const NO_COMMENTS_MESSAGING = 'No matching comments found.';

export interface IModeratedCommentsProps extends WithRouterProps {
  isLoading: boolean;
  getCurrentColumnSort(key: string): string;
  tags: List<ITagModel>;
  moderatedComments: Map<string, List<number>>;
  isItemChecked(id: string): boolean;
  areNoneSelected?: boolean;
  areAllSelected: boolean;
  getLinkTarget(comment: ICommentModel): string;
  article?: IArticleModel;
  loadData?(categoryId: string, articleId: string, tag: string): void;
  tagComments?(ids: Array<string>, tagId: string): any;
  dispatchAction?(action: IConfirmationAction, idsToDispatch: Array<string>): any;
  toggleSelectAll?(): any;
  toggleSingleItem({ id }: { id: string }): any;
  textSizes?: Map<number, number>;
  changeSort(newSort: string): Promise<void>;
  setCommentModerationStatusForArticle?(
    commentIds: Array<string>,
    moderationAction: IConfirmationAction,
    currentModeration: string,
  ): any;
  setCommentModerationStatusForCategory?(
    commentIds: Array<string>,
    moderationAction: IConfirmationAction,
    currentModeration: string,
  ): any;
  loadScoresForCommentId?(id: string): void;
  getTagIdsAboveThresholdByCommentId?(commentId: string): Set<string>;
}

export interface IModeratedCommentsState {
  commentIds?: List<string>;
  allModeratedCommentIds?: List<string>;
  isConfirmationModalVisible?: boolean;
  confirmationAction?: IConfirmationAction;
  selectedItems?: any;
  currentSelect?: string;
  updateCounter?: number;
  actionLabel: string;
  actionText?: string;
  actionCount?: number;
  toastButtonLabel?: 'Undo' | 'Remove rule';
  toastIcon?: JSX.Element;
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
  updatedItems?: any;
  taggingCommentId?: string;
  taggingTooltipVisible?: boolean;
  taggingToolTipArrowPosition?: ArrowPosition;
  moderateButtonsRef?: HTMLDivElement;
  loadedCategoryId?: string;
  loadedArticleId?: string;
  loadedTag?: string;
  articleControlOpen: boolean;
}

export class ModeratedComments
  extends React.Component<IModeratedCommentsProps, IModeratedCommentsState> {

  commentActionCancelled = false;

  state: IModeratedCommentsState = {
    isConfirmationModalVisible: false,
    confirmationAction: null,
    selectedItems: [],
    currentSelect: BATCH_SELECT_BY_STATUS,
    updateCounter: 0,
    actionLabel: '',
    actionText: '',
    actionCount: 0,
    toastButtonLabel: null,
    toastIcon: null,
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
    updatedItems: [],
    taggingCommentId: null,
    taggingTooltipVisible: false,
    moderateButtonsRef: null,
    articleControlOpen: false,
  };

  componentDidMount() {
    keyboardJS.bind('escape', this.onPressEscape);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.onPressEscape);
  }

  static getDerivedStateFromProps(nextProps: IModeratedCommentsProps, prevState: IModeratedCommentsState) {
    if (prevState.loadedCategoryId !== nextProps.params.categoryId ||
        prevState.loadedArticleId !== nextProps.params.articleId ||
        prevState.loadedTag !== nextProps.params.tag) {
      nextProps.loadData(nextProps.params.categoryId, nextProps.params.articleId, nextProps.params.tag);
    }

    const actionLabel = nextProps.params.tag;
    if (prevState.actionLabel !== actionLabel) {
      nextProps.changeSort(getSortDefault(actionLabel));
    }

    const commentIds = nextProps.moderatedComments.get(nextProps.params.tag);
    const allModeratedCommentIds = nextProps.moderatedComments.reduce((sum, tagList) =>
      sum.union(tagList.toSet()), Set());

    return {
      actionLabel,
      commentIds,
      allModeratedCommentIds,
      loadedCategoryId: nextProps.params.categoryId,
      loadedArticleId: nextProps.params.articleId,
      loadedTag: nextProps.params.tag,
    };
  }

  render() {
    const {
      isLoading,
      isItemChecked,
      areNoneSelected,
      areAllSelected,
      tags,
      moderatedComments,
      getLinkTarget,
      textSizes,
      getTagIdsAboveThresholdByCommentId,
    } = this.props;

    const {
      commentIds,
      allModeratedCommentIds,
      isConfirmationModalVisible,
      isTaggingToolTipMetaVisible,
      taggingToolTipMetaPosition,
      taggingToolTipPosition,
      taggingTooltipVisible,
      taggingCommentId,
      taggingToolTipArrowPosition,
      loadedArticleId,
    } = this.state;

    const selectedIdsLength = moderatedComments && this.getSelectedIDs().length;

    let commentsMessaging = isLoading ? LOADING_COMMENTS_MESSAGING : null;
    if (!isLoading && commentIds.size === 0) {
      commentsMessaging = NO_COMMENTS_MESSAGING;
    }

    const listHeightOffset = window.matchMedia(SHORT_SCREEN_QUERY) ?
      MODERATION_CONTAINER_HEIGHT_SHORT + HEADER_HEIGHT : MODERATION_CONTAINER_HEIGHT + HEADER_HEIGHT;

    const showMessaging = !!commentsMessaging;

    return (
      <div {...css({height: '100%'})}>

        <div {...css(STYLES.topSelectRow)}>
          <div {...css(STYLES.dropdown)}>
            <select
              value={this.state.currentSelect}
              onChange={this.onSelectChange}
              id="sorted-type"
              {...css(STYLES.select)}
            >
              <option value={BATCH_SELECT_BY_DATE}>Date</option>
              <option value={BATCH_SELECT_BY_STATUS}>Moderation status</option>
            </select>
            <span aria-hidden="true" {...css(STYLES.arrow)} />
          </div>
          {this.props.params.articleId && (
            <ArticleControlIcon
              article={this.props.article}
              open={this.state.articleControlOpen}
              clearPopups={this.closePopup}
              openControls={this.openPopup}
              saveControls={this.applyRules}
              whiteBackground
            />
          )}
        </div>

        <div {...css(STYLES.row)}>
          <div {...css(STYLES.moderatedInfo)}>{selectedIdsLength}
            {selectedIdsLength === 1 ? ' comment ' : ' comments '}selected
          </div>
          <div {...css(STYLES.moderateButtons)}>
            <CommentActionButton
              disabled={areNoneSelected}
              label="Approve"
              onClick={partial(
                this.triggerActionToast,
                'approve',
                selectedIdsLength,
                partial(this.dispatchConfirmedAction, 'approve', this.getSelectedIDs()),
              )}
              icon={(
                <ApproveIcon {...css({fill: LIGHT_PRIMARY_TEXT_COLOR})} />
              )}
            />

            <CommentActionButton
              disabled={areNoneSelected}
              label="Reject"
              onClick={partial(
                this.triggerActionToast,
                'reject',
                selectedIdsLength,
                partial(this.dispatchConfirmedAction, 'reject', this.getSelectedIDs()),
              )}
              icon={(
                <RejectIcon {...css({fill: LIGHT_PRIMARY_TEXT_COLOR})} />
              )}
            />

            <CommentActionButton
              disabled={areNoneSelected}
              label="Highlight"
              onClick={partial(
                this.triggerActionToast,
                'highlight',
                selectedIdsLength,
                partial(this.dispatchConfirmedAction, 'highlight', this.getSelectedIDs()),
              )}
              icon={(
                <HighlightIcon {...css({fill: LIGHT_PRIMARY_TEXT_COLOR})} />
              )}
            />

            <CommentActionButton
              disabled={areNoneSelected}
              label="Defer"
              onClick={partial(
                this.triggerActionToast,
                'defer',
                selectedIdsLength,
                partial(this.dispatchConfirmedAction, 'defer', this.getSelectedIDs()),
              )}
              icon={(
                <DeferIcon {...css({fill: LIGHT_PRIMARY_TEXT_COLOR})} />
              )}
            />

            <div {...css({position: 'relative'})}>
              <CommentActionButton
                disabled={areNoneSelected}
                buttonRef={this.calculateTaggingTriggerPosition}
                label="Tag"
                onClick={this.toggleTaggingToolTip}
                icon={(
                  <AddIcon {...css({fill: LIGHT_PRIMARY_TEXT_COLOR})} />
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
                </ToolTip>
              )}
            </div>
          </div>
        </div>

        {/* Table View */}
        <div>
          {showMessaging ? (
            <p {...css(STYLES.commentsNotFoundMessaging)}>{commentsMessaging}</p>
          ) : (
            <CommentList
              heightOffset={listHeightOffset}
              textSizes={textSizes}
              commentIds={this.state.currentSelect === BATCH_SELECT_BY_DATE ? allModeratedCommentIds : commentIds}
              areAllSelected={areAllSelected}
              getCurrentSort={this.getCurrentSort}
              getLinkTarget={getLinkTarget}
              isItemChecked={isItemChecked}
              onSelectAllChange={this.onSelectAllChange}
              onSelectionChange={this.onSelectionChange}
              onSortChange={this.onSortChange}
              showAllComments
              sortOptions={this.getSortOptions()}
              totalItems={this.state.currentSelect === BATCH_SELECT_BY_DATE ? allModeratedCommentIds.size : commentIds.size}
              triggerActionToast={this.triggerActionToast}
              displayArticleTitle={!loadedArticleId}
              tagRejectionModalVisible={{
                id: taggingCommentId,
                isVisible: taggingTooltipVisible,
              }}
              dispatchConfirmedAction={this.dispatchConfirmedAction}
              onRejectWithTag={this.handleRejectWithTag}
              requireReasonForReject={REQUIRE_REASON_TO_REJECT}
              onTableScroll={this.handleTableScroll}
            />
          )}
        </div>

        <Scrim
          key="toastScrim"
          scrimStyles={{...STYLES.scrim, ...SCRIM_STYLE.scrim}}
          isVisible={isConfirmationModalVisible}
          onBackgroundClick={this.onConfirmationClose}
        >
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
            }}
          >
            <ToastMessage
              icon={null}
              buttonLabel={this.state.toastButtonLabel}
              onClick={this.handleUndoClick}
            >
              <div key="toastContent">
                {this.state.showCount && (
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
        {tags && taggingTooltipVisible && (
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
              position={taggingToolTipPosition}
              size={16}
              zIndex={TOOLTIP_Z_INDEX}
            >
              <AssignTagsForm
                tags={tags}
                onSubmit={this.handleAssignTagsSubmit}
                tagsPreselected={getTagIdsAboveThresholdByCommentId(taggingCommentId)}
              />
            </ToolTip>
          </FocusTrap>
        )}
      </div>
    );
  }

  matchAction(action: string): any {
    let showActionIcon;

    if (action === 'approve') {
      showActionIcon = <ApproveIcon {...css({ fill: DARK_COLOR })} />;
    } else if (action === 'reject') {
      showActionIcon = <RejectIcon {...css({ fill: DARK_COLOR })} />;
    } else if (action === 'highlight') {
      showActionIcon = <HighlightIcon {...css({ fill: DARK_COLOR })} />;
    } else if (action === 'defer') {
      showActionIcon = <DeferIcon {...css({ fill: DARK_COLOR })} />;
    } else if (action === 'tag') {
      showActionIcon = <AddIcon {...css({ fill: DARK_COLOR })} />;
    }

    return showActionIcon;
  }

  @autobind
  onPressEscape() {
    this.setState({
      taggingTooltipVisible: false,
      isConfirmationModalVisible: false,
      isTaggingToolTipMetaVisible: false,
    });
  }

  @autobind
  handleTableScroll() {
    if (!this.state.moderateButtonsRef) {
      return true;
    }
    const buttonPosition = this.getModerateButtonsPosition(this.state.moderateButtonsRef);
    if (buttonPosition.top <= HEADER_HEIGHT + MODERATION_CONTAINER_HEIGHT) {
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
  getSelectedIDs(): Array<string> {
    const { commentIds } = this.state;
    const selectedIds = commentIds && commentIds.filter((id) => this.props.isItemChecked(id));

    return selectedIds ? selectedIds.toArray() : [];
  }

  @autobind
  confirmationClose() {
    this.setState({ isConfirmationModalVisible: false });
  }

  @autobind
  triggerActionToast(action: ICommentAction, count: number, callback?: (action: ICommentAction) => void) {
    this.setState({
      isConfirmationModalVisible: true,
      confirmationAction: action,
      actionText: `Comments ` + ACTION_PLURAL[action],
      actionCount: count,
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

  @autobind
  onTagButtonClick(tagId: string) {
    const ids = this.getSelectedIDs();
    this.triggerActionToast('tag', ids.length, () => this.props.tagComments(ids, tagId));
    this.toggleTaggingToolTip();
  }

  @autobind
  handleActionButtonClick(action: ICommentAction) {
    this.setState({
      isConfirmationModalVisible: true,
      confirmationAction: action,
      actionText: `Comments ` + ACTION_PLURAL[action],
      toastButtonLabel: 'Undo',
      toastIcon: this.matchAction(action),
      showCount: true,
    });
    if (this.commentActionCancelled) {
      this.commentActionCancelled = false;
      this.onConfirmationClose();
    } else {
      setTimeout(() => {
        this.dispatchConfirmedAction(action, this.getSelectedIDs());
      }, TOAST_DELAY);
    }
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
        left: buttonRect.width - 10,
      },
    });
  }

  @autobind
  toggleTaggingToolTip() {
    this.setState({
      isTaggingToolTipMetaVisible: !this.state.isTaggingToolTipMetaVisible,
    });
  }

  @autobind
  handleAssignTagsSubmit(selectedTagIds: Set<string>) {
    selectedTagIds.forEach((tagId) => {
      this.props.tagComments([this.state.taggingCommentId], tagId);
    });
    this.dispatchConfirmedAction('reject', [this.state.taggingCommentId]);
    this.setState({
      taggingTooltipVisible: false,
      taggingCommentId: null,
    });
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

  @autobind
  onTaggingTooltipClose() {
    this.setState({ taggingTooltipVisible: false });
  }

  @autobind
   async dispatchConfirmedAction(action: IConfirmationAction, ids: Array<string>) {
    const mappedIds = ids.map((id) => {
      return {
        id,
        action,
      };
    });

    this.setState({
      updatedItems: [
        ...this.state.updatedItems,
        ...mappedIds,
      ],
    });

    if (this.props.article) {
      this.props.setCommentModerationStatusForArticle(
        ids,
        action,
        this.state.actionLabel,
      );
    }
    else {
      this.props.setCommentModerationStatusForCategory(
        ids,
        action,
        this.state.actionLabel,
      );
    }

    // Send event
    await this.props.dispatchAction(action, ids);
  }

  @autobind
  onConfirmationClose() {
    this.setState({isConfirmationModalVisible: false });
  }

  @autobind
  handleUndoClick() {
    this.commentActionCancelled = true;
    this.onConfirmationClose();
  }

  @autobind
  getCurrentSort() {
    return this.props.getCurrentColumnSort(this.props.params.category);
  }

  @autobind
  onSortChange(event: React.FormEvent<any>) {
    this.props.changeSort((event.target as any).value);
  }

  @autobind
  getSortOptions(): List<ITagModel> {
    const { actionLabel } = this.state;
    // Flagged is a special cases that can have a count associated with it
    // as opposed to things like Approve and Reject which are binary.
    // Here we're adding additional sort options for just that tab.

    if (actionLabel === 'flagged') {
      return sortOptions.unshift(TagModel({
        key: `${actionLabel}`,
        label: 'Unresolved flags',
        color: null,
      }));
    }

    return sortOptions;
  }

  applyActionForId(comment: ICommentModel, action: IConfirmationAction) {
    switch (action) {
      case 'approve':
        return comment.set('isAccepted', true).set('isDeferred', false);
      case 'reject':
        return comment.set('isAccepted', false).set('isDeferred', false);
      case 'highlight':
        return comment.set('isHighlighted', true);
      case 'defer':
        return comment.set('isAccepted', null).set('isDeferred', true);
      default:
        return comment;
    }
  }

  @autobind
  onSelectChange(event: React.FormEvent<any>) {
    const currentSelect = (event.target as any).value;
    this.setState({ currentSelect });
    this.props.changeSort('newest');
  }

  @autobind
  async onSelectAllChange() {
    await this.props.toggleSelectAll();

    this.setState({ updateCounter: this.state.updateCounter + 1 });
  }

  @autobind
  async onSelectionChange(id: string) {
    await this.props.toggleSingleItem({ id });

    this.setState({ updateCounter: this.state.updateCounter + 1 });
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
