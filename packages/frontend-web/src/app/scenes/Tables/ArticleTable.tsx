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

import FocusTrap from 'focus-trap-react';
import { Map as IMap, Set } from 'immutable';
import React, {useMemo, useState} from 'react';
import { connect, useSelector } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { IArticleAttributes, IArticleModel, ICategoryModel, IUserModel, ModelId } from '../../../models';
import { IAppState } from '../../appstate';
import { ArticleControlIcon, AssignModerators, MagicTimestamp } from '../../components';
import * as icons from '../../components/Icons';
import { Scrim } from '../../components/Scrim';
import {
  updateArticle,
  updateArticleModerators,
  updateCategoryModerators,
} from '../../platform/dataService';
import { getArticleMap, getArticles } from '../../stores/articles';
import { getCategoryMap, ISummaryCounts } from '../../stores/categories';
import { getUsers } from '../../stores/users';
import {
  flexCenter,
  HEADER_HEIGHT,
  NICE_LIGHTEST_BLUE,
  NICE_MIDDLE_BLUE,
  SCRIM_STYLE,
} from '../../styles';
import { COMMON_STYLES, medium } from '../../stylesx';
import { css, IPossibleStyle, stylesheet, useBindEscape } from '../../utilx';
import {
  articleBase,
  categoryBase,
  dashboardLink,
  IDashboardPathParams,
  moderatedCommentsPageLink,
  NEW_COMMENTS_DEFAULT_TAG,
  newCommentsPageLink,
} from '../routes';
import { ModeratorsWidget, TITLE_CELL_STYLES, TitleCell } from './components';
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

const POPUP_MODERATORS = 'moderators';
const POPUP_CONTROLS = 'controls';
const POPUP_FILTERS = 'filters';
const POPUP_SAVING = 'saving';

function renderTime(time: string | null) {
  if (!time) {
    return 'Never';
  }
  return <MagicTimestamp timestamp={time} inFuture={false}/>;
}

interface ICountsInfoProps {
  counts: ISummaryCounts;
  cellStyle: IPossibleStyle;
  getLink(disposition: string): string;
}

function CountsInfo(props: ICountsInfoProps) {
  const {getLink, cellStyle, counts} = props;

  return (
    <>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
        <Link to={getLink('new')} {...css(COMMON_STYLES.cellLink)}>
          {counts.unmoderatedCount}
        </Link>
      </div>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
        <Link to={getLink('approved')} {...css(COMMON_STYLES.cellLink)}>
          {counts.approvedCount}
        </Link>
      </div>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
        <Link to={getLink('rejected')} {...css(COMMON_STYLES.cellLink)}>
          {counts.rejectedCount}
        </Link>
      </div>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
        <Link to={getLink('deferred')} {...css(COMMON_STYLES.cellLink)}>
          {counts.deferredCount}
        </Link>
      </div>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
        <Link to={getLink('highlighted')} {...css(COMMON_STYLES.cellLink)}>
          {counts.highlightedCount}
        </Link>
      </div>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.numberCell)}>
        <Link to={getLink('flagged')} {...css(COMMON_STYLES.cellLink)}>
          {counts.flaggedCount}
        </Link>
      </div>
    </>
  );
}

interface IRowActions {
  clearPopups(): void;
  openControls(article: IArticleModel): void;
  saveControls(isCommentingEnabled: boolean, isAutoModerated: boolean): void;
  openSetModerators(
    targetId: ModelId,
    moderatorIds: Array<ModelId>,
    superModeratorIds: Array<ModelId>,
    isCategory: boolean,
  ): void;
}

interface IArticleRowProps extends IRowActions {
  article: IArticleModel;
  selectedArticle?: ModelId | null;
}

