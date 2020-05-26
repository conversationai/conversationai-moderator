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
import qs from 'query-string';
import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import {
  Collapse,
} from '@material-ui/core';

import {
  convertServerAction,
  ICommentListItem,
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
import {
  DEFAULT_DRAG_HANDLE_POS1,
  DEFAULT_DRAG_HANDLE_POS2,
} from '../../../../config';
import { IContextInjectorProps } from '../../../../injectors/contextInjector';
import { updateArticle } from '../../../../platform/dataService';
import {
  approveComments,
  confirmCommentSummaryScore,
  deferComments,
  highlightComments,
  ICommentActionFunction,
  rejectComments,
  rejectCommentSummaryScore,
  tagCommentSummaryScores,
} from '../../../../stores/commentActions';
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
  TOOLTIP_Z_INDEX,
  WHITE_COLOR,
} from '../../../../styles';
import {
  clearReturnSavedCommentRow,
  getReturnSavedCommentRow,
  partial,
  setReturnSavedCommentRow,
} from '../../../../util';
import { getDefaultSort, putDefaultSort } from '../../../../util/savedSorts';
import { css, stylesheet } from '../../../../utilx';
import {
  commentDetailsPageLink,
  INewCommentsPathParams,
  INewCommentsQueryParams,
  newCommentsPageLink,
  tagSelectorLink,
} from '../../../routes';
import { BatchSelector } from './components/BatchSelector';
import { getCommentIDsInRange } from './store';

const actionMap: { [key: string]: ICommentActionFunction } = {
  highlight: highlightComments,
  approve: approveComments,
  defer: deferComments,
  reject: rejectComments,
  tag: tagCommentSummaryScores,
};

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

export interface INewCommentsProps extends RouteComponentProps<INewCommentsPathParams>, IContextInjectorProps {
  preselects?: List<IPreselectModel>;
  commentScores: Array<ICommentListItem>;
  isLoading: boolean;
  selectedTag?: ITagModel;
  areNoneSelected?: boolean;
  areAllSelected: boolean;
  isItemChecked(id: string): boolean;
  tags: List<ITagModel>;
  rules?: List<IRuleModel>;
  pagingIdentifier: string;
  textSizes?: Map<number, number>;
  removeCommentScore?(idsToDispatch: Array<string>): any;
  toggleSelectAll?(): any;
  toggleSingleItem({ id }: { id: string }): any;
  loadData(params: INewCommentsPathParams, pos1: number, pos2: number, sort: string): void;
}

export interface INewCommentsState {
  categoryId?: ModelId;
  articleId?: ModelId;
  tag?: string;
  defaultPos1?: number;
  defaultPos2?: number;
  defaultSort?: string;
  pos1?: number;
  pos2?: number;
  sort?: string;
  commentIds?: List<string>;
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
  selectedRow?: number;
  articleControlOpen: boolean;
  rulesInCategory?: List<IRuleModel>;
  hideHistogram: boolean;
}

export class NewComments extends React.Component<INewCommentsProps, INewCommentsState> {

  commentActionCancelled = false;
  listContainerRef: any = null;

  state: INewCommentsState = {
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
    selectedRow: null,
    articleControlOpen: false,
    hideHistogram: false,
  };

  static getDerivedStateFromProps(props: INewCommentsProps, state: INewCommentsState) {
    let preselect: IPreselectModel;
    const params = props.match.params;
    const tag = params.tag;
    const {categoryId, articleId} = props;
    let defaultPos1: number;
    let defaultPos2: number;
    let defaultSort;
    if (tag !== state.tag || !state.defaultSort) {
      defaultSort = getDefaultSort(categoryId, 'new', tag);
    }
    else {
      defaultSort = state.defaultSort;
    }

    if (tag !== 'DATE') {
      if (props.preselects) {
        if (categoryId !== 'all' && props.selectedTag) {
          preselect = props.preselects.find((p) =>
            (p.categoryId === categoryId && p.tagId === props.selectedTag.id));
        }
        if (!preselect && categoryId !== 'all') {
          preselect = props.preselects.find((p) =>
            (p.categoryId === categoryId && !p.tagId));
        }
        if (!preselect && props.selectedTag) {
          preselect = props.preselects.find((p) =>
            (!p.categoryId && p.tagId === props.selectedTag.id));
        }
        if (!preselect) {
          preselect = props.preselects.find((p) => (!p.categoryId && !p.tagId));
        }
      }
      defaultPos1 = preselect ? preselect.lowerThreshold : DEFAULT_DRAG_HANDLE_POS1;
      defaultPos2 = preselect ? preselect.upperThreshold : DEFAULT_DRAG_HANDLE_POS2;
    }
    else {
      defaultPos1 = 0;
      defaultPos2 = 1;
    }

    const query: INewCommentsQueryParams = qs.parse(props.location.search);
    const pos1 = query.pos1 ? Number.parseFloat(query.pos1) : defaultPos1;
    const pos2 = query.pos2 ? Number.parseFloat(query.pos2) : defaultPos2;
    const sort = query.sort || defaultSort;

    const commentIds = getCommentIDsInRange(
      props.commentScores,
      pos1,
      pos2,
      props.match.params.tag === 'DATE',
    );

    let rulesInCategory: List<IRuleModel>;
    if (props.rules) {
      if (categoryId !== 'all') {
        rulesInCategory = props.rules.filter((r) =>
          (r.categoryId === categoryId || !r.categoryId)) as List<IRuleModel>;
      }
      else {
        rulesInCategory = props.rules.filter((r) => (!r.categoryId)) as List<IRuleModel>;
      }
    }

    if ((categoryId !== state.categoryId) || (articleId !== state.articleId) || (tag !== state.tag) ||
        (pos1 !== state.pos1) || (pos2 !== state.pos2) || (sort !== state.sort)) {
      props.loadData(params, pos1, pos2, sort);
    }

    return {
      categoryId,
      articleId,
      tag,
      commentIds,
      defaultPos1,
      defaultPos2,
      defaultSort,
      pos1,
      pos2,
      sort,
      rulesInCategory,
    };
  }

