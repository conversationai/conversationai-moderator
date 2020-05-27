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

import { Cell, Column, Table } from 'fixed-data-table-2';
import { List, Set } from 'immutable';
import React from 'react';

import { ITagModel, ModelId } from '../../../models';
import { IConfirmationAction } from '../../../types';
import { css, stylesheet } from '../../utilx';
import { ILinkTargetGetter } from '../LazyLoadComment';
import { LinkedBasicBody } from '../LazyLoadComment';
import { CheckboxColumn } from './components/CheckboxColumn';
import { SortColumn } from './components/SortColumn';

import {
  ARTICLE_CAPTION_TYPE,
  BASE_Z_INDEX,
  BOX_DEFAULT_SPACING,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  MEDIUM_COLOR,
  OFFSCREEN,
  SELECT_ELEMENT,
  SELECT_Z_INDEX,
} from '../../styles';
import { COMMENT_HEADER_BACKGROUND_COLOR, ROW_STYLES } from '../styles';

const ARROW_SIZE = 6;
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

const DEFAULT_ROW_HEIGHT = 180;
const ROW_PADDING_WITH_TITLE = 200;
const ROW_PADDING_WITHOUT_TITLE = 130;

const SELECT_ALL_ID = 'select-all-checkbox';

export interface ILazyCommentListProps {
  commentIds: List<ModelId>;
  textSizes: Map<ModelId, number>;
  heightOffset: number;
  totalItems: number;

  areAllSelected?: boolean;
  onSelectAllChange?(): void;
  onSelectionChange?(commentId: string): void;
  isItemChecked(id: string): boolean;

  currentSort?: string;
  sortOptions?: List<ITagModel>;
  onSortChange?(e: React.ChangeEvent<any>): any;

  getLinkTarget: ILinkTargetGetter;
  onCommentClick?(commentIndex: string): any;
  rowHeight?: number;
  hideCommentAction?: boolean;
  dispatchConfirmedAction?(action: IConfirmationAction, ids: Array<string>): void;
  scrollToRow?: number;
  ownerHeight?: number;
  searchTerm?: string;
  handleAssignTagsSubmit(commentId: ModelId, selectedTagIds: Set<ModelId>, rejectedTagIds: Set<ModelId>): Promise<void>;
  displayArticleTitle?: boolean;
  selectedTag?: ITagModel;
  onTableScroll?(scrollPos: number): boolean;
}

export function LazyCommentList(props: ILazyCommentListProps) {

  const {
    commentIds,
    textSizes,
    isItemChecked,
    dispatchConfirmedAction,
    selectedTag,
    getLinkTarget,
    onCommentClick,
    hideCommentAction,
    searchTerm,
    displayArticleTitle,
    handleAssignTagsSubmit,
    currentSort,
  } = props;

  function rowHeightGetter(idx: number): number {
    const commentId = commentIds.get(idx);
    const padding = displayArticleTitle ? ROW_PADDING_WITH_TITLE : ROW_PADDING_WITHOUT_TITLE;

    return commentId && textSizes
      ? textSizes.get(commentId) + padding
      : DEFAULT_ROW_HEIGHT;
  }

  function getCheckboxCell(cellProps: any) {
    const commentId = commentIds.get(cellProps.rowIndex);

    return (
      <Cell width={cellProps.width} height={cellProps.height}>
        <CheckboxColumn
          commentId={commentId}
          inputId={cellProps.rowIndex}
          isItemChecked={isItemChecked}
          onCheck={props.onSelectionChange}
        />
      </Cell>
    );
  }

  function getBodyCell(cellProps: any) {
    const commentId = commentIds.get(cellProps.rowIndex);

    return (
      <Cell width={cellProps.width} height={cellProps.height}>
        <LinkedBasicBody
          searchTerm={searchTerm}
          getLinkTarget={getLinkTarget}
          onCommentClick={onCommentClick}
          hideCommentAction={hideCommentAction}
          commentId={commentId}
          selectedTag={selectedTag}
          handleAssignTagsSubmit={handleAssignTagsSubmit}
          displayArticleTitle={displayArticleTitle}
          dispatchConfirmedAction={dispatchConfirmedAction}
          showActions
        />
      </Cell>
    );
  }

  function getApprovalCell(cellProps: any) {
    const commentId = commentIds.get(cellProps.rowIndex);

    return (
      <Cell width={cellProps.width} height={cellProps.height}>
        <SortColumn
          selectedSort={currentSort}
          selectedTag={selectedTag}
          style={ROW_STYLES.approval}
          commentId={commentId}
        />
      </Cell>
    );
  }

  const {
    totalItems,
    onSortChange,
    sortOptions,
    areAllSelected,
    onSelectAllChange,
    rowHeight,
    ownerHeight,
    scrollToRow,
    onTableScroll,
  } = props;

  const heightOffset = props.heightOffset || HEADER_HEIGHT;
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
      cell={getCheckboxCell}
    />
  );

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
      cell={getBodyCell}
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
            value={currentSort}
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
        cell={getApprovalCell}
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
