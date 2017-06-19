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
import { List, Map } from 'immutable';
import React from 'react';
import { css, stylesheet } from '../../../../../../util';
const { Table, Column, Cell } = require('fixed-data-table-2');
import { IArticleModel, ICategoryModel, IUserModel } from '../../../../../../../models';
import { Link } from '../../../../../../components';
import { DashboardArticleItem } from '../../components/DashboardArticleItem';
import { DashboardCategoryItem } from '../../components/DashboardCategoryItem';
import { LazyLoadArticle } from './components/LazyLoadArticle';
import { NewColumn } from './components/NewColumn';
import { SortColumn } from './components/SortColumn';

import {
  ARTICLE_CAPTION_TYPE,
  BASE_Z_INDEX,
  BODY_TEXT_TYPE,
  BOX_DEFAULT_SPACING,
  BUTTON_RESET,
  CAPTION_TYPE,
  DARK_COLOR,
  DARK_PRIMARY_TEXT_COLOR,
  DARK_TERTIARY_TEXT_COLOR,
  DIVIDER_COLOR,
  GUTTER_DEFAULT_SPACING,
  MEDIUM_COLOR,
  OFFSCREEN,
  PALE_COLOR,
  SELECT_ELEMENT,
  SELECT_Z_INDEX,
} from '../../../../../../styles';

const ARROW_SIZE = 6;

// Height set to fit two rows of headling text. When only
// single row ends up with more padding that comps called for.
const ROW_HEIGHT = 180;

const HEADER_STYLES = stylesheet({
  header: {
    ...ARTICLE_CAPTION_TYPE,
    fontWeight: 400,
    backgroundColor: PALE_COLOR,
    color: MEDIUM_COLOR,
    height: '100%',
  },

  headerRow: {
    height: 60,
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },

  categoryRow: {
    width: '100%',
    borderTopWidth: 2,
    borderTopStyle: 'solid',
    borderColor: DIVIDER_COLOR,
    height: 160,
  },

  centerContentLeft: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  category: {
    color: DARK_COLOR,
    fontSize: 14,
    fontWeight: 500,
    textTransform: 'uppercase',
  },

  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 500,
  },

  dropdown: {
    position: 'relative',
    width: '100%',
    paddingRight: GUTTER_DEFAULT_SPACING,
  },

  option: {
    ...ARTICLE_CAPTION_TYPE,
    fontWeight: 400,
  },

  select: {
    ...SELECT_ELEMENT,
    ...ARTICLE_CAPTION_TYPE,
    fontSize: '14px',
    paddingRight: `${(ARROW_SIZE * 2) + (BOX_DEFAULT_SPACING * 2)}px`,
    position: 'relative',
    zIndex: SELECT_Z_INDEX,
    borderBottom: `1px solid transparent`,
    ':focus': {
      outline: 0,
      borderBottom: `1px solid ${MEDIUM_COLOR}`,
    },
  },

  arrow: {
    position: 'absolute',
    zIndex: BASE_Z_INDEX,
    right: '8px',
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
    ...BODY_TEXT_TYPE,
    color: MEDIUM_COLOR,
  },

  count: {
    display: 'block',
    width: '100%',
    color: MEDIUM_COLOR,
    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  newButton: {
    cursor: 'pointer',
    borderBottom: `1px solid transparent`,
    lineHeight: 1,
    ':focus': {
      outline: 0,
      borderBottom: `1px solid ${MEDIUM_COLOR}`,
    },
  },
});

