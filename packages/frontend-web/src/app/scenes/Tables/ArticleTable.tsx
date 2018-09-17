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

import { List } from 'immutable';
import React from 'react';
import { InjectedRouter, Link, WithRouterProps } from 'react-router';

import { IArticleModel, ICategoryModel, IUserModel } from '../../../models';
import * as icons from '../../components/Icons';
import { css } from '../../util';
import { MagicTimestamp } from './components';
import { ARTICLE_TABLE_STYLES } from './styles';
import { NICE_MIDDLE_BLUE } from '../../styles';

export interface IIArticleTableProps extends WithRouterProps {
  myUserId: string;
  categories: List<ICategoryModel>;
  articles: List<IArticleModel>;
  users: List<IUserModel>;
  routeParams: {[key: string]: string};
  router: InjectedRouter;
}

export interface IIArticleTableState {
}

interface IFilterItem {
  key: string;
  value: string;
}

function parseFilter(filter: string | undefined): Array<IFilterItem> {
  if (!filter || filter.length === 0 || filter === '~') {
    return [];
  }

  const items = filter.split('+');
  const filterList: Array<IFilterItem> = [];
  for (const i of items) {
    const fields = i.split('=');
    if (fields.length !== 2) {
      continue;
    }
    filterList.push({key: fields[0], value: fields[1]});
  }
  return filterList;
}

function newFilterString(filterList: Array<IFilterItem>, newKey?: string, newValue?: string): string {
  if (newKey) {
    filterList = filterList.filter((item: IFilterItem) => item.key !== newKey);
    if (newValue) {
      filterList.push({key: newKey, value: newValue});
    }
  }

  if (filterList.length === 0) {
    return '~';
  }

  return filterList.reduce<string>((r: string, i: IFilterItem) => (r ? `${r}+` : '') +  `${i.key}=${i.value}`, undefined);
}

function getFilterValue(filterList: Array<IFilterItem>, key: string) {
  const item = filterList.find((i) => i.key === key);
  if (item) {
    return item.value;
  }
  return '';
}

function executeFilter(filterList: Array<IFilterItem>) {
  return (article: IArticleModel) => {
    for (const i of filterList){
      switch (i.key) {
        case 'user':
          if (i.value === 'unassigned') {
            if (article.assignedModerators && article.assignedModerators.length > 0) {
              return false;
            }
          }
          else {
            if (!article.assignedModerators) {
              return false;
            }
            let found = false;
            for (const m of article.assignedModerators) {
              if (m.id === i.value) {
                found = true;
                break;
              }
            }
            if (!found) {
              return false;
            }
          }
          break;

        case 'category':
          if (i.value === 'none') {
            if (article.category) {
              return false;
            }
          }
          else {
            if (!article.category || article.category.id !== i.value) {
              return false;
            }
          }
          break;
      }
    }

    return true;
  };
}

function parseSort(sort: string | undefined) {
  if (!sort || sort.length === 0 || sort === '~') {
    return [];
  }
  return sort.split(',');
}

function newSortString(sortList: Array<string>, newSort?: string): string {
  function sortString(sl: Array<string>) {
    if (sl.length === 0) {
      return '~';
    }
    return sl.join(',');
  }

  function removeItem(sl: Array<string>, item: string) {
    return sl.filter((sortitem) => !sortitem.endsWith(item));
  }

  if (!newSort) {
    return sortString(sortList);
  }

  if (!newSort.startsWith('+') && !newSort.startsWith('-')) {
    return sortString(removeItem(sortList, newSort));
  }

  sortList = removeItem(sortList, newSort.substr(1));
  sortList.unshift(newSort);
  return sortString(sortList);
}

function executeSort(sortList: Array<string>) {
  function compareItem(a: IArticleModel, b: IArticleModel, comparator: string) {
    switch (comparator) {
      case 'title':
        return ('' + a.title).localeCompare(b.title);
      case 'category':
        return ('' + a.category.label).localeCompare(b.category.label);
      case 'new':
        return b.unmoderatedCount - a.unmoderatedCount;
      case 'approved':
        return b.approvedCount - a.approvedCount;
      case 'rejected':
        return b.rejectedCount - a.rejectedCount;
      case 'deferred':
        return b.deferredCount - a.deferredCount;
      case 'flagged':
        return b.flaggedCount - a.flaggedCount;
    }
  }
  return (a: IArticleModel, b: IArticleModel) => {
    for (const sortItem of sortList) {
      const direction = sortItem[0];
      const comparison = compareItem(a, b, sortItem.substr(1));
      if (comparison === 0) {
        continue;
      }
      if (direction === '-') {
        return -comparison;
      }
      return comparison;
    }
    return 0;
  };
}

export class ArticleTable extends React.Component<IIArticleTableProps, IIArticleTableState> {
  static renderModerators(article: IArticleModel) {
    if (article.assignedModerators.length === 0) {
      return <icons.UserIcon {...css(ARTICLE_TABLE_STYLES.smallIcon)}/>;
    }

    if (article.assignedModerators.length === 1) {
      const u = article.assignedModerators[0];
      if (u.avatarURL) {
        return <img src={u.avatarURL} {...css(ARTICLE_TABLE_STYLES.smallImage)}/>;
      }
      else {
        return <icons.UserIcon {...css(ARTICLE_TABLE_STYLES.smallIcon, {color: NICE_MIDDLE_BLUE})}/>;
      }
    }

    const ret = [];
    let limit = article.assignedModerators.length;
    let extra = false;
    if (limit > 4) {
      limit = 3;
      extra = true;
    }
    else if (limit === 4) {
      limit = 4;
    }

    for (let i = 0; i < limit && i < 3; i++) {
      const u = article.assignedModerators[i];
      if (u.avatarURL) {
        ret.push(<img src={u.avatarURL} {...css(ARTICLE_TABLE_STYLES.xsmallImage)}/>);
      }
      else {
        ret.push(<icons.UserIcon {...css(ARTICLE_TABLE_STYLES.xsmallIcon, {color: NICE_MIDDLE_BLUE})}/>);
      }
    }
    if (extra) {
      ret.push(<icons.UserIcon {...css(ARTICLE_TABLE_STYLES.xsmallIcon)}/>);
    }
  }

