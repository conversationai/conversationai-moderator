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
import { NICE_MIDDLE_BLUE } from '../../styles';
import { css } from '../../util';
import { articlesLink, dashboardLink } from '../routes';
import { MagicTimestamp } from './components';
import { ARTICLE_TABLE_STYLES, COMMON_STYLES } from './styles';
import {
  executeFilter,
  executeSort, getFilterValue,
  IFilterItem,
  newFilterString,
  newSortString,
  parseFilter,
  parseSort,
} from './utils';

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

export class ArticleTable extends React.Component<IIArticleTableProps, IIArticleTableState> {
  static renderModerators(article: IArticleModel) {
    if (article.assignedModerators.length === 0) {
      return <icons.UserIcon {...css(COMMON_STYLES.smallIcon)}/>;
    }

    if (article.assignedModerators.length === 1) {
      const u = article.assignedModerators[0];
      if (u.avatarURL) {
        return <img src={u.avatarURL} {...css(COMMON_STYLES.smallImage)}/>;
      }
      else {
        return <icons.UserIcon {...css(COMMON_STYLES.smallIcon, {color: NICE_MIDDLE_BLUE})}/>;
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
        ret.push(<img src={u.avatarURL} {...css(COMMON_STYLES.xsmallImage)}/>);
      }
      else {
        ret.push(<icons.UserIcon {...css(COMMON_STYLES.xsmallIcon, {color: NICE_MIDDLE_BLUE})}/>);
      }
    }
    if (extra) {
      ret.push(<icons.UserIcon {...css(COMMON_STYLES.xsmallIcon)}/>);
    }
  }

  static renderSupertext(article: IArticleModel) {
    const supertext = [];
    if (article.category) {
      supertext.push(<span key="label" {...css(ARTICLE_TABLE_STYLES.categoryLabel)}>{article.category.label}</span>);
    }
    if (article.sourceCreatedAt) {
      supertext.push(
        <span key="timestamp" {...css(ARTICLE_TABLE_STYLES.dateLabel)}>
          <MagicTimestamp timestamp={article.sourceCreatedAt} inFuture={false}/>
        </span>,
      );
    }

    if (supertext.length === 0) {
      return '';
    }
    return <p style={{margin: '7px 0'}}>{supertext}</p>;
  }

  static renderTitle(article: IArticleModel) {
    if (article.url) {
      return (
        <div>
          {ArticleTable.renderSupertext(article)}
          <p style={{margin: '7px 0'}}>
            <a href={article.url} target="_blank" {...css(COMMON_STYLES.cellLink)}>
              {article.title}
            </a>
          </p>
        </div>
      );
    }
    return (
      <div>
        {ArticleTable.renderSupertext(article)}
        <p style={{margin: '7px 0'}}>
          {article.title}
        </p>
      </div>
    );
  }

  static renderTime(time: string | null) {
    if (!time) {
      return 'Never';
    }
    return <MagicTimestamp timestamp={time} inFuture={false}/>;
  }

  static renderRow(article: IArticleModel) {
    let lastModerated: any = '';
    if (article.id !== 'summary') {
      lastModerated = ArticleTable.renderTime(article.lastModeratedAt);
    }
    return (
      <tr key={article.id} {...css(ARTICLE_TABLE_STYLES.dataBody)}>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.textCell)}>
          {ArticleTable.renderTitle(article)}
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={articlesLink(article.id, 'new')} {...css(COMMON_STYLES.cellLink)}>
            {article.unmoderatedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={articlesLink(article.id, 'approved')} {...css(COMMON_STYLES.cellLink)}>
            {article.approvedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={articlesLink(article.id, 'rejected')} {...css(COMMON_STYLES.cellLink)}>
            {article.rejectedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={articlesLink(article.id, 'deferred')} {...css(COMMON_STYLES.cellLink)}>
            {article.deferredCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={articlesLink(article.id, 'flagged')} {...css(COMMON_STYLES.cellLink)}>
            {article.flaggedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.timeCell)}>
          {lastModerated}
        </td>
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
      location,
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
        <Link to={dashboardLink(currentFilter, newSort)} {...css(COMMON_STYLES.cellLink)}>
          {label} {direction}
        </Link>
      );
    }

    function setFilter(key: string) {
      return (e: any) => {
        const newFilter = newFilterString(filter, key, e.target.value);
        router.push(dashboardLink(newFilter, currentSort));
      };
    }

    let category: ICategoryModel | null = null;
    const m = /category=(\d+)/.exec(location.pathname);
    if (m) {
      for (const c of categories.toArray()) {
        if (c.id === m[1]) {
          category = c;
        }
      }
    }

    let count = 0;
    const columns = ['unmoderatedCount', 'approvedCount', 'rejectedCount', 'deferredCount', 'flaggedCount'];
    const summary: any =  {};
    for (const i of columns) {
      summary[i] = 0;
    }

    for (const a of processedArticles) {
      count += 1;
      for (const i of columns) {
        summary[i] += a[i];
      }
    }

    summary['id'] = 'summary';
    summary['title'] = ` ${count} Title` + (count !== 1 ? 's' : '');
    if (category) {
      summary['title'] += ` in section ${category.label}`;
    }

    if (filter.length > 1 || (filter.length === 1 && filter[0].key !== 'category')) {
      summary['title'] += ' matching filter';
    }
    summary['assignedModerators'] = category ? category.assignedModerators : [];

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
              <th key="modified" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.timeCell)}>
                {renderHeaderItem('Modified', 'lastModerated')}
              </th>
              <th key="mods" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.moderatorCell)}>
                <icons.UserIcon {...css(COMMON_STYLES.smallIcon)}/>
              </th>
            </tr>
          </thead>
          <tbody>
            {ArticleTable.renderRow(summary)}
            {processedArticles.map((article: IArticleModel) => ArticleTable.renderRow(article))}
          </tbody>
        </table>
      </div>
    );
  }
}