function ArticleRow(props: IArticleRowProps) {
  const {article, selectedArticle} = props;
  const categories = useSelector(getCategoryMap);
  const users = useSelector(getUsers);

  const lastModerated = renderTime(article.lastModeratedAt);
  const category = categories.get(article.categoryId);
  function getLink(disposition: string) {
    if (disposition === 'new') {
      return newCommentsPageLink({context: articleBase, contextId: article.id, tag: NEW_COMMENTS_DEFAULT_TAG});
    }
    return moderatedCommentsPageLink({context: articleBase, contextId: article.id, disposition});
  }

  const targetId = article.id;
  const moderatorIds = article.assignedModerators;
  const superModeratorIds = category?.assignedModerators;

  function openSetModerators() {
    props.openSetModerators(targetId, moderatorIds, superModeratorIds, false);
  }

  const cellStyle = ARTICLE_TABLE_STYLES.dataCell;

  return (
    <div {...css(cellStyle, ARTICLE_TABLE_STYLES.dataBody)}>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.textCell)}>
        <TitleCell
          category={categories.get(article.categoryId)}
          article={article}
          link={getLink('new')}
        />
      </div>
      <CountsInfo counts={article} cellStyle={cellStyle} getLink={getLink}/>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.timeCell)}>
        <MagicTimestamp timestamp={article.updatedAt} inFuture={false}/>
      </div>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.timeCell)}>
        {lastModerated}
      </div>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.iconCell)}>
        <div {...css({display: 'inline-block'})}>
          <ArticleControlIcon
            article={article}
            open={selectedArticle && selectedArticle === article.id}
            clearPopups={props.clearPopups}
            openControls={props.openControls}
            saveControls={props.saveControls}
          />
        </div>
      </div>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.iconCell)}>
        {targetId && (
          <ModeratorsWidget
            users={users}
            moderatorIds={moderatorIds}
            superModeratorIds={superModeratorIds}
            openSetModerators={openSetModerators}
          />
        )}
      </div>
    </div>
  );
}

interface ISummaryRowProps extends IRowActions {
  summary: IArticleModel;
}

function SummaryRow(props: ISummaryRowProps) {
  const {summary} = props;
  const categories = useSelector(getCategoryMap);
  const users = useSelector(getUsers);
  const category = categories.get(summary.categoryId);

  function getLink(disposition: string) {
    const categoryId = category ? category.id : 'all';
    if (disposition === 'new') {
      return newCommentsPageLink({context: categoryBase, contextId: categoryId, tag: NEW_COMMENTS_DEFAULT_TAG});
    }
    return moderatedCommentsPageLink({context: categoryBase, contextId: categoryId, disposition});
  }

  const targetId = category?.id;
  const moderatorIds = category?.assignedModerators;

  function openSetModerators() {
    props.openSetModerators(targetId, moderatorIds, null, true);
  }

  const cellStyle = ARTICLE_TABLE_STYLES.summaryCell;

  return (
    <div {...css(cellStyle, ARTICLE_TABLE_STYLES.dataBody)}>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.textCell)}>
        <Link to={getLink('new')} {...css(COMMON_STYLES.cellLink, TITLE_CELL_STYLES.mainTextText)}>
          {summary.title}
        </Link>
      </div>
      <CountsInfo counts={summary} cellStyle={cellStyle} getLink={getLink}/>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.timeCell)}/>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.timeCell)}/>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.iconCell)}>
        <div {...css({display: 'inline-block'})}/>
      </div>
      <div {...css(cellStyle, ARTICLE_TABLE_STYLES.iconCell)}>
        {targetId && (
          <ModeratorsWidget
            users={users}
            moderatorIds={moderatorIds}
            superModeratorIds={null}
            openSetModerators={openSetModerators}
          />
        )}
      </div>
    </div>
  );
}

export interface IArticleTableProps extends RouteComponentProps<IDashboardPathParams> {
  categories: Map<ModelId, ICategoryModel>;
  selectedCategory: ICategoryModel;
  articles: Array<IArticleModel>;
  articleMap: Map<ModelId, IArticleModel>;
  users: IMap<ModelId, IUserModel>;
}