  static renderRow(article: IArticleModel) {
    return (
      <tr key={article.id} {...css(ARTICLE_TABLE_STYLES.dataBody)}>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.textCell)}>
          <a href={article.url} target="_blank" {...css(ARTICLE_TABLE_STYLES.cellLink)}>
            <p style={{margin: '7px 0'}}>
              <span key="label" {...css(ARTICLE_TABLE_STYLES.categoryLabel)}>{article.category.label}</span>&nbsp;
              <span key="timestamp" {...css(ARTICLE_TABLE_STYLES.dateLabel)}><MagicTimestamp timestamp={article.sourceCreatedAt} inFuture={false}/></span>
            </p>
            <p style={{margin: '7px 0'}}>
              {article.title}
            </p>
          </a>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={`/articles/${article.id}/new`} {...css(ARTICLE_TABLE_STYLES.cellLink)}>
            {article.unmoderatedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={`/articles/${article.id}/moderated/approved`} {...css(ARTICLE_TABLE_STYLES.cellLink)}>
            {article.approvedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={`/articles/${article.id}/moderated/rejected`} {...css(ARTICLE_TABLE_STYLES.cellLink)}>
            {article.rejectedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={`/articles/${article.id}/moderated/deferred`} {...css(ARTICLE_TABLE_STYLES.cellLink)}>
            {article.deferredCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={`/articles/${article.id}/moderated/flagged`} {...css(ARTICLE_TABLE_STYLES.cellLink)}>
            {article.flaggedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell)}/>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.moderatorCell)}>
          {ArticleTable.renderModerators(article)}
        </td>
      </tr>
    );
  }

  render() {
    const {
      myUserId,
      articles,
      categories,
      users,
      routeParams,
      router,
    } = this.props;

    const me = users.find((u) => u.id === myUserId);
    const others = users.filter((u) => u.id !== myUserId).sort((u1, u2) => ('' + u1.name).localeCompare(u2.name));
    const sortedCategories = categories.sort((c1, c2) => ('' + c1.label).localeCompare(c2.label));
    let filter: Array<IFilterItem>;
    let sort: Array<string>;

    if (routeParams) {
      filter = parseFilter(routeParams.filter);
      sort = parseSort(routeParams.sort);
    }
    else {
      filter = [];
      sort = [];
    }

    let processedArticles: any = articles;

    if (Object.keys(filter).length > 0) {
      processedArticles = processedArticles.filter(executeFilter(filter));
    }
    if (sort.length > 0) {
      processedArticles = processedArticles.sort(executeSort(sort));
    }

    const currentFilter = newFilterString(filter);
    const currentSort = newSortString(sort);

    function renderHeaderItem(label: string, sortField: string) {
      let direction = '';
      let nextSortItem = `+${sortField}`;

      for (const item of sort) {
        if (item.endsWith(sortField)) {
          if (item[0] === '+') {
            direction = '^';
            nextSortItem =  `-${sortField}`;
          }
          else if (item[0] === '-') {
            direction = 'v';
            nextSortItem = sortField;
          }
          break;
        }
      }
      const newSort = newSortString(sort, nextSortItem);
      return (
        <Link to={`/a/${currentFilter}/${newSort}`} {...css(ARTICLE_TABLE_STYLES.cellLink)}>
          {label} {direction}
        </Link>
      );
    }

    function setFilter(key: string) {
      return (e: any) => {
        const newFilter = newFilterString(filter, key, e.target.value);
        router.push(`/a/${newFilter}/${currentSort}`);
      };
    }

    return (
      <div>
        <div key="filters" {...css(ARTICLE_TABLE_STYLES.filterHeader)}>
          <select value={getFilterValue(filter, 'user')} onChange={setFilter('user')}>
            <option key="mine" value={me.id}>{me.name} (Me)</option>
            <option key="all" value="">All Users</option>
            <option key="unassigned" value="unassigned">Unassigned</option>
            {others.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <select value={getFilterValue(filter, 'category')} onChange={setFilter('category')}>
            <option key="all" value="">All</option>
            {sortedCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <table key="data" {...css(ARTICLE_TABLE_STYLES.dataTable)}>
          <thead {...css(ARTICLE_TABLE_STYLES.dataHeader)}>
            <tr>
              <th key="title" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.textCell)}>
                {renderHeaderItem('Title', 'title')}
              </th>
              <th key="new" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('New', 'new')}
              </th>
              <th key="approved" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('Approved', 'approved')}
              </th>
              <th key="rejected" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('Rejected', 'rejected')}
              </th>
              <th key="deferred" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('Deferred', 'deferred')}
              </th>
              <th key="flagged" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.numberCell)}>
                {renderHeaderItem('Flagged', 'flagged')}
              </th>
              <th key="modified" {...css(ARTICLE_TABLE_STYLES.headerCell)}>
                Modified
              </th>
              <th key="mods" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.moderatorCell)}>
                <icons.UserIcon {...css(ARTICLE_TABLE_STYLES.smallIcon)}/>
              </th>
            </tr>
          </thead>
          <tbody>
            {processedArticles.map((article: IArticleModel) => ArticleTable.renderRow(article))}
          </tbody>
        </table>
      </div>
    );
  }
}