  async componentDidUpdate(_prevProps: INewCommentsProps) {
    // We need to wait for commentIDsInRange to load so we can check that against the saved row
    const commentId = getReturnSavedCommentRow();

    if ((typeof commentId !== 'undefined') && !this.props.isLoading && this.state.commentIds.size > 0 ) {
      // need to wait to make sure dom and other items are loaded before scrolling you down to the saved comment
      // Maybe we need a better has loaded thing to see if a single row has been rendered and bubble that up to here?
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
      isConfirmationModalVisible: false,
      isRuleInfoVisible: false,
      isTaggingToolTipMetaVisible: false,
    });
  }

  @autobind
  saveListContainerRef(ref: HTMLDivElement) {
    this.listContainerRef = ref;
  }

  @autobind
  async handleAssignTagsSubmit(commentId: ModelId, selectedTagIds: Set<ModelId>, rejectedTagIds: Set<ModelId>) {
    selectedTagIds.forEach((tagId) => {
      confirmCommentSummaryScore(commentId, tagId);
    });

    rejectedTagIds.forEach((tagId) => {
      rejectCommentSummaryScore(commentId, tagId);
    });

    this.dispatchConfirmedAction('reject', [commentId]);
  }

  render() {
    const {
      isArticleContext,
      article,
      commentScores,
      textSizes,
      areNoneSelected,
      areAllSelected,
      isItemChecked,
      tags,
      selectedTag,
      isLoading,
      match: { params },
      pagingIdentifier,
    } = this.props;

    const {
      pos1,
      pos2,
      commentIds,
      isConfirmationModalVisible,
      isRuleInfoVisible,
      isTaggingToolTipMetaVisible,
      taggingToolTipMetaPosition,
      selectedRow,
      rulesInCategory,
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

    const tagLinkURL = tagSelectorLink({context: params.context, contextId: params.contextId, tag: selectedTag && selectedTag.id});

    const rules = selectedTag && selectedTag.key !== 'DATE' && rulesInCategory && List<IRuleModel>(rulesInCategory.filter( (r) => r.tagId && r.tagId === selectedTag.id));
    const disableAllButtons = areNoneSelected || commentScores.length <= 0;
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
    const boundingRect = this.listContainerRef && this.listContainerRef.getBoundingClientRect();
    const listHeightOffset = boundingRect ? boundingRect.top : 500;

    return (
      <div {...css(STYLES.container)}>
        <Collapse in={!hideHistogram}>
          <div key="tagSelection" {...css(STYLES.topSelectRow)}>
            <div {...css(STYLES.dropdown)}>
              <Link {...css(STYLES.select)} to={tagLinkURL}>
                {selectedTag && selectedTag.label}
              </Link>
              <span aria-hidden="true" {...css(STYLES.arrow)} />
            </div>
            { isArticleContext && (
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
              key="selector"
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
        </Collapse>

        <div {...css( STYLES.filler )} />

        <div {...css(STYLES.buttonContainer)}>

          <div {...css(STYLES.commentCount)}>
            { commentScores.length > 0 && (
              <div>
                <span>{selectedIdsCount} of {commentScores.length} comments selected</span>
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
            <LazyCommentList
              heightOffset={listHeightOffset}
              textSizes={textSizes}
              commentIds={commentIds}
              selectedTag={selectedTag}
              areAllSelected={areAllSelected}
              getLinkTarget={getLinkTarget}
              isItemChecked={isItemChecked}
              onSelectAllChange={this.onSelectAllChange}
              onSelectionChange={this.onSelectionChange}
              handleAssignTagsSubmit={this.handleAssignTagsSubmit}
              sortOptions={filterSortOptions}
              currentSort={this.state.sort}
              onSortChange={this.onSortChange}
              onCommentClick={this.saveCommentRow}
              scrollToRow={selectedRow}
              totalItems={commentIds.size}
              dispatchConfirmedAction={this.dispatchConfirmedAction}
              displayArticleTitle={!isArticleContext}
              onTableScroll={this.onTableScroll}
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
      </div>
    );
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
    this.triggerActionToast('tag', ids.length, () => tagCommentSummaryScores(ids, tagId));
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

    // Send event
    actionMap[action](idsToDispatch);

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
  handleUndoClick() {
    this.commentActionCancelled = true;
    this.confirmationClose();
  }

  @autobind
  setQueryStringParam(pos1: number, pos2: number, sort: string): void {
    if ((pos1 === this.state.pos1) && (pos2 === this.state.pos2) && (sort === this.state.sort)) {
      return;
    }

    const query: INewCommentsQueryParams = {};
    if (pos1 !== this.state.defaultPos1) {
      query.pos1 = pos1.toString();
    }
    if (pos2 !== this.state.defaultPos2) {
      query.pos2 = pos2.toString();
    }
    if (sort !== this.state.defaultSort) {
      query.sort = sort;
    }
    this.props.history.replace(newCommentsPageLink(this.props.match.params, query));
  }

  @autobind
  saveCommentRow(commentId: string): void {
    setReturnSavedCommentRow(commentId);
  }

  @autobind
  onSortChange(event: React.FormEvent<any>) {
    const sort: string = (event.target as any).value;
    putDefaultSort(this.state.categoryId, 'new', this.state.tag, sort);
    this.setQueryStringParam(this.state.pos1, this.state.pos2, sort);
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
  onTableScroll(position: number) {
    this.setState({hideHistogram: position !== 0});
    return true;
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