function calculateSummaryCounts(articles: Array<IArticleModel>) {
  const columns = [
    'unmoderatedCount',
    'approvedCount',
    'rejectedCount',
    'deferredCount',
    'highlightedCount',
    'flaggedCount',
  ];
  const summary: Partial<IArticleAttributes> & {[key: string]: number} =  {};
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

function sortArticles(articles: Array<IArticleModel>, sort: Array<string>) {
  const sortFn = (sort.length > 0) ? executeSort(sort) : executeSort([`+${SORT_NEW}`]);
  return articles.sort(sortFn);
}

function filterArticles(
  articles: Array<IArticleModel>,
  filter: Array<IFilterItem>,
  categories: Map<ModelId, ICategoryModel>,
): Array<IArticleModel> {
  if (filter.length === 0) {
    return articles;
  }

  return articles.filter(executeFilter(filter, {categories}));
}

function PureArticleTable(props: IArticleTableProps) {
  const articlesContainerHeight = window.innerHeight - HEADER_HEIGHT * 2;

  const filterString = props.match.params.filter || NOT_SET;
  const sortString = props.match.params.sort || NOT_SET;
  const filter = useMemo(() => parseFilter(filterString), [filterString]);
  const sort = useMemo(() => parseSort(sortString), [sortString]);
  const sortedArticles = useMemo(() => sortArticles(props.articles, sort), [props.articles, sort]);
  const filteredArticles = useMemo(
    () => filterArticles(sortedArticles, filter, props.categories),
    [sortedArticles, filter, props.categories],
  );
  const summary = useMemo(() => calculateSummaryCounts(filteredArticles), [filteredArticles]);

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

  const [popupToShow, setPopupToShow] = useState<string>(null);
  const [selectedArticle, setSelectedArticle] = useState<IArticleModel>(null);

  const [targetIsCategory, setTargetIsCategory] = useState<boolean>(null);
  const [targetId, setTargetId] = useState<ModelId>(null);
  const [moderatorIds, setModeratorIds] = useState<Set<ModelId>>(null);
  const [superModeratorIds, setSuperModeratorIds] = useState<Set<ModelId>>(null);

  const currentFilter = getFilterString(filter);
  const currentSort = getSortString(sort);

  function clearPopups() {
    setPopupToShow(null);
    setSelectedArticle(null);
    setTargetIsCategory(null);
    setTargetId(null);
    setModeratorIds(null);
    setSuperModeratorIds(null);
  }

  useBindEscape(clearPopups);

  function openSetModerators(
    iTargetId: ModelId,
    iModeratorIds: Array<ModelId>,
    iSuperModeratorIds: Array<ModelId>,
    isCategory: boolean,
  ) {
    clearPopups();
    setPopupToShow(POPUP_MODERATORS);
    setTargetIsCategory(isCategory);
    setTargetId(iTargetId);
    setModeratorIds(Set<ModelId>(iModeratorIds));
    setSuperModeratorIds(Set<ModelId>(iSuperModeratorIds));
  }

  function openFilters() {
    clearPopups();
    setPopupToShow(POPUP_FILTERS);
  }

  function openControls(article: IArticleModel) {
    setPopupToShow(POPUP_CONTROLS);
    setSelectedArticle(article);
  }

  function renderFilterPopup() {
    const history = props.history;
    function setFilter(newFilter: Array<IFilterItem>) {
      history.push(dashboardLink({filter: getFilterString(newFilter), sort: currentSort}));
    }

    return (
      <FilterSidebar
        key="filter-sidebar"
        open={popupToShow === POPUP_FILTERS}
        filterString={filterString}
        filter={filter}
        users={props.users.valueSeq()}
        setFilter={setFilter}
        clearPopups={clearPopups}
      />
    );
  }

  async function saveControls(isCommentingEnabled: boolean, isAutoModerated: boolean) {
    clearPopups();
    setPopupToShow(POPUP_SAVING);
    await updateArticle(selectedArticle.id, isCommentingEnabled, isAutoModerated);
    clearPopups();
  }

  function onAddModerator(userId: string) {
    setModeratorIds(moderatorIds.add(userId));
  }

  function onRemoveModerator(userId: string) {
    setModeratorIds(moderatorIds.remove(userId));
  }

  async function saveModerators() {
    clearPopups();
    setPopupToShow(POPUP_SAVING);

    if (targetIsCategory) {
      await updateCategoryModerators(targetId, moderatorIds.toArray());
    }
    else {
      await updateArticleModerators(targetId, moderatorIds.toArray());
    }

    clearPopups();
  }

  function renderSaving() {
    if (popupToShow === POPUP_SAVING) {
      return (
        <Scrim key="saving" isVisible onBackgroundClick={clearPopups} scrimStyles={STYLES.scrimPopup}>
          <div tabIndex={0} {...css(SCRIM_STYLE.popup)}>
            Saving....
          </div>
        </Scrim>
      );
    }

    return null;
  }

  function renderSetModerators() {
    if (popupToShow !== POPUP_MODERATORS) {
      return null;
    }

    return (
      <Scrim key="set-moderators" isVisible onBackgroundClick={clearPopups} scrimStyles={STYLES.scrimPopup}>
        <FocusTrap focusTrapOptions={{clickOutsideDeactivates: true}}>
          <div tabIndex={0} {...css(SCRIM_STYLE.popup, {position: 'relative'})}>
            <AssignModerators
              label={targetIsCategory ? 'Assign a category moderator' : 'Assign a moderator'}
              moderatorIds={moderatorIds}
              superModeratorIds={superModeratorIds}
              onAddModerator={onAddModerator}
              onRemoveModerator={onRemoveModerator}
              onClickDone={saveModerators}
              onClickClose={clearPopups}
            />
          </div>
        </FocusTrap>
      </Scrim>
    );
  }

  function rowHeight(index: number) {
    if (index === 0) {
      return HEADER_HEIGHT;
    }
    return CELL_HEIGHT;
  }

  function renderRow(index: number, style: any) {
    if (index === 0) {
      return (
        <div key={'summary'} style={style}>
          <SummaryRow
            summary={summary as IArticleModel}
            clearPopups={clearPopups}
            openControls={openControls}
            saveControls={saveControls}
            openSetModerators={openSetModerators}
          />
        </div>
      );
    }

    const article = filteredArticles[index - 1];
    return (
      <div key={index} style={style}>
        <ArticleRow
          article={article}
          selectedArticle={selectedArticle?.id}
          clearPopups={clearPopups}
          openControls={openControls}
          saveControls={saveControls}
          openSetModerators={openSetModerators}
        />
      </div>
    );
  }

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

  const filterActive = isFilterActive(filter);
  return (
    <div key="main">
      <div key="header" {...css(ARTICLE_TABLE_STYLES.dataHeader)}>
        <div key="title" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.textCell)}>
          {renderHeaderItem('Title', SORT_TITLE)}
        </div>
        <div key="new" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
          {renderHeaderItem('New', SORT_NEW)}
        </div>
        <div key="approved" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
          {renderHeaderItem('Approved', SORT_APPROVED)}
        </div>
        <div key="rejected" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
          {renderHeaderItem('Rejected', SORT_REJECTED)}
        </div>
        <div key="deferred" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
          {renderHeaderItem('Deferred', SORT_DEFERRED)}
        </div>
        <div key="highlighted" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
          {renderHeaderItem('Highlighted', SORT_HIGHLIGHTED)}
        </div>
        <div key="flagged" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
          {renderHeaderItem('Flagged', SORT_FLAGGED)}
        </div>
        <div key="modified" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.timeCell)}>
          {renderHeaderItem('Modified', SORT_UPDATED)}
        </div>
        <div key="moderated" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.timeCell)}>
          {renderHeaderItem('Moderated', SORT_LAST_MODERATED)}
        </div>
        <div key="flags" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.iconCell)}/>
        <div key="mods" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.iconCell)}>
          <div {...css({width: '100%', height: '100%', ...flexCenter})}>
            <div
              {...css({width: '44px', height: '44px', borderRadius: '50%', ...flexCenter,
                backgroundColor: filterActive ? NICE_LIGHTEST_BLUE : NICE_MIDDLE_BLUE,
                color: filterActive ? NICE_MIDDLE_BLUE : NICE_LIGHTEST_BLUE})}
            >
              <icons.FilterIcon {...css(medium)} onClick={openFilters}/>
            </div>
          </div>
        </div>
      </div>
      <div key="content" style={{height: `${articlesContainerHeight}px`, backgroundColor: 'white'}}>
        <AutoSizer>
          {({width, height}) => (
            <VariableSizeList
              itemSize={rowHeight}
              itemCount={filteredArticles.length + 1}
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
      {renderFilterPopup()}
      {renderSaving()}
      {renderSetModerators()}
    </div>
  );
}

const baseSelector = createStructuredSelector({
  categories: getCategoryMap,
  selectedCategory: (state: IAppState, { match: { params }}: IArticleTableProps) => {
    const m = /category=(\d+)/.exec(params.filter);
    if (!m) {
      return null;
    }

    return getCategoryMap(state).get(m[1]);
  },
  articleMap: getArticleMap,
  articles: getArticles,
  users: getUsers,
});

export const ArticleTable: React.ComponentClass<{}> = compose(
  withRouter,
  connect(baseSelector),
)(PureArticleTable);
