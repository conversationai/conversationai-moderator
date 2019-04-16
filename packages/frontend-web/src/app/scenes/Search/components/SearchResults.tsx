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
import formatDate from 'date-fns/format';
import FocusTrap from 'focus-trap-react';
import { List, Map, Set } from 'immutable';
import keyboardJS from 'keyboardjs';
import React from 'react';

import { ISearchScope } from '../';
import {
  IArticleModel,
  ICommentModel,
  ITagModel,
  ModelId,
  TagModel,
} from '../../../../models';
import { ICommentAction, IConfirmationAction } from '../../../../types';
import {
  AddIcon,
  ApproveIcon,
  CommentActionButton,
  CommentList,
  DeferIcon,
  HighlightIcon,
  RejectIcon,
  Scrim,
  SearchIcon,
  ToastMessage,
  ToolTip,
} from '../../../components';
import { DATE_FORMAT_LONG, REQUIRE_REASON_TO_REJECT } from '../../../config';
import {
  DARK_COLOR,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
  PALE_COLOR,
  SCRIM_STYLE,
  SCRIM_Z_INDEX,
  TOOLTIP_Z_INDEX,
  WHITE_COLOR,
} from '../../../styles';
import { always, partial } from '../../../util';
import { css, stylesheet } from '../../../utilx';

const TOAST_DELAY = 6000;

let showActionIcon: JSX.Element = null;
const ACTION_PLURAL: any = {
  highlight: 'highlighted',
  approve: 'approved',
  defer: 'deferred',
  reject: 'rejected',
  tag: 'tagged',
};

const sortDefinitions: any = {
  relevance: {
    sortInfo: '',
  },
  newest: {
    sortInfo: '-sourceCreatedAt',
  },
  oldest: {
    sortInfo: 'sourceCreatedAt',
  },
};
const sortOptions = List.of(
  TagModel({
    key: 'relevance',
    label: 'Relevance',
    color: '',
  }),
  TagModel({
    key: 'newest',
    label: 'Newest',
    color: '',
  }),
  TagModel({
    key: 'oldest',
    label: 'Oldest',
    color: '',
  }),
);

const RESULTS_HEADER_HEIGHT = 50;

const STYLES = stylesheet({
  children: {
    display: 'inline-block',
  },
  placeholderBgContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: window.innerHeight - HEADER_HEIGHT - RESULTS_HEADER_HEIGHT,
    width: '100%',
  },
  placeholderBg: {
    fill: PALE_COLOR,
    width: '30%',
    height: '30%',
  },
  resultsHeader: {
    alignItems: 'center',
    backgroundColor: PALE_COLOR,
    color: MEDIUM_COLOR,
    display: 'flex',
    flexWrap: 'no-wrap',
    justifyContent: 'space-between',
    height: RESULTS_HEADER_HEIGHT,
  },
  resultsHeadline: {
    marginLeft: 29,
  },
  resultsActionHeader: {
    backgroundColor: MEDIUM_COLOR,
  },
  resultsActionHeadline: {
    color: WHITE_COLOR,
  },
  moderateButtons: {
    display: 'flex',
  },
  commentActionButton: {
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },
  dropdown: {
    position: 'relative',
  },
  scrim: {
    zIndex: SCRIM_Z_INDEX,
    background: 'none',
  },
  actionToastCount: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    lineHeight: 1.5,
    textIndent: 4,
  },
  toolTipWithTags: {
    container: {
      width: 250,
      marginRight: GUTTER_DEFAULT_SPACING,
    },

    ul: {
      listStyle: 'none',
      margin: 0,
      padding: `${GUTTER_DEFAULT_SPACING}px 0`,
    },

    button: {
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
  },
});

export interface ISearchResultsProps {
  isLoading: boolean;
  totalCommentCount: number;
  onToggleSelectAll?(): void;
  onToggleSingleItem(item: { id: string }): void;
  dispatchAction?(action: IConfirmationAction, commentIds: Array<string>): any;
  searchTerm: string;
  article: IArticleModel;
  isItemChecked(id: string): boolean;
  areNoneSelected: boolean;
  areAllSelected: boolean;
  selectedCount: number;
  allCommentIds?: List<string>;
  tags?: List<ITagModel>;
  searchReturned?: boolean;
  textSizes?: Map<number, number>;
  getLinkTarget?(comment: ICommentModel): string;
  onSearch?(scope: ISearchScope): any;
  tagComments?(ids: Array<string>, tagId: string): any;
  updateCommentState?(action: IConfirmationAction, ids: Array<string>): any;
  searchByAuthor?: boolean;
  searchByArticle?: boolean;
}

export interface ISearchResultsState {
  selectedCount?: number;
  updateCounter?: number;
  commentSortType?: string;
  isTaggingToolTipMetaVisible?: boolean;
  taggingToolTipMetaPosition?: {
    top: number;
    left: number;
  };
  isConfirmationModalVisible?: boolean;
  confirmationAction?: ICommentAction;
  toastButtonLabel?: 'Undo' | 'Remove rule';
  toastIcon?: JSX.Element;
  showCount?: boolean;
  isRuleInfoVisible?: boolean;
  actionCount?: number;
  actionText?: string;
  ruleToastIcon?: JSX.Element;
  searchReturned?: boolean;
}

