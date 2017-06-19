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
import { List, Map } from 'immutable';
import React from 'react';
import { CategoryModel, IArticleModel, ICategoryModel, IUserModel } from '../../../../../models';
import { DATE_FORMAT_LONG } from '../../../../config';
import { IAppDispatch } from '../../../../stores';
import {
  changeColumnSort,
  changeColumnSortGroupDefault,
} from '../../../../stores/columnSorts';
import { css, stylesheet } from '../../../../util';
import { articleSortDefinitions } from '../../../../util/sortDefinitions';
import { LazyArticleList } from './components/LazyArticleList';
import {
  changeArticleScope,
  loadArticleIndex,
  PER_PAGE,
} from './store';

import {
  DIVIDER_COLOR,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
} from '../../../../styles';

import { SIDEBAR_WIDTH } from '../../Dashboard';

const STYLES = stylesheet({
  base: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  scrollContainer: {
    flex: '1 1 auto',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    width: '100%',
  },

  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },

  listItem: {
    borderTop: `1px solid ${DIVIDER_COLOR}`,
    padding: `${GUTTER_DEFAULT_SPACING}px`,
  },

  firstListItem: {
    borderTop: 'none',
  },
});

const sortOptionsMap = Object.keys(articleSortDefinitions)
    .map((key) => {
      return {
        key,
        label: articleSortDefinitions[key].label,
      };
    });

const alphabetizedDashboardSortOptions = sortOptionsMap
    .sort((a, b) => a.label.localeCompare(b.label))
    .filter(({ key }) => {
      // Temporarily taking these out for user testing until we can get real counts.
      return ['newCount', 'newCountReversed', 'newest', 'oldest', 'updated', 'tag', 'automated'].indexOf(key) === -1;
    });

// Display Newest, Oldest, and then the rest of the list in alphabetical order
const dashboardSortOptions = sortOptionsMap
    .filter(({ key }) => key === 'newest')
    .concat(sortOptionsMap.filter(({ key }) => key === 'oldest'))
    .concat(alphabetizedDashboardSortOptions);

export type IArticlePage = Map<string, Array<IArticleModel>>;

export interface IDashboardArticlesProps {
  articleModerators: Map<
    string,
    List<IUserModel>
  >;
  categoryModerators: Map<
    string,
    List<IUserModel>
  >;
  articlePages: Map<number, IArticlePage>;
  totalArticleCount: number;
  currentScope: Map<any, any>;
  dispatch: IAppDispatch;
  getCurrentColumnSort(group: string, key: string): string;
  params: { category: string, categoryId: string };
  categories: Array<ICategoryModel>;
  categoryCounts: Map<string, number>;
}

export interface IDashboardArticlesState {
  listWidth: number;
  listHeight: number;
}

export interface IDashboardArticlesContext {
  openArticleModeratorModal?(article: IArticleModel): void;
  openCategoryModeratorModal?(category: ICategoryModel): void;
}

