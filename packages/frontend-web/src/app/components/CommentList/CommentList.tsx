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

import { List, Set } from 'immutable';
import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {VariableSizeList} from 'react-window';

import { ITagModel, ModelId } from '../../../models';
import { IConfirmationAction } from '../../../types';
import { css, stylesheet } from '../../utilx';
import { ILinkTargetGetter } from '../LazyLoadComment';
import { LinkedBasicBody } from '../LazyLoadComment';
import { CheckboxColumn } from './components/CheckboxColumn';
import { SortColumn } from './components/SortColumn';

import {
  ARTICLE_CATEGORY_TYPE,
  BASE_Z_INDEX,
  BOX_DEFAULT_SPACING,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  NICE_MIDDLE_BLUE,
  OFFSCREEN,
  SELECT_ELEMENT,
  SELECT_Z_INDEX,
} from '../../styles';
import {COMMENT_HEADER_BACKGROUND_COLOR} from '../styles';
import {CustomScrollbarsVirtualList} from '../VirtualListScrollbar';

const ARROW_SIZE = 6;

const STYLES = stylesheet({
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
      borderBottom: `2px solid ${NICE_MIDDLE_BLUE}`,
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
    borderTop: `${ARROW_SIZE}px solid ${NICE_MIDDLE_BLUE}`,
    display: 'block',
    height: 0,
    width: 0,
    marginLeft: `${BOX_DEFAULT_SPACING}px`,
    marginRight: `${BOX_DEFAULT_SPACING}px`,
  },

  approval: {
    ...ARTICLE_CATEGORY_TYPE,
    color: NICE_MIDDLE_BLUE,
    padding: `0 0 0 ${GUTTER_DEFAULT_SPACING * 1.5}px`,
    textAlign: 'left',
  },
});

const ROW_FLEX_STYLE = {
  display: 'flex',
  flexDirection: 'row' as any, // Fix bug in typescript/react typings
  justifyContent: 'center',
};

const DEFAULT_ROW_HEIGHT = 180;
const ROW_PADDING_WITH_TITLE = 200;
const ROW_PADDING_WITHOUT_TITLE = 130;

const SELECT_ALL_ID = 'select-all-checkbox';

export interface ICommentListProps {
  commentIds: Array<ModelId>;
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

export function CommentList(props: ICommentListProps) {

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

  const padding = displayArticleTitle ? ROW_PADDING_WITH_TITLE : ROW_PADDING_WITHOUT_TITLE;
  function rowHeight(idx: number): number {
    const commentId = commentIds[idx];

    return commentId && textSizes && textSizes.has(commentId)
      ? textSizes.get(commentId) + padding
      : DEFAULT_ROW_HEIGHT;
  }

  function SortOption() {
    return (
      <>
        <label htmlFor="sorted-type" {...css(OFFSCREEN)}>
          Sort comments by
        </label>
        <div
          {...css(
            STYLES.dropdown,
            {marginLeft: `${smallerViewport ? 0 : GUTTER_DEFAULT_SPACING * 1.5}px`},
          )}
        >
          <select
            id="sorted-type"
            onChange={onSortChange}
            {...css(STYLES.select)}
            value={currentSort}
          >
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <span aria-hidden="true" {...css(STYLES.arrow)} />
        </div>
      </>
    );
  }

  const {
    onSortChange,
    sortOptions,
    areAllSelected,
    onSelectAllChange,
  } = props;

  const heightOffset = props.heightOffset || HEADER_HEIGHT;
  const tableWidth = window.innerWidth;
  const tableHeight = window.innerHeight - heightOffset;
  const smallerViewport = tableWidth < 1200;

  const checkboxColumnWidth = smallerViewport ? 80 : 250;
  const rightmostColumnWidth = smallerViewport ? 240 : 290;

  function renderRow(index: number, style: any) {
    const commentId = commentIds[index];
    return (
      <div
        key={commentId}
        style={{
          ...style,
          ...ROW_FLEX_STYLE,
          paddingTop: '10px',
          backgroundColor: index % 2 ? '#F7F7F7' : 'white',
        }}
      >
        <div style={{width: `${checkboxColumnWidth}px`}}>
          <CheckboxColumn
            commentId={commentId}
            inputId={`select_${index}`}
            isItemChecked={isItemChecked}
            onCheck={props.onSelectionChange}
          />
        </div>
        <div style={{width: '700px'}}>
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
        </div>
        <div style={{width: `${rightmostColumnWidth}px`}}>
          {sortOptions && (
            <SortColumn
              selectedSort={currentSort}
              selectedTag={selectedTag}
              style={STYLES.approval}
              commentId={commentId}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{width: tableWidth, height: tableHeight }}>
      <div
        key="header"
        style={{
          ...ROW_FLEX_STYLE,
          alignItems: 'center',
          height: `${HEADER_HEIGHT}px`,
          backgroundColor: COMMENT_HEADER_BACKGROUND_COLOR,
        }}
      >
        <div style={{width: `${checkboxColumnWidth}px`}}>
          <CheckboxColumn
            isSelected={areAllSelected}
            onCheck={onSelectAllChange}
            inputId={SELECT_ALL_ID}
          />
        </div>
        <div style={{width: `700px`}}>
          <label htmlFor={SELECT_ALL_ID} onClick={onSelectAllChange}>
            {areAllSelected ? 'Deselect All' : 'Select All'}
          </label>
        </div>
        <div style={{width: `${rightmostColumnWidth}px`}}>
          {sortOptions && (
            <SortOption />
          )}
        </div>
      </div>
      <AutoSizer>
        {({width, height}) => (
          <VariableSizeList
            outerElementType={CustomScrollbarsVirtualList}
            itemSize={rowHeight}
            itemCount={commentIds.length}
            height={height}
            width={width}
            overscanCount={10}
          >
            {({index, style}) => (
              renderRow(index, style)
            )}
          </VariableSizeList>
        )}
      </AutoSizer>
    </div>
  );
}