export class SearchResults extends React.Component<ISearchResultsProps, ISearchResultsState> {

  commentActionCancelled = false;

  state: ISearchResultsState = {
    updateCounter: 0,
    isTaggingToolTipMetaVisible: false,
    commentSortType: this.props.searchByAuthor ? 'newest' : 'relevance',
    taggingToolTipMetaPosition: {
      top: 0,
      left: 0,
    },
    isConfirmationModalVisible: false,
    confirmationAction: null,
    actionText: '',
    toastButtonLabel: null,
    toastIcon: null,
    showCount: false,
    actionCount: 0,
    ruleToastIcon: null,
    isRuleInfoVisible: false,
  };

  componentDidMount() {
    keyboardJS.bind('escape', this.onPressEscape);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.onPressEscape);
  }

  @autobind
  onPressEscape() {
    this.setState({
      isConfirmationModalVisible: false,
      isRuleInfoVisible: false,
      isTaggingToolTipMetaVisible: false,
    });
  }

  /**
   * Tell the lazy list to re-query.
   */
  async updateScope(sort: any) {

    let newSort = sortDefinitions[sort] && sortDefinitions[sort].sortInfo;

    if (!newSort) {
      newSort = null;
    }

    await this.props.onSearch({
      term: this.props.searchTerm,
      params: {
        sort: [newSort],
        searchByAuthor: this.props.searchByAuthor,
        searchByArticle: this.props.searchByArticle,
      },
    });

    // Wait for the result to come back and then increment a counter that
    // goes to the LazyLoadComment to force it to recognize the change
    this.setState({ updateCounter: this.state.updateCounter + 1 });
  }

  @autobind
  onSortChange(event: React.FormEvent<any>) {
    const newSort = (event.target as any).value;
    this.updateScope(newSort);
    this.setState({ commentSortType: newSort });
  }

  @autobind
  getSortContentByType(comment: ICommentModel) {
    // Until we can actually sort by the other options, all moderated columns use Date
    return formatDate(comment.sourceCreatedAt, DATE_FORMAT_LONG);
  }

  applyActionForId(comment: ICommentModel, action: ICommentAction) {
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
  async onSelectAllChange() {
    this.setState({ updateCounter: this.state.updateCounter + 1 });
    await this.props.onToggleSelectAll();
  }

  @autobind
  async onSelectionChange(id: string) {
    this.setState({ updateCounter: this.state.updateCounter + 1 });
    await this.props.onToggleSingleItem({ id });
  }

  matchAction(action: ICommentAction) {
    if (action === 'approve') {
      showActionIcon = <ApproveIcon {...css({fill: DARK_COLOR})} />;
    } else if (action === 'reject') {
      showActionIcon = <RejectIcon {...css({fill: DARK_COLOR})} />;
    } else if (action === 'highlight') {
      showActionIcon = <HighlightIcon {...css({fill: DARK_COLOR})} />;
    } else if (action === 'defer') {
      showActionIcon = <DeferIcon {...css({fill: DARK_COLOR})} />;
    } else if (action === 'tag') {
      showActionIcon = <AddIcon {...css({fill: DARK_COLOR})} />;
    }

    return showActionIcon;
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
  async dispatchConfirmedAction(action: ICommentAction, ids?: Array<string>) {
    const idsToDispatch = ids || this.getSelectedIDs();
    this.props.dispatchAction(action, idsToDispatch);
    this.props.updateCommentState(action, idsToDispatch);
  }

  @autobind
  getSelectedIDs(): Array<string> {
    const ids = this.props.allCommentIds.filter((id) => (
      this.props.isItemChecked(id)
    ));

    return ids.toArray();
  }

  @autobind
  calculateTaggingTriggerPosition(ref: HTMLElement) {
    if (!ref) {
      return;
    }

    const buttonRect = ref.getBoundingClientRect();

    this.setState({
      taggingToolTipMetaPosition: {
        top: buttonRect.height / 2,
        left: (buttonRect.width / 2) - 10,
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
  onRuleInfoClose() {
    this.setState({ isRuleInfoVisible: false });
  }

  @autobind
  confirmationClose() {
    this.setState({ isConfirmationModalVisible: false });
  }

  @autobind
  onTagButtonClick(tagId: string) {
    const ids = this.getSelectedIDs();
    this.triggerActionToast('tag', ids.length, () => this.props.tagComments(ids, tagId));
    this.toggleTaggingToolTip();
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

  @autobind
  async handleAssignTagsSubmit(commentId: ModelId, selectedTagIds: Set<ModelId>) {
    selectedTagIds.forEach((tagId) => {
      this.props.tagComments([commentId], tagId);
    });
    this.dispatchConfirmedAction('reject', [commentId]);
  }

  render() {
    const {
      totalCommentCount,
      textSizes,
      searchTerm,
      isItemChecked,
      areNoneSelected,
      areAllSelected,
      selectedCount,
      tags,
      searchReturned,
      allCommentIds,
      getLinkTarget,
      isLoading,
    } = this.props;

    const {
      updateCounter,
      isTaggingToolTipMetaVisible,
      taggingToolTipMetaPosition,
      commentSortType,
      isConfirmationModalVisible,
      isRuleInfoVisible,
      actionCount,
      actionText,
      ruleToastIcon,
    } = this.state;

    return (
      <div>
        { !searchReturned && (
          <div key="searchIcon" {...css(STYLES.placeholderBgContainer)}>
            <SearchIcon {...css(STYLES.placeholderBg)}/>
          </div>
        )}
        <div key="content" {...css({backgroundColor: 'white'}, searchReturned ? {display: 'block'} : {display: 'none'})}>
          <div {...css(STYLES.resultsHeader, !areNoneSelected && STYLES.resultsActionHeader)}>
            {searchTerm && !isLoading && (
              <p {...css(STYLES.resultsHeadline, !areNoneSelected && STYLES.resultsActionHeadline)}>
                {selectedCount > 0 && `${selectedCount} / `}
                {totalCommentCount} result{totalCommentCount > 1 && 's'}
                {selectedCount > 0 || areAllSelected && ' selected'}
              </p>
            )}
            {isLoading && (
              <p {...css(STYLES.resultsHeadline, !areNoneSelected && STYLES.resultsActionHeadline)}>
                  Loading...
              </p>)}
            { !areNoneSelected && (
              <div {...css(STYLES.moderateButtons)}>
                <CommentActionButton
                  disabled={areNoneSelected}
                  style={STYLES.commentActionButton}
                  label="Approve"
                  onClick={partial(
                    this.triggerActionToast,
                    'approve',
                    this.getSelectedIDs().length,
                    this.dispatchConfirmedAction,
                  )}
                  icon={(
                    <ApproveIcon {...css({fill: LIGHT_PRIMARY_TEXT_COLOR})} />
                  )}
                />

                <CommentActionButton
                  disabled={areNoneSelected}
                  style={STYLES.commentActionButton}
                  label="Reject"
                  onClick={partial(
                    this.triggerActionToast,
                    'reject',
                    this.getSelectedIDs().length,
                    this.dispatchConfirmedAction,
                  )}
                  icon={(
                    <RejectIcon {...css({fill: LIGHT_PRIMARY_TEXT_COLOR})} />
                  )}
                />

                <CommentActionButton
                  disabled={areNoneSelected}
                  style={STYLES.commentActionButton}
                  label="Defer"
                  onClick={partial(
                    this.triggerActionToast,
                    'defer',
                    this.getSelectedIDs().length,
                    this.dispatchConfirmedAction,
                  )}
                  icon={(
                    <DeferIcon {...css({fill: LIGHT_PRIMARY_TEXT_COLOR})} />
                  )}
                />
                  <div {...css(STYLES.dropdown)}>
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
                        <div {...css(STYLES.toolTipWithTags.container)}>
                          <ul {...css(STYLES.toolTipWithTags.ul)}>
                            {tags && tags.map((t, i) => (
                              <li key={t.id}>
                                <button
                                  onClick={partial(this.onTagButtonClick, t.id)}
                                  key={`tag-${i}`}
                                  {...css(STYLES.toolTipWithTags.button)}
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
            )}
          </div>
          {searchReturned && !isLoading && searchTerm && totalCommentCount > 0 &&  (
            <CommentList
              heightOffset={HEADER_HEIGHT + RESULTS_HEADER_HEIGHT}
              textSizes={textSizes}
              commentIds={allCommentIds}
              areAllSelected={areAllSelected}
              getCurrentSort={always(commentSortType)}
              getLinkTarget={getLinkTarget}
              isItemChecked={isItemChecked}
              onSelectAllChange={this.onSelectAllChange}
              onSelectionChange={this.onSelectionChange}
              onSortChange={this.onSortChange}
              sortOptions={sortOptions}
              totalItems={totalCommentCount}
              updateCounter={updateCounter}
              triggerActionToast={this.triggerActionToast}
              searchTerm={searchTerm}
              displayArticleTitle={!!searchTerm}
              dispatchConfirmedAction={this.dispatchConfirmedAction}
              requireReasonForReject={REQUIRE_REASON_TO_REJECT}
              handleAssignTagsSubmit={this.handleAssignTagsSubmit}
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
                    {showActionIcon}
                    {actionCount}
                  </span>
                )}
                <p key="actionText">{actionText}</p>
              </div>
            </ToastMessage>
          </FocusTrap>
        </Scrim>

        <Scrim
          key="ruleInfoScrim"
          scrimStyles={{...STYLES.scrim, ...SCRIM_STYLE.scrim}}
          isVisible={isRuleInfoVisible}
          onBackgroundClick={this.onRuleInfoClose}
        >
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
            }}
          >
            <ToastMessage icon={ruleToastIcon}>
              <p key="toastContent">{actionText}</p>
            </ToastMessage>
          </FocusTrap>
        </Scrim>
      </div>
    );
  }
}
