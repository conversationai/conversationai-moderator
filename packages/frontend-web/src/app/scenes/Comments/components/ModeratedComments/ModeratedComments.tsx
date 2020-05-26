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
import { isEqual } from 'lodash';
import qs from 'query-string';
import React from 'react';
import { RouteComponentProps } from 'react-router';

import {
  Collapse,
} from '@material-ui/core';

import {
  ITagModel,
  ModelId,
  TagModel,
} from '../../../../../models';
import { ICommentAction, IConfirmationAction } from '../../../../../types';
import {
  AddIcon,
  ApproveIcon,
  ArticleControlIcon,
  CommentActionButton,
  DeferIcon,
  HighlightIcon,
  LazyCommentList,
  RejectIcon,
  Scrim,
  ToastMessage,
  ToolTip,
} from '../../../../components';
import { IContextInjectorProps } from '../../../../injectors/contextInjector';
import { updateArticle } from '../../../../platform/dataService';
import {
  approveComments,
  approveFlagsAndComments,
  deferComments,
  highlightComments,
  ICommentActionFunction,
  rejectComments,
  rejectFlagsAndComments,
  resetComments,
  tagCommentSummaryScores,
} from '../../../../stores/commentActions';
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
import { getDefaultSort, putDefaultSort } from '../../../../util/savedSorts';
import { css, stylesheet } from '../../../../utilx';
import {
  commentDetailsPageLink,
  IModeratedCommentsPathParams,
  IModeratedCommentsQueryParams,
  moderatedCommentsPageLink,
} from '../../../routes';

const ARROW_SIZE = 6;
// magic number = height of the moderation status dropdown and the row of tabs
const MODERATION_CONTAINER_HEIGHT = 269;
const MODERATION_CONTAINER_HEIGHT_SHORT = 202;
const TOAST_DELAY = 6000;

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
    justifyContent: 'flex-end',
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

const actionMap: {
  [key: string]: ICommentActionFunction;
} = {
  highlight: highlightComments,
  highlightFlagged: highlightComments,
  approve: approveComments,
  approveFlagged: approveFlagsAndComments,
  defer: deferComments,
  deferFlagged: deferComments,
  reject: rejectComments,
  rejectFlagged: rejectFlagsAndComments,
  tag: tagCommentSummaryScores,
  tagFlagged: tagCommentSummaryScores,
  reset: resetComments,
  resetFlagged: resetComments,
};

export interface IModeratedCommentsProps extends RouteComponentProps<IModeratedCommentsPathParams>, IContextInjectorProps {
  isLoading: boolean;
  tags: List<ITagModel>;
  moderatedComments: Map<string, List<string>>;
  isItemChecked(id: string): boolean;
  areNoneSelected?: boolean;
  areAllSelected: boolean;
  pagingIdentifier?: string;
  loadData?(params: IModeratedCommentsPathParams, query: IModeratedCommentsQueryParams): void;
  toggleSelectAll?(): any;
  toggleSingleItem({ id }: { id: string }): any;
  textSizes?: Map<number, number>;
  setCommentModerationStatus?(
    props: IContextInjectorProps,
    commentIds: Array<string>,
    moderationAction: IConfirmationAction,
    currentModeration: string,
  ): void;
}

export interface IModeratedCommentsState {
  commentIds?: List<string>;
  isConfirmationModalVisible?: boolean;
  confirmationAction?: IConfirmationAction;
  selectedItems?: any;
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
  updatedItems?: any;
  currentPathParams?: IModeratedCommentsPathParams;
  articleControlOpen: boolean;
  hideHistogram: boolean;
  defaultSort?: string;
  sort?: string;
}

