/*
Copyright 2019 Google Inc.

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
import { Map as IMap, Set } from 'immutable';
import keyboardJS from 'keyboardjs';
import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Link, WithRouterProps } from 'react-router';

import { IArticleModel, ICategoryModel, IUserModel, ModelId } from '../../../models';
import { ArticleControlIcon } from '../../components';
import * as icons from '../../components/Icons';
import { Scrim } from '../../components/Scrim';
import {
  updateArticle,
  updateArticleModerators,
  updateCategoryModerators,
} from '../../platform/dataService';
import {
  flexCenter,
  HEADER_HEIGHT,
  NICE_LIGHTEST_BLUE,
  NICE_MIDDLE_BLUE,
  SCRIM_STYLE,
} from '../../styles';
import { COMMON_STYLES, medium } from '../../stylesx';
import { partial } from '../../util/partial';
import { css, stylesheet } from '../../utilx';
import { AssignModerators } from '../Root/components/AssignModerators';
import {
  articleBase,
  categoryBase,
  dashboardLink,
  moderatedCommentsPageLink,
  NEW_COMMENTS_DEFAULT_TAG,
  newCommentsPageLink,
} from '../routes';
import { MagicTimestamp, ModeratorsWidget, SimpleTitleCell, TitleCell } from './components';
import { FilterSidebar } from './FilterSidebar';
import { ARTICLE_TABLE_STYLES, CELL_HEIGHT } from './styles';
import {
  NOT_SET,
  SORT_APPROVED,
  SORT_DEFERRED,
  SORT_FLAGGED,
  SORT_HIGHLIGHTED,
  SORT_LAST_MODERATED,
  SORT_NEW,
  SORT_REJECTED,
  SORT_TITLE,
  SORT_UPDATED,
} from './utils';
import {
  executeFilter,
  executeSort,
  getFilterString,
  getSortString,
  IFilterItem,
  isFilterActive,
  parseFilter,
  parseSort,
} from './utils';

const STYLES = stylesheet({
  scrimPopup: {
    background: 'rgba(0, 0, 0, 0.4)',
    ...flexCenter,
    alignContent: 'center',
  },

  pagingBar: {
    height: `${HEADER_HEIGHT}px`,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    textSize: '18px',
    color: 'white',
  },
});

export interface IArticleTableProps extends WithRouterProps {
  myUserId: string;
  categories: Map<ModelId, ICategoryModel>;
  selectedCategory: ICategoryModel;
  articles: Array<IArticleModel>;
  articleMap: Map<ModelId, IArticleModel>;
  users: IMap<ModelId, IUserModel>;
}

const POPUP_MODERATORS = 'moderators';
const POPUP_CONTROLS = 'controls';
const POPUP_FILTERS = 'filters';
const POPUP_SAVING = 'saving';

export interface IArticleTableState {
  articlesContainerHeight: number;
  articlesTableHeight: number;
  numberToShow: number;
  filterString: string;
  filter: Array<IFilterItem>;
  sortString: string;
  sort: Array<string>;
  summary: IArticleModel;
  processedArticles: Array<ModelId>;

  popupToShow?: string;

  // Fields used by article control popup
  selectedArticle?: IArticleModel;

  // Fields used by set moderators popup
  targetIsCategory?: boolean;
  targetId?: ModelId;
  moderatorIds?: Set<ModelId>;
  superModeratorIds?: Set<ModelId>;
}

const clearPopupsState: Pick<IArticleTableState,
  'popupToShow' | 'selectedArticle' | 'targetIsCategory' | 'targetId' | 'moderatorIds' | 'superModeratorIds'
  > = {
  popupToShow: null,
  selectedArticle: null,
  targetIsCategory: null,
  targetId: null,
  moderatorIds: null,
  superModeratorIds: null,
};

function calculateSummaryCounts(articles: Array<IArticleModel>) {
  const columns = [
    'unmoderatedCount',
    'approvedCount',
    'rejectedCount',
    'deferredCount',
    'highlightedCount',
    'flaggedCount',
  ];
  const summary: any =  {};
  for (const i of columns) {
    summary['count'] = 0;
    summary[i] = 0;
  }

  articles.reduce((s: any, a) =>  {
    s['count'] ++;
    for (const i of columns) {
      s[i] += (a as any)[i];
    }
    return s;
  }, summary);

  return summary;
}

function filterArticles(
  props: Readonly<IArticleTableProps>,
  filter: Array<IFilterItem>,
): Array<IArticleModel> {
  if (filter.length === 0) {
    return props.articles;
  }

  return props.articles.filter(executeFilter(filter,
    {
      myId: props.myUserId,
      categories: props.categories,
    }));
}

function processArticles(
  props: Readonly<IArticleTableProps>,
  filter: Array<IFilterItem>,
  sort: Array<string>) {

  const filteredArticles = filterArticles(props, filter);
  const summary = calculateSummaryCounts(filteredArticles);
  const sortFn = (sort.length > 0) ? executeSort(sort) : executeSort([`+${SORT_NEW}`]);
  const processedArticles = filteredArticles.sort(sortFn);

  // Use users map from store
  const count = summary['count'];
  summary['id'] = 'summary';
  summary['title'] = ` ${count} Title` + (count !== 1 ? 's' : '');

  if (props.selectedCategory) {
    summary['categoryId'] = props.selectedCategory.id;
    summary['title'] += ` in section ${props.selectedCategory.label}`;
  }

  if (filter.length > 1 || (filter.length === 1 && filter[0].key !== 'category')) {
    summary['title'] += ' matching filter';
  }

  return {
    processedArticles: processedArticles.map((a) => a.id),
    summary,
  };
}

function updateArticles(state: IArticleTableState, props: IArticleTableProps, filter: Array<IFilterItem>) {
  const filteredArticles = filterArticles(props, filter);
  const summary = calculateSummaryCounts(filteredArticles);
  const newSummary = {
    ...state.summary,
    ...summary,
  };

  return {
    summary: newSummary,
  };
}

export class ArticleTable extends React.Component<IArticleTableProps, IArticleTableState> {
  constructor(props: Readonly<IArticleTableProps>) {
    super(props);
    const {filter: filterString, sort: sortString} = props.params;
    const filter: Array<IFilterItem> = parseFilter(filterString);
    const sort: Array<string> = parseSort(sortString);
    const articlesContainerHeight = window.innerHeight - HEADER_HEIGHT * 2;
    this._numberOnScreen = Math.ceil((articlesContainerHeight - HEADER_HEIGHT) / CELL_HEIGHT);

    this.state = {
      filterString: filterString || NOT_SET,
      sortString: sortString || NOT_SET,
      filter,
      sort,
      articlesTableHeight: 0,
      articlesContainerHeight,
      numberToShow: this._numberOnScreen * 2,
      ...processArticles(props, filter, sort),
    };
  }

  _numberOnScreen = 0;
  _scrollBarRef: PerfectScrollbar = null;

  componentWillReceiveProps(props: Readonly<IArticleTableProps>): void {
    let filter: Array<IFilterItem> = this.state.filter;
    let sort: Array<string> = this.state.sort;
    let redoArticles = false;
    let filterUpdated = false;
    let sortUpdated = false;
    const {filter: filterString, sort: sortString} = props.params;

    const newState: any = {};

    if (this.state.filterString !== filterString) {
      filterUpdated = true;
    }
    if (this.state.sortString !== sortString) {
      sortUpdated = true;
    }

    if (filterUpdated) {
      filter = parseFilter(filterString);
      newState['filterString'] = filterString || NOT_SET;
      newState['filter'] = filter;
      redoArticles = true;
    }

    if (sortUpdated) {
      sort = parseSort(sortString);
      newState['sortString'] = sortString || NOT_SET;
      newState['sort'] = sort;
      redoArticles = true;
    }

    if (redoArticles) {
      newState['numberToShow'] = this._numberOnScreen * 2;
      Object.assign(newState, processArticles(props, filter, sort));
    }
    else {
      Object.assign(newState, updateArticles(this.state, props, filter));
    }

    this.setState(newState);
  }

  @autobind
  openSetModerators(targetId: ModelId, moderatorIds: Array<ModelId>, superModeratorIds: Array<ModelId>, isCategory: boolean) {
    this.setState({
      ...clearPopupsState,
      popupToShow: POPUP_MODERATORS,
      targetIsCategory: isCategory,
      targetId: targetId,
      moderatorIds: Set<ModelId>(moderatorIds),
      superModeratorIds: Set<ModelId>(superModeratorIds),
    });
  }

  @autobind
  openFilters() {
    this.setState({
      ...clearPopupsState,
      popupToShow: POPUP_FILTERS,
    });
  }

  @autobind
  openControls(article: IArticleModel) {
    this.setState({
      ...clearPopupsState,
      popupToShow: POPUP_CONTROLS,
      selectedArticle: article,
    });
  }

  @autobind
  clearPopups() {
    this.setState(clearPopupsState);
  }

  componentDidMount() {
    keyboardJS.bind('escape', this.clearPopups);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.clearPopups);
  }

  renderFilterPopup(currentSort: string) {
    const router = this.props.router;
    function setFilter(newFilter: Array<IFilterItem>) {
      router.push(dashboardLink({filter: getFilterString(newFilter), sort: currentSort}));
    }

    return (
      <FilterSidebar
        open={this.state.popupToShow === POPUP_FILTERS}
        filterString={this.state.filterString}
        filter={this.state.filter}
        myUserId={this.props.myUserId}
        users={this.props.users.valueSeq()}
        setFilter={setFilter}
        clearPopups={this.clearPopups}
      />
    );
  }

  @autobind
  saveControls(isCommentingEnabled: boolean, isAutoModerated: boolean) {
    const articleId = this.state.selectedArticle.id;
    this.setState({
      ...clearPopupsState,
      popupToShow: POPUP_SAVING,
    });

    updateArticle(articleId, isCommentingEnabled, isAutoModerated)
      .then(this.clearPopups);
  }

  @autobind
  showMore(_container: React.Component) {
    if (this.state.numberToShow < this.props.articles.length) {
      this.setState({
        numberToShow: this.state.numberToShow + this._numberOnScreen,
      });
    }
  }

  @autobind
  renderModerators(targetId: ModelId, moderatorIds: Array<ModelId>, superModeratorIds: Array<ModelId>, isCategory: boolean) {
    return (
      <ModeratorsWidget
        users={this.props.users}
        moderatorIds={moderatorIds}
        superModeratorIds={superModeratorIds}
        openSetModerators={partial(this.openSetModerators, targetId, moderatorIds, superModeratorIds, isCategory)}
      />
    );
  }

  @autobind
  onAddModerator(userId: string) {
    this.setState({moderatorIds: this.state.moderatorIds.add(userId)});
  }

  @autobind
  onRemoveModerator(userId: string) {
    this.setState({moderatorIds: this.state.moderatorIds.remove(userId)});
  }

  @autobind
  saveModerators() {
    const moderatorIds = this.state.moderatorIds.toArray();
    const targetIsCategory = this.state.targetIsCategory;
    const targetId = this.state.targetId;
    this.setState({
      ...clearPopupsState,
      popupToShow: POPUP_SAVING,
    });

    if (targetIsCategory) {
      updateCategoryModerators(targetId, moderatorIds).then(this.clearPopups);
    }
    else {
      updateArticleModerators(targetId, moderatorIds).then(this.clearPopups);
    }
  }

  renderSaving() {
    if (this.state.popupToShow === POPUP_SAVING) {
      return (
        <Scrim isVisible onBackgroundClick={this.clearPopups} scrimStyles={STYLES.scrimPopup}>
          <div tabIndex={0} {...css(SCRIM_STYLE.popup)}>
            Saving....
          </div>
        </Scrim>
      );
    }

    return null;
  }

  renderSetModerators() {
    if (this.state.popupToShow !== POPUP_MODERATORS) {
      return null;
    }

    return (
      <Scrim isVisible onBackgroundClick={this.clearPopups} scrimStyles={STYLES.scrimPopup}>
        <FocusTrap focusTrapOptions={{clickOutsideDeactivates: true}}>
          <div tabIndex={0} {...css(SCRIM_STYLE.popup, {position: 'relative'})}>
            <AssignModerators
              label={this.state.targetIsCategory ? 'Assign a category moderator' : 'Assign a moderator'}
              moderatorIds={this.state.moderatorIds}
              superModeratorIds={this.state.superModeratorIds}
              onAddModerator={this.onAddModerator}
              onRemoveModerator={this.onRemoveModerator}
              onClickDone={this.saveModerators}
              onClickClose={this.clearPopups}
            />
          </div>
        </FocusTrap>
      </Scrim>
    );
  }

  static renderTime(time: string | null) {
    if (!time) {
      return 'Never';
    }
    return <MagicTimestamp timestamp={time} inFuture={false}/>;
  }

  renderRow(article: IArticleModel, isSummary: boolean) {
    const lastModerated: any = (!isSummary) ? ArticleTable.renderTime(article.lastModeratedAt) : '';
    const category = this.props.categories.get(article.categoryId);
    function getLink(disposition: string) {
      if (disposition === 'new') {
        return newCommentsPageLink({
          context: isSummary ? categoryBase : articleBase,
          contextId: isSummary ? (category ? category.id : 'all') : article.id,
          tag: NEW_COMMENTS_DEFAULT_TAG,
        });
      }
      return moderatedCommentsPageLink({
        context: isSummary ? categoryBase : articleBase,
        contextId: isSummary ? (category ? category.id : 'all') : article.id,
        disposition,
      });
    }

    let targetId: ModelId | null = null;
    let moderatorIds: Array<ModelId> | null = null;
    let superModeratorIds: Array<ModelId> | null = null;
    if (isSummary) {
      if (category) {
        targetId = article.categoryId;
        moderatorIds = category.assignedModerators;
      }
    }
    else {
      targetId = article.id;
      moderatorIds = article.assignedModerators;
      if (category) {
        superModeratorIds = category.assignedModerators;
      }
    }

    const cellStyle = isSummary ? ARTICLE_TABLE_STYLES.summaryCell : ARTICLE_TABLE_STYLES.dataCell;

    return (
      <tr key={article.id} {...css(cellStyle, ARTICLE_TABLE_STYLES.dataBody)}>
        <td {...css(cellStyle)}>
          {isSummary ?
            <SimpleTitleCell article={article} link={getLink('new')}/>
            :
            <TitleCell
              category={this.props.categories.get(article.categoryId)}
              article={article}
              link={getLink('new')}
            />
          }
        </td>
        <td {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('new')} {...css(COMMON_STYLES.cellLink)}>
            {article.unmoderatedCount}
          </Link>
        </td>
        <td {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('approved')} {...css(COMMON_STYLES.cellLink)}>
            {article.approvedCount}
          </Link>
        </td>
        <td {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('rejected')} {...css(COMMON_STYLES.cellLink)}>
            {article.rejectedCount}
          </Link>
        </td>
        <td {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('deferred')} {...css(COMMON_STYLES.cellLink)}>
            {article.deferredCount}
          </Link>
        </td>
        <td {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('highlighted')} {...css(COMMON_STYLES.cellLink)}>
            {article.highlightedCount}
          </Link>
        </td>
        <td {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('flagged')} {...css(COMMON_STYLES.cellLink)}>
            {article.flaggedCount}
          </Link>
        </td>
        <td {...css(cellStyle, ARTICLE_TABLE_STYLES.timeCell)}>
          {!isSummary && <MagicTimestamp timestamp={article.updatedAt} inFuture={false}/>}
        </td>
        <td {...css(cellStyle, ARTICLE_TABLE_STYLES.timeCell)}>
          {lastModerated}
        </td>
        <td {...css(cellStyle, ARTICLE_TABLE_STYLES.iconCell)}>
          <div {...css({display: 'inline-block'})}>
            {!isSummary &&
            <ArticleControlIcon
              article={article}
              open={this.state.selectedArticle && this.state.selectedArticle.id === article.id}
              clearPopups={this.clearPopups}
              openControls={this.openControls}
              saveControls={this.saveControls}
            />}
          </div>
        </td>
        <td {...css(cellStyle, ARTICLE_TABLE_STYLES.iconCell)}>
          {targetId && this.renderModerators(targetId, moderatorIds, superModeratorIds, isSummary)}
        </td>
      </tr>
    );
  }

  render() {
    const {
      filter,
      sort,
      summary,
      processedArticles,
      numberToShow,
    } = this.state;

    const currentFilter = getFilterString(filter);
    const currentSort = getSortString(sort);

    function renderDirectionIndicatorUp() {
      return (
        <div {...css({position: 'absolute', left: 0, right: 0, top: '-18px', textAlign: 'center'})}>
          <icons.KeyUpIcon/>
        </div>
      );
    }

    function renderDirectionIndicatorDown() {
      return (
        <div {...css({position: 'absolute', left: 0, right: 0, bottom: '-18px', textAlign: 'center'})}>
          <icons.KeyDownIcon/>
        </div>
      );
    }

    function renderHeaderItem(label: string | JSX.Element, sortField: string) {
      let directionIndicator: string | JSX.Element = '';
      let nextSortItem = `+${sortField}`;

      for (const item of sort) {
        if (item.endsWith(sortField)) {
          if (item[0] === '+') {
            directionIndicator = renderDirectionIndicatorDown();
            nextSortItem =  `-${sortField}`;
          }
          else if (item[0] === '-') {
            directionIndicator = renderDirectionIndicatorUp();
            nextSortItem = '';
          }
          break;
        }
      }
      // const newSort = sortString(updateSort(sort, nextSortItem)); implements multi sort
      const newSort = getSortString([nextSortItem]);
      return (
        <Link to={dashboardLink({filter: currentFilter, sort: newSort})} {...css(COMMON_STYLES.cellLink)}>
          <span {...css({position: 'relative'})}>
            {label}
            {directionIndicator}
          </span>
        </Link>
      );
    }

    const filterActive = isFilterActive(this.state.filter);
    return (
      <div key="main" style={{height: '100%'}}>
        <table key="data" {...css(ARTICLE_TABLE_STYLES.dataTable)}>
          <thead {...css(ARTICLE_TABLE_STYLES.dataHeader)}>
            <tr>
              <th key="title" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.textCell)}>
                {renderHeaderItem('Title', SORT_TITLE)}
              </th>
              <th key="new" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('New', SORT_NEW)}
              </th>
              <th key="approved" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('Approved', SORT_APPROVED)}
              </th>
              <th key="rejected" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('Rejected', SORT_REJECTED)}
              </th>
              <th key="deferred" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('Deferred', SORT_DEFERRED)}
              </th>
              <th key="highlighted" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('Highlighted', SORT_HIGHLIGHTED)}
              </th>
              <th key="flagged" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('Flagged', SORT_FLAGGED)}
              </th>
              <th key="modified" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.timeCell)}>
                {renderHeaderItem('Modified', SORT_UPDATED)}
              </th>
              <th key="moderated" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.timeCell)}>
                {renderHeaderItem('Moderated', SORT_LAST_MODERATED)}
              </th>
              <th key="flags" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.iconCell)}/>
              <th key="mods" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.iconCell)}>
                <div {...css({width: '100%', height: '100%', ...flexCenter})}>
                  <div
                    {...css({width: '44px', height: '44px', borderRadius: '50%', ...flexCenter,
                      backgroundColor: filterActive ? NICE_LIGHTEST_BLUE : NICE_MIDDLE_BLUE,
                      color: filterActive ? NICE_MIDDLE_BLUE : NICE_LIGHTEST_BLUE})}
                  >
                    <icons.FilterIcon {...css(medium)} onClick={this.openFilters}/>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
        </table>
        <div style={{height: `${this.state.articlesContainerHeight}px`}}>
          <PerfectScrollbar
            ref={(ref) => { this._scrollBarRef = ref; }}
            onYReachEnd={this.showMore}
          >
            <table key="data" {...css(ARTICLE_TABLE_STYLES.dataTable)}>
              <tbody>
                {this.renderRow(summary, true)}
                {processedArticles.slice(0, numberToShow).map((id: ModelId) => this.renderRow(this.props.articleMap.get(id), false))}
              </tbody>
            </table>
          </PerfectScrollbar>
        </div>
        {this.renderFilterPopup(currentSort)}
        {this.renderSaving()}
        {this.renderSetModerators()}
      </div>
    );
  }
}
