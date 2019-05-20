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
import { Cell, Column, Table } from 'fixed-data-table-2';
import {List, Set} from 'immutable';
import React from 'react';

import {ICommentModel, ITagModel, ModelId} from '../../../models';
import { IConfirmationAction } from '../../../types';
import { partial } from '../../util';
import { css, stylesheet } from '../../utilx';
import { ICommentPropsForRow, LazyLoadComment } from '../LazyLoadComment';
import {
  BasicBody,
  LinkedBasicBody,
} from '../LazyLoadComment';
import { CheckboxColumn } from './components/CheckboxColumn';
import { SortColumn } from './components/SortColumn';

import {
  ARTICLE_CAPTION_TYPE,
  ARTICLE_CATEGORY_TYPE,
  BASE_Z_INDEX,
  BODY_TEXT_TYPE,
  BOX_DEFAULT_SPACING,
  BUTTON_LINK_TYPE,
  BUTTON_RESET,
  CAPTION_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  DARK_SECONDARY_TEXT_COLOR,
  DARK_TERTIARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  MEDIUM_COLOR,
  OFFSCREEN,
  SELECT_ELEMENT,
  SELECT_Z_INDEX,
} from '../../styles';

const ARROW_SIZE = 6;
const COMMENT_HEADER_BACKGROUND_COLOR = '#F5F7F9';
const COMMENT_HEADER_HEIGHT = 56;
const BASE_ROW_HEIGHT = 150;
const ROW_PADDING = 64;

const HEADER_STYLES = stylesheet({
  header: {
    ...ARTICLE_CAPTION_TYPE,
    fontSize: '16px',
    alignItems: 'center',
    backgroundColor: COMMENT_HEADER_BACKGROUND_COLOR,
    color: MEDIUM_COLOR,
    display: 'flex',
    flexWrap: 'no-wrap',
    boxSizing: 'border-box',
    height: COMMENT_HEADER_HEIGHT,
  },

  iconCentering: {
    backgroundColor: COMMENT_HEADER_BACKGROUND_COLOR,
    display: 'flex',
    height: COMMENT_HEADER_HEIGHT,
  },

  dropdown: {
    position: 'relative',
  },

  select: {
    ...SELECT_ELEMENT,
    paddingRight: `${GUTTER_DEFAULT_SPACING * 2}px`,
    position: 'relative',
    zIndex: SELECT_Z_INDEX,
    textAlignLast: 'left',
    borderBottom: `2px solid transparent`,
    ':focus': {
      outline: 0,
      borderBottom: `2px solid ${MEDIUM_COLOR}`,
      borderRadius: 0,
    },
  },

  arrow: {
    position: 'absolute',
    zIndex: BASE_Z_INDEX,
    right: `${GUTTER_DEFAULT_SPACING}px`,
    top: '8px',
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderTop: `${ARROW_SIZE}px solid ${MEDIUM_COLOR}`,
    display: 'block',
    height: 0,
    width: 0,
    marginLeft: `${BOX_DEFAULT_SPACING}px`,
    marginRight: `${BOX_DEFAULT_SPACING}px`,
  },

  label: {
    cursor: 'pointer',
  },
});