export class ModeratedComments
  extends React.Component<IModeratedCommentsProps, IModeratedCommentsState> {

  commentActionCancelled = false;

  state: IModeratedCommentsState = {
    isConfirmationModalVisible: false,
    confirmationAction: null,
    selectedItems: [],
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
    updatedItems: [],
    articleControlOpen: false,
    hideHistogram: false,
  };

  componentDidMount() {
    keyboardJS.bind('escape', this.onPressEscape);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.onPressEscape);
  }

  static getDerivedStateFromProps(props: IModeratedCommentsProps, state: IModeratedCommentsState) {
    const actionLabel = props.match.params.disposition;
    let defaultSort = state.sort;
    let pathParamsChanged = false;
    if (!state.currentPathParams || !isEqual(state.currentPathParams, props.match.params)) {
      defaultSort = undefined;
      pathParamsChanged = true;
    }

    if (!defaultSort) {
      defaultSort = getDefaultSort(props.categoryId, 'moderated', actionLabel);
    }

    const query: IModeratedCommentsQueryParams = qs.parse(props.location.search);
    const sort = query.sort || defaultSort;

    if (pathParamsChanged || sort !== state.sort) {
      props.loadData(props.match.params, {sort});
    }

    const commentIds = props.moderatedComments.get(props.match.params.disposition);

    return {
      actionLabel,
      commentIds,
      currentPathParams: props.match.params,
      defaultSort,
      sort,
    };
  }

  render() {
    const {
      isArticleContext,
      isLoading,
      isItemChecked,
      areNoneSelected,
      areAllSelected,
      tags,
      moderatedComments,
      textSizes,
      match: { params },
      pagingIdentifier,
    } = this.props;

    const {
      commentIds,
      isConfirmationModalVisible,
      isTaggingToolTipMetaVisible,
      taggingToolTipMetaPosition,
      hideHistogram,
    } = this.state;

    function getLinkTarget(commentId: ModelId): string {
      const urlParams = {
        context: params.context,
        contextId: params.contextId,
        commentId: commentId,
      };
      const query = pagingIdentifier && {pagingIdentifier};
      return commentDetailsPageLink(urlParams, query);
    }

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

        <Collapse in={!hideHistogram}>
          <div {...css(STYLES.topSelectRow)}>
            {isArticleContext && (
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
        </Collapse>

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
            <LazyCommentList
              heightOffset={listHeightOffset}
              textSizes={textSizes}
              commentIds={commentIds}
              areAllSelected={areAllSelected}
              currentSort={this.state.sort}
              getLinkTarget={getLinkTarget}
              isItemChecked={isItemChecked}
              onSelectAllChange={this.onSelectAllChange}
              onSelectionChange={this.onSelectionChange}
              onSortChange={this.onSortChange}
              sortOptions={this.getSortOptions()}
              totalItems={commentIds.size}
              displayArticleTitle={!isArticleContext}
              dispatchConfirmedAction={this.dispatchConfirmedAction}
              handleAssignTagsSubmit={this.handleAssignTagsSubmit}
              onTableScroll={this.onTableScroll}
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
      isConfirmationModalVisible: false,
      isTaggingToolTipMetaVisible: false,
    });
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
    this.triggerActionToast('tag', ids.length, () => tagCommentSummaryScores(ids, tagId));
    this.toggleTaggingToolTip();
  }

  @autobind
  onTableScroll(position: number) {
    this.setState({hideHistogram: position !== 0});
    return true;
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
  async handleAssignTagsSubmit(commentId: ModelId, selectedTagIds: Set<ModelId>) {
    selectedTagIds.forEach((tagId) => {
      tagCommentSummaryScores([commentId], tagId);
    });
    this.dispatchConfirmedAction('reject', [commentId]);
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

    this.props.setCommentModerationStatus(this.props, ids, action, this.state.actionLabel);

    // Send event
    const a = this.props.match.params.disposition === 'flagged' ? action + 'Flagged' : action;
    await actionMap[a](ids);
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
  onSortChange(event: React.FormEvent<any>) {
    const sort: string = (event.target as any).value;
    putDefaultSort(this.props.categoryId, 'moderated', this.state.actionLabel, sort);

    if (sort === this.state.sort) {
      return;
    }

    const query: IModeratedCommentsQueryParams = {};
    if (sort !== this.state.defaultSort) {
      query.sort = sort;
    }
    this.props.history.replace(moderatedCommentsPageLink(this.props.match.params, query));
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