const ROW_STYLES = stylesheet({
  meta: {
    ...CAPTION_TYPE,
    color: DARK_TERTIARY_TEXT_COLOR,
    marginBottom: `${BOX_DEFAULT_SPACING}px`,
  },

  article: {
    ...BODY_TEXT_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
  },

  hovered: {
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  alignButton: {
    backgroundColor: PALE_COLOR,
    display: 'flex',
    alignItems: 'center',
  },
});

const CELL_STYLES = stylesheet({
  bodyBase: {
    padding: GUTTER_DEFAULT_SPACING,
  },

  countBase: {
    height: '100%',
    paddingTop: GUTTER_DEFAULT_SPACING,
    paddingBottom: GUTTER_DEFAULT_SPACING,
  },

  link: {
    color: MEDIUM_COLOR,
    textDecoration: 'none',
  },
});

export interface ILazyArticle {
  id: string;
  hasLoaded: boolean;
  model: IArticleModel;
}

export interface ILazyArticleList {
  width: number;
  height: number;
  totalItems: number;
  onRowRender(index: number): any;
  articlePropsForRow(index: number): {
    article: any;
    articleModerators: any;
    newCommentsCount: any;
    sortContent: any;
  };
  selectedSort?: string;
  sortOptions?: Array<{
    'key': string;
    'label': string;
  }>;
  onSortChange?(e: React.FormEvent<any>): any;
  getLinkTarget?(article: IArticleModel): string;
  onAddArticleModeratorClick?(article: IArticleModel): any;
  onAddCategoryModeratorClick?(category: ICategoryModel): any;
  onNewClick?(e: React.MouseEvent<any>): any;
  category?: ICategoryModel;
  categoryCounts?: Map<string, number>;
  categoryModerators: List<IUserModel>;
}

export class LazyArticleList extends React.Component<ILazyArticleList, void> {
  @autobind
  getNewColumnCell(cellProps: any) {
    const {
      onRowRender,
      articlePropsForRow,
    } = this.props;

    return (
      <Cell width={cellProps.width} height={cellProps.height}>
        <div {...css(CELL_STYLES.countBase)}>
          <LazyLoadArticle
            loadingPlaceholder={null}
            onRowRender={onRowRender}
            articlePropsForRow={articlePropsForRow}
            rowIndex={cellProps.rowIndex}
          >
            <NewColumn styles={CELL_STYLES.link} newCommentsCount={null} />
          </LazyLoadArticle>
        </div>
      </Cell>
    );
  }

  @autobind
  getBodyColumnCell(cellProps: any) {
    const {
      onRowRender,
      articlePropsForRow,
      getLinkTarget,
      category,
      onAddArticleModeratorClick,
    } = this.props;

    return (
      <Cell width={cellProps.width} height={cellProps.height}>
        <div {...css(CELL_STYLES.bodyBase)}>
          <LazyLoadArticle
            loadingPlaceholder={<div {...css(ROW_STYLES.article)}>...</div>}
            onRowRender={onRowRender}
            articlePropsForRow={articlePropsForRow}
            rowIndex={cellProps.rowIndex}
          >
            <DashboardArticleItem
              getLinkTarget={getLinkTarget}
              article={null}
              category={category}
              articleModerators={null}
              onAddArticleModeratorClick={onAddArticleModeratorClick}
            />
          </LazyLoadArticle>
        </div>
      </Cell>
    );
  }

  @autobind
  getSortColumnCell(cellProps: any) {
    const {
      onRowRender,
      articlePropsForRow,
      selectedSort,
    } = this.props;

    return (
      <Cell width={cellProps.width} height={cellProps.height}>
        <div {...css(CELL_STYLES.countBase)}>
          <LazyLoadArticle
            loadingPlaceholder={null}
            onRowRender={onRowRender}
            articlePropsForRow={articlePropsForRow}
            rowIndex={cellProps.rowIndex}
          >
            <SortColumn styles={CELL_STYLES.link} sortContent={null} sortType={selectedSort} />
          </LazyLoadArticle>
        </div>
      </Cell>
    );
  }

  render() {
    const {
      totalItems,
      onSortChange,
      selectedSort,
      sortOptions,
      onAddCategoryModeratorClick,
      onNewClick,
      category,
      categoryCounts,
      categoryModerators,
    } = this.props;

    const categoryId = category && category.id;

    const newColumnWidth = 80;
    const rightmostColumnWidth = 235;
    const hasSortColumn = !!sortOptions;

    const bodyColumn = (
      <Column
        header={(
          <div
            {...css(
              HEADER_STYLES.header,
              HEADER_STYLES.centerContentLeft,
            )}
          >
            <div {...css(HEADER_STYLES.headerRow)}>
              <h1
                {...css(
                  HEADER_STYLES.title,
                  { paddingLeft: GUTTER_DEFAULT_SPACING },
                )}
              >
                Articles
              </h1>
            </div>
            <div
              {...css(
                HEADER_STYLES.categoryRow,
                HEADER_STYLES.centerContentLeft,
                {paddingLeft: GUTTER_DEFAULT_SPACING},
              )}
            >
              <DashboardCategoryItem
                category={category}
                categoryModerators={categoryModerators}
                onAddCategoryModeratorClick={onAddCategoryModeratorClick}
              />
            </div>
          </div>
        )}
        flexGrow={1}
        width={200}
        cell={this.getBodyColumnCell}
      />
    );

    const newColumn = (
      <Column
        header={(
          <div
            {...css(
              HEADER_STYLES.header,
              HEADER_STYLES.centerContentLeft,
            )}
          >
            <div {...css(ROW_STYLES.alignButton, HEADER_STYLES.headerRow)}>
              <button key="newButton" onClick={onNewClick} {...css(HEADER_STYLES.newButton, BUTTON_RESET, { cursor: 'pointer' })}>
                <div {...css(HEADER_STYLES.header, HEADER_STYLES.centerContentLeft)}>New</div>
              </button>
            </div>
            <div {...css(HEADER_STYLES.categoryRow, HEADER_STYLES.centerContentLeft)}>
              { categoryId !== 'assignments' && (
                <Link
                  key={`${categoryId}`}
                  to={categoryId === 'deferred' ? '/categories/all/moderated/deferred' : `/categories/${categoryId}`}
                  {...css(HEADER_STYLES.count)}
                >
                  <p>{categoryCounts.get(categoryId && categoryId.toString())}</p>
                </Link>
              )}
            </div>
          </div>
        )}
        width={newColumnWidth}
        cell={this.getNewColumnCell}
      />
    );

    const sortColumnHeader = hasSortColumn && (
      <div {...css(HEADER_STYLES.header, HEADER_STYLES.centerContentLeft)}>
        <label htmlFor="sorted-type" {...css(OFFSCREEN)}>
          Sort articles by
        </label>
        <div {...css(HEADER_STYLES.headerRow)}>
          <div {...css(HEADER_STYLES.dropdown)}>
            <select
              key={`sort options header`}
              id="sorted-type"
              onChange={onSortChange}
              {...css(HEADER_STYLES.select)}
              value={selectedSort}
            >
              {sortOptions.map((option) => (
                <option {...css(HEADER_STYLES.option)} key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <span aria-hidden="true" {...css(HEADER_STYLES.arrow)} />
          </div>
        </div>
        <div {...css(HEADER_STYLES.categoryRow, HEADER_STYLES.centerContentLeft)} />
      </div>
    );

    const sortColumn = hasSortColumn && (
      <Column
        header={sortColumnHeader}
        width={rightmostColumnWidth}
        cell={this.getSortColumnCell}
      />
    );

    return (
      <Table
        headerHeight={160}
        rowHeight={ROW_HEIGHT}
        rowsCount={totalItems}
        touchScrollEnabled
        width={this.props.width}
        height={this.props.height}
      >
        {bodyColumn}
        {newColumn}
        {sortColumn}
      </Table>
    );
  }

}