export class DashboardArticles
    extends React.Component<IDashboardArticlesProps, IDashboardArticlesState> {

  state = {
    listWidth: window.innerWidth - SIDEBAR_WIDTH,
    listHeight: window.innerHeight - HEADER_HEIGHT,
  };

  static contextTypes = {
    openArticleModeratorModal: React.PropTypes.func,
    openCategoryModeratorModal: React.PropTypes.func,
  };

  context: IDashboardArticlesContext;

  componentDidMount() {
    window.addEventListener('resize', this.resizeListener);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeListener);
  }

  @autobind
  resizeListener() {
    requestAnimationFrame(() => {
      this.setState({
        listWidth: window.innerWidth - SIDEBAR_WIDTH,
        listHeight: window.innerHeight - HEADER_HEIGHT,
      });
    });
  }

  render() {
    const {
      totalArticleCount,
      params: {
        categoryId: category,
      },
      categories,
      categoryCounts,
      categoryModerators,
    } = this.props;

    const categoryId = category || 'all';
    const selectedCategory: ICategoryModel = (category === 'assignments' || category === 'deferred')
        ? CategoryModel({ id: category, label: category })
        : categories.find((cat) => cat.id.toString() === categoryId);
    const currentSort = this.getCurrentSort('dashboardVisible');

    return (
      // "dashboard-table" class is used to scope css from
      // public/css/fixed-data-table-base.css without touching css
      // of other fixed data table instances (search, batch, etc).
      <div {...css(STYLES.base, 'dashboard-table')}>
        <LazyArticleList
          onNewClick={this.onClickSortByNew}
          totalItems={totalArticleCount}
          categoryModerators={selectedCategory && categoryModerators.get(selectedCategory.id.toString())}
          articlePropsForRow={this.getArticlePropsForRow}
          width={this.state.listWidth}
          height={this.state.listHeight}
          onRowRender={this.startLoading}
          sortOptions={dashboardSortOptions}
          onSortChange={this.onSortChange}
          selectedSort={currentSort}
          getLinkTarget={this.getLinkTarget}
          category={selectedCategory}
          categoryCounts={categoryCounts}
          onAddCategoryModeratorClick={this.onAddCategoryModeratorClick}
          onAddArticleModeratorClick={this.onAddArticleModeratorClick}
        />
      </div>
    );
  }

  @autobind
  async onAddArticleModeratorClick(article: IArticleModel) {
    this.context.openArticleModeratorModal(article);
  }

  @autobind
  async onAddCategoryModeratorClick(category: ICategoryModel) {
    this.context.openCategoryModeratorModal(category);
  }

  @autobind
  startLoading(idx: number) {
    return this.props.dispatch(loadArticleIndex(idx));
  }

  getSortContentByType(commentSortType: string, article: IArticleModel): string | number {
    switch (commentSortType) {
      case 'moderated':
        return article.moderatedCount;
      case 'unmoderated':
        return article.unmoderatedCount;
      case 'date':
        return formatDate(article.sourceCreatedAt, DATE_FORMAT_LONG);
      case 'newest':
        return formatDate(article.sourceCreatedAt, DATE_FORMAT_LONG);
      case 'oldest':
        return formatDate(article.sourceCreatedAt, DATE_FORMAT_LONG);
      case 'deferred':
        return article.deferedCount;
      case 'approved':
        return article.approvedCount;
      case 'highlighted':
        return article.highlightedCount;
      case 'rejected':
        return article.rejectedCount;
      case 'flagged':
        return article.flaggedCount;
      case 'recommended':
        return article.recommendedCount;
      case 'batched':
        return article.batchedCount;
      case 'automated':
        return article.automatedCount;
      default:
        return formatDate(article.sourceCreatedAt, DATE_FORMAT_LONG);
    }
  }

  @autobind
  getArticlePropsForRow(idx: number): {
    article: any;
    articleModerators: any;
    newCommentsCount: any;
    sortContent: any;
  } {
    const pageNum = Math.floor(idx / PER_PAGE);

    const article = this.props.articlePages.getIn([
      pageNum,
      'items',
      idx % PER_PAGE,
    ]);

    if (!article) { return null; }

    const articleModerators = this.props.articleModerators.get(article.id.toString());
    const newCommentsCount = article.unmoderatedCount;

    const currentSort = this.getCurrentSort('dashboardVisible');
    const sortContent = this.getSortContentByType(
      currentSort,
      article,
    );

    return {
      article,
      articleModerators: articleModerators ? articleModerators : List<IUserModel>(),
      newCommentsCount,
      sortContent,
    };
  }

  getCurrentSort(group: string): string {
    return this.props.getCurrentColumnSort(group, this.props.params.categoryId || 'all');
  }

  @autobind
  getLinkTarget(article: IArticleModel): string {
    if (this.props.params.categoryId === 'deferred') {
      return `/articles/${article.id}/moderated/deferred`;
    }

    return `/articles/${article.id}`;
  }

  @autobind
  onSortChange(event: React.FormEvent<any>) {
    const newSort = (event.target as any).value;
    this.changeSort(newSort);
  }

  changeScopeForCurrentCategory(group: string, key: string) {
    if (this.props.params.categoryId === 'deferred') {
      return changeColumnSort({
        group,
        section: 'deferred',
        key,
      });
    } else {
      return changeColumnSortGroupDefault({
        group,
        key,
      });
    }
  }

  @autobind
  async changeSort(newSort: string) {
    const { currentScope } = this.props;

    await Promise.all([
      this.props.dispatch(this.changeScopeForCurrentCategory('dashboard', newSort)),
      this.props.dispatch(this.changeScopeForCurrentCategory('dashboardVisible', newSort)),
    ]);

    // Keep everything about the current scope, just change the sort.
    await this.props.dispatch(changeArticleScope(
      currentScope.set('sort', articleSortDefinitions[newSort].sortInfo),
    ));
  }

  @autobind
  async onClickSortByNew() {
    const { currentScope } = this.props;

    const currentSort = this.getCurrentSort('dashboard');

    await this.props.dispatch(
      this.changeScopeForCurrentCategory(
        'dashboard',
        currentSort === 'newCount' ? 'newCountReversed' : 'newCount',
      ),
    );

    // Keep everything about the current scope, just change the sort.
    await this.props.dispatch(changeArticleScope(
      currentScope.set('sort', currentSort === 'newCount' ? ['unmoderatedCount'] : ['-unmoderatedCount']),
    ));
  }

}