export const ROW_STYLES = stylesheet({
  meta: {
    ...CAPTION_TYPE,
    color: DARK_SECONDARY_TEXT_COLOR,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '46px',
  },

  authorRow: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
  },

  commentContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    paddingBottom: `${GUTTER_DEFAULT_SPACING / 2}px`,
  },

  comment: {
    ...BODY_TEXT_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
  },

  commentHeading: {
    ...BODY_TEXT_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
  },

  reply: {
    fill: DARK_TERTIARY_TEXT_COLOR,
    marginBottom: 3,
    marginRight: 4,
    verticalAlign: 'top',
  },

  approval: {
    ...ARTICLE_CATEGORY_TYPE,
    color: MEDIUM_COLOR,
    padding: `0 0 0 ${GUTTER_DEFAULT_SPACING * 1.5}px`,
    textAlign: 'left',
  },

  actionToggle: {
    ...BUTTON_RESET,
    padding: `${GUTTER_DEFAULT_SPACING / 2}px`,
    marginRight: `${GUTTER_DEFAULT_SPACING / 4}px`,
    ':focus': {
      outline: 0,
      backgroundColor: `${COMMENT_HEADER_BACKGROUND_COLOR}`,
    },
  },

  articleLink: {
    color: DARK_PRIMARY_TEXT_COLOR,
    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  detailsButton: {
    ...BUTTON_LINK_TYPE,
    flex: 1,
    border: 'none',
    borderRadius: 0,
    color: MEDIUM_COLOR,
    cursor: 'pointer',
    textAlign: 'right',
    fontSize: '12px',
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
    ':hover': {
      textDecoration: 'underline',
    },

    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  actionContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const SELECT_ALL_ID = 'select-all-checkbox';

export interface ILazyCommentListProps {
  width: number;
  heightOffset: number;
  totalItems: number;
  onRowRender(index: number): Promise<ICommentModel>;
  commentPropsForRow: ICommentPropsForRow;
  areAllSelected?: boolean;
  onSelectAllChange?(): void;
  isItemChecked(id: string): boolean;
  selectedSort?: string;
  sortOptions?: List<ITagModel>;
  onSelectionChange?(commentId: string): void;
  onSortChange?(e: React.ChangeEvent<any>): any;
  getLinkTarget?(comment: ICommentModel): string;
  onCommentClick?(commentIndex: string): any;
  commentBody?: JSX.Element;
  rowHeight?: number;
  hideCommentAction?: boolean;
  updateCounter?: number;
  dispatchConfirmedAction?(action: IConfirmationAction, ids: Array<string>, shouldTriggerToast?: boolean): any;
  rowHeightGetter?(index: number): number;
  scrollToRow?: number;
  ownerHeight?: number;
  searchTerm?: string;
  requireReasonForReject: boolean;
  handleAssignTagsSubmit(commentId: ModelId, selectedTagIds: Set<ModelId>, rejectedTagIds: Set<ModelId>): Promise<void>;
  displayArticleTitle?: boolean;
  selectedTag?: ITagModel;
  onTableScroll?(scrollPos: number): boolean;
}

export interface ILazyCommentListState {
}

export class LazyCommentList extends React.PureComponent<ILazyCommentListProps, ILazyCommentListState> {

  state: ILazyCommentListState = {
  };

  @autobind
  onSelectionChange(comment: ICommentModel) {
   if (this.props.onSelectionChange) {
     this.props.onSelectionChange(comment.id);
   }
  }

  @autobind
  getCheckboxCell(cellProps: any) {
    const {
      onRowRender,
      commentPropsForRow,
      isItemChecked,
      updateCounter,
    } = this.props;

    return (
      <Cell width={cellProps.width} height={cellProps.height}>
        <LazyLoadComment
          onRowRender={onRowRender}
          commentPropsForRow={commentPropsForRow}
          updateCounter={updateCounter}
          rowIndex={cellProps.rowIndex}
        >
          <CheckboxColumn
            inputId={cellProps.rowIndex}
            isItemChecked={isItemChecked}
            onCheck={this.onSelectionChange}
          />
        </LazyLoadComment>
      </Cell>
    );
  }

  @autobind
  getBodyCell(bodyContent: JSX.Element, cellProps: any) {
    const {
      onRowRender,
      commentPropsForRow,
      updateCounter,
      dispatchConfirmedAction,
      requireReasonForReject,
    } = this.props;

    return (
      <Cell width={cellProps.width} height={cellProps.height}>
        <LazyLoadComment
          loadingPlaceholder={<div {...css(ROW_STYLES.comment)}>...</div>}
          onRowRender={onRowRender}
          commentPropsForRow={commentPropsForRow}
          updateCounter={updateCounter}
          dispatchConfirmedAction={dispatchConfirmedAction}
          rowIndex={cellProps.rowIndex}
          requireReasonForReject={requireReasonForReject}
        >
          {bodyContent}
        </LazyLoadComment>
      </Cell>
    );
  }

  @autobind
  getApprovalCell(cellProps: any) {
    const {
      onRowRender,
      commentPropsForRow,
      updateCounter,
      selectedTag,
    } = this.props;

    return (
      <Cell width={cellProps.width} height={cellProps.height}>
        <LazyLoadComment
          loadingPlaceholder={null}
          onRowRender={onRowRender}
          commentPropsForRow={commentPropsForRow}
          updateCounter={updateCounter}
          rowIndex={cellProps.rowIndex}
        >
          <SortColumn selectedTag={selectedTag} style={ROW_STYLES.approval} sortContent={null} comment={null} />
        </LazyLoadComment>
      </Cell>
    );
  }

  render() {
    const {
      totalItems,
      onSortChange,
      selectedSort,
      sortOptions,
      areAllSelected,
      onSelectAllChange,
      getLinkTarget,
      onCommentClick,
      commentBody,
      rowHeight,
      hideCommentAction,
      rowHeightGetter,
      ownerHeight,
      searchTerm,
      displayArticleTitle,
      scrollToRow,
      onTableScroll,
      handleAssignTagsSubmit,
      heightOffset,
    } = this.props;

    const tableWidth = window.innerWidth;
    const tableHeight = window.innerHeight - heightOffset;
    const smallerViewport = tableWidth < 1200;

    const ROW_HEIGHT = rowHeight || BASE_ROW_HEIGHT + ROW_PADDING;
    const checkboxColumnWidth = smallerViewport ? 80 : 250;
    const rightmostColumnWidth = smallerViewport ? 240 : 290;

    const checkboxColumnHeader = () => (
      <div {...css(HEADER_STYLES.iconCentering, {flexDirection: 'row-reverse'})}>
        <div {...css(HEADER_STYLES.header)}>
          <CheckboxColumn
            isSelected={areAllSelected}
            onCheck={onSelectAllChange}
            inputId={SELECT_ALL_ID}
          />
        </div>
      </div>
    );

    const checkboxColumn = (
      <Column
        header={checkboxColumnHeader}
        width={checkboxColumnWidth}
        minWidth={checkboxColumnWidth}
        flexGrow={1}
        cell={this.getCheckboxCell}
      />
    );

    const boundLinkTarget = getLinkTarget ?
      (c: ICommentModel) => getLinkTarget(c) :
      null;

    let bodyContent: any = null;
    if (commentBody) {
      bodyContent = commentBody;
    } else if (boundLinkTarget) {
      bodyContent = (
        <LinkedBasicBody
          searchTerm={searchTerm}
          getLinkTarget={boundLinkTarget}
          onCommentClick={onCommentClick}
          hideCommentAction={hideCommentAction}
          topScore={null}
          comment={null}
          handleAssignTagsSubmit={handleAssignTagsSubmit}
          displayArticleTitle={displayArticleTitle}
        />
      );
    } else {
      bodyContent = (
        <BasicBody
          topScore={null}
          comment={null}
          hideCommentAction={hideCommentAction}
          handleAssignTagsSubmit={handleAssignTagsSubmit}
        />
      );
    }

    const bodyColumnHeader = () => (
      <div {...css(HEADER_STYLES.header, {width: 700})}>
        <label htmlFor={SELECT_ALL_ID} onClick={onSelectAllChange} {...css(HEADER_STYLES.label)}>
          {areAllSelected ? 'Deselect All' : 'Select All'}
        </label>
      </div>
    );

    const bodyColumn = (
      <Column
        header={bodyColumnHeader}
        width={700}
        cell={partial(this.getBodyCell, bodyContent)}
      />
    );

    let approvalColumn;

    if (sortOptions) {
      const approvalColumnHeader = () => (
        <div {...css(HEADER_STYLES.header)}>
          <label htmlFor="sorted-type" {...css(OFFSCREEN)}>
            Sort comments by
          </label>

          <div
            {...css(
              HEADER_STYLES.dropdown,
              {marginLeft: `${smallerViewport ? 0 : GUTTER_DEFAULT_SPACING * 1.5}px`},
            )}
          >
            <select
              id="sorted-type"
              onChange={onSortChange}
              {...css(HEADER_STYLES.select)}
              value={selectedSort}
            >
              {sortOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <span aria-hidden="true" {...css(HEADER_STYLES.arrow)} />
          </div>
        </div>
      );

      approvalColumn = (
        <Column
          header={approvalColumnHeader}
          width={rightmostColumnWidth}
          minWidth={rightmostColumnWidth}
          flexGrow={1}
          cell={this.getApprovalCell}
        />
      );
    }

    return (
      <div className="comment-list">
        <Table
          scrollToRow={scrollToRow && (scrollToRow + 1)}
          onVerticalScroll={onTableScroll}
          headerHeight={COMMENT_HEADER_HEIGHT}
          rowHeight={ROW_HEIGHT}
          rowHeightGetter={rowHeightGetter}
          rowsCount={totalItems}
          touchScrollEnabled
          ownerHeight={ownerHeight}
          width={tableWidth}
          height={tableHeight}
        >
          {checkboxColumn}
          {bodyColumn}
          {approvalColumn}
        </Table>
      </div>
    );
  }

}
