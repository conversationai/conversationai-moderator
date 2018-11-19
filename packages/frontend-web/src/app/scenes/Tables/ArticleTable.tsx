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
import { List, Set } from 'immutable';
import keyboardJS from 'keyboardjs';
import React from 'react';
import { InjectedRouter, Link, WithRouterProps } from 'react-router';

import { IArticleModel, ICategoryModel, IUserModel } from '../../../models';
import * as icons from '../../components/Icons';
import { Scrim } from '../../components/Scrim';
import {Toggle} from '../../components/Toggle';
import { ModelId } from '../../stores/moderators';
import {
  GREY_COLOR,
  HEADER_HEIGHT,
  NICE_CONTROL_BLUE,
  NICE_LIGHTEST_BLUE,
  NICE_MIDDLE_BLUE,
  SCRIM_STYLE,
} from '../../styles';
import { css, stylesheet, updateModel, updateRelationshipModels } from '../../util';
import { AssignModeratorsSimple } from '../Root/components/AssignModerators';
import { articlesLink, categoriesLink, dashboardLink } from '../routes';
import { MagicTimestamp } from './components';
import { ARTICLE_TABLE_STYLES, COMMON_STYLES, IMAGE_BASE } from './styles';
import {
  executeFilter,
  executeSort,
  filterString,
  getFilterValue,
  IFilterItem,
  parseFilter,
  parseSort,
  sortString,
  updateFilter,
  updateSort,
} from './utils';

const big = {
  width: `${IMAGE_BASE}px`,
  height: `${IMAGE_BASE}px`,
};

const medium = {
  width: `${IMAGE_BASE * 3 / 4}px`,
  height: `${IMAGE_BASE * 3 / 4}px`,
};

const small = {
  width: `${IMAGE_BASE / 2}px`,
  height: `${IMAGE_BASE / 2}px`,
};

const STYLES = stylesheet({
  big: big,
  small: small,

  iconBackgroundCircle: {
    ...big,
    borderRadius: `${IMAGE_BASE}px`,
    backgroundColor: '#eee',
    display: 'inline-block',
  },

  iconBackgroundCircleSmall: {
    ...small,
    borderRadius: `${IMAGE_BASE / 2}px`,
    backgroundColor: '#eee',
    display: 'inline-block',
  },

  iconCenter: {
    width: `100%`,
    height: `100%`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textCenterSmall: {
    ...small,
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrimPopup: {
    background: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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

export interface IIArticleTableProps extends WithRouterProps {
  myUserId: string;
  categories: List<ICategoryModel>;
  articles: List<IArticleModel>;
  users: List<IUserModel>;
  routeParams: {[key: string]: string};
  router: InjectedRouter;
}

const MODERATORS = 'moderators';
const CONTROLS = 'controls';
const FILTERS = 'filters';
const SAVING = 'saving';

export interface IIArticleTableState {
  page_size: number;
  current_page: number;
  filter: Array<IFilterItem>;
  sort: Array<string>;

  popupToShow?: string;

  // Fields used by article control popup and set moderators popup
  selectedArticle?: IArticleModel;
  moderatorIds?: Set<ModelId>;
  isCommentingEnabled?: boolean;
  isAutoModerated?: boolean;
}

interface IIControlFlagProps {
  isCommentingEnabled?: boolean;
  isAutoModerated?: boolean;
}

class ControlFlag extends React.Component<IIControlFlagProps> {
  render() {
    let style: any;
    let Icon: any;

    if (this.props.isAutoModerated) {
      Icon = icons.SpeechBubbleIconCircle;
    }
    else {
      Icon = icons.SpeechBubbleIcon;
    }

    if (this.props.isCommentingEnabled) {
      style = {color: NICE_CONTROL_BLUE};
    }
    else {
      style = {color: GREY_COLOR};
    }
    return (<Icon {...css(style)}/>);
  }
}

function getStateFromProps(props: Readonly<IIArticleTableProps>) {
  const filter: Array<IFilterItem> = props.routeParams ? parseFilter(props.routeParams.filter) : [];
  const sort: Array<string> = props.routeParams ? parseSort(props.routeParams.sort) : [];

  return {
    filter,
    sort,
  };
}

export class ArticleTable extends React.Component<IIArticleTableProps, IIArticleTableState> {
  constructor(props: Readonly<IIArticleTableProps>) {
    super(props);

    this.state = {
      page_size: Math.floor(window.innerHeight / HEADER_HEIGHT) - 5,
      current_page: 0,

      popupToShow: null,

      // Fields used by article control popup and set moderators popup
      selectedArticle: null,
      moderatorIds: null,

      ...getStateFromProps(props),
    };
  }

  componentWillReceiveProps(nextProps: Readonly<IIArticleTableProps>): void {
    this.setState(getStateFromProps(nextProps));
  }

  @autobind
  openSetModerators(article: IArticleModel) {
    this.setState({
      popupToShow: MODERATORS,
      selectedArticle: article,
      moderatorIds: Set<ModelId>(article.assignedModerators.map((m) => m.id)),
    });
  }

  @autobind
  openFilters() {
    this.setState({
      popupToShow: FILTERS,
      selectedArticle: null,
    });
  }

  @autobind
  openControls(article: IArticleModel) {
    this.setState({
      popupToShow: CONTROLS,
      selectedArticle: article,
      isCommentingEnabled: article.isCommentingEnabled,
      isAutoModerated: article.isAutoModerated,
    });
  }

  @autobind
  clearPopups() {
    this.setState({
      popupToShow: null,
      selectedArticle: null,
      moderatorIds: null,
    });
  }

  componentWillMount() {
    keyboardJS.bind('escape', this.clearPopups);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.clearPopups);
  }

  renderFilterPopup(currentFilter: Array<IFilterItem>, currentSort: string) {
    if (this.state.popupToShow !== FILTERS) {
      return null;
    }

    const {
      myUserId,
      categories,
      users,
      router,
    } = this.props;

    const me = users.find((u) => u.id === myUserId);
    const others = users.filter((u) => u.id !== myUserId).sort((u1, u2) => ('' + u1.name).localeCompare(u2.name));
    const sortedCategories = categories.sort((c1, c2) => ('' + c1.label).localeCompare(c2.label));

    function setFilter(key: string) {
      return (e: any) => {
        const newFilter = filterString(updateFilter(currentFilter, key, e.target.value));
        router.push(dashboardLink(newFilter, currentSort));
      };
    }

    return (
      <div tabIndex={0} {...css(SCRIM_STYLE.popupMenu, {position: 'absolute', top: '0', right: '0'})}>
        <FocusTrap focusTrapOptions={{clickOutsideDeactivates: true}} >
          <div key="filters">
            <select value={getFilterValue(currentFilter, 'user')} onChange={setFilter('user')}>
              <option key="mine" value={me.id}>{me.name} (Me)</option>
              <option key="all" value="">All Users</option>
              <option key="unassigned" value="unassigned">Unassigned</option>
              {others.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select value={getFilterValue(currentFilter, 'category')} onChange={setFilter('category')}>
              <option key="all" value="">All</option>
              {sortedCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </FocusTrap>
      </div>
    );
  }

  @autobind
  handleCommentingEnabledClicked() {
    this.setState({isCommentingEnabled: !this.state.isCommentingEnabled});
  }

  @autobind
  handleAutoModeratedClicked() {
    if (!this.state.isCommentingEnabled) {
      return;
    }
    this.setState({isAutoModerated: !this.state.isAutoModerated});
  }

  @autobind
  saveControls() {
    const articleId = this.state.selectedArticle.id;
    const {isCommentingEnabled, isAutoModerated} = this.state;
    this.setState({
      popupToShow: SAVING,
      isCommentingEnabled: null,
      isAutoModerated: null,
    });

    updateModel<IArticleModel>(
      'articles',
      articleId,
      {isCommentingEnabled, isAutoModerated} as any,
    ).then(() => {
      this.clearPopups();
    });
  }

  renderControlPopup(article: IArticleModel) {
    const imOpen = this.state.selectedArticle && this.state.selectedArticle.id === article.id;
    if (this.state.popupToShow !== CONTROLS || !imOpen) {
      return null;
    }

    return (
      <div tabIndex={0} {...css(SCRIM_STYLE.popupMenu, {position: 'absolute', marginLeft: '-400px', marginTop: '-15px', width: '350px', padding: '20px'})}>
        <FocusTrap focusTrapOptions={{clickOutsideDeactivates: true}} >
          <h5 key="header" {...css(SCRIM_STYLE.popupTitle)}>Moderation settings</h5>
          <table key="main" {...css({width: '100%'})}>
            <tbody>
              <tr key="comments" onClick={this.handleCommentingEnabledClicked}>
                <td key="icon">
                  <ControlFlag isCommentingEnabled={this.state.isCommentingEnabled}/>
                </td>
                <td key="text" {...css({textAlign: 'left', padding: '15px 20px'})}>
                  <label htmlFor="isCommentingEnabledToggle" {...css(SCRIM_STYLE.popupContent)}>
                    Comments Enabled
                  </label>
                </td>
                <td key="toggle" {...css({textAlign: 'right'})}>
                  <Toggle
                    inputId="isCommentingEnabledToggle"
                    isSelected={this.state.isCommentingEnabled}
                  />
                </td>
              </tr>
              <tr key="automod" onClick={this.handleAutoModeratedClicked} {...css(this.state.isCommentingEnabled ? {} : {opacity: 0.5})}>
                <td key="icon">
                  <ControlFlag isAutoModerated={this.state.isAutoModerated}/>
                </td>
                <td key="text"  {...css({textAlign: 'left', padding: '15px 20px'})}>
                  <label htmlFor="isAutoModeratedToggle" {...css(SCRIM_STYLE.popupContent)}>
                    Auto Moderation Enabled
                  </label>
                </td>
                <td key="toggle" {...css({textAlign: 'right'})}>
                  <Toggle
                    inputId="isAutoModeratedToggle"
                    isSelected={this.state.isAutoModerated}
                    isDisabled={!this.state.isCommentingEnabled}
                  />
                </td>
              </tr>
            </tbody>
          </table>
          <div key="footer" {...css({textAlign: 'right', paddingTop: '20px'})}>
            <span onClick={this.clearPopups} {...css({marginRight: '30px', opacity: '0.5'})}>Cancel</span>
            <span onClick={this.saveControls} {...css({color: NICE_CONTROL_BLUE})}>Save</span>
          </div>
        </FocusTrap>
      </div>
    );
  }

  renderFlags(article: IArticleModel) {
    if (article.id === 'summary') {
      return null;
    }

    const that = this;
    const imOpen = that.state.selectedArticle && that.state.selectedArticle.id === article.id;

    function openDlg() {
      if (imOpen) {
        that.clearPopups();
      }
      else {
        that.openControls(article);
      }
    }

    return (
      <div {...css(imOpen ? STYLES.iconBackgroundCircle : big)}>
        {this.renderControlPopup(article)}
        <div onClick={openDlg} {...css(STYLES.iconCenter)}>
          <ControlFlag isCommentingEnabled={article.isCommentingEnabled} isAutoModerated={article.isAutoModerated}/>
        </div>
      </div>
    );
  }

  renderModerators(article: IArticleModel) {
    if (article.id === 'summary') {
      return null;
    }

    const that = this;
    function openModeratorsDlg() {
      that.openSetModerators(article);
    }

    if (article.assignedModerators.length === 0) {
      return (
        <div onClick={openModeratorsDlg} {...css(STYLES.iconBackgroundCircle)}>
          <div {...css(STYLES.iconCenter)} >
            <icons.UserPlusIcon {...css(COMMON_STYLES.smallIcon, {width: `${30}px`, height: `${30}px`})} onClick={openModeratorsDlg}/>
          </div>
        </div>
      );
    }

    if (article.assignedModerators.length === 1) {
      const u = article.assignedModerators[0];
      if (u.avatarURL) {
        return <img src={u.avatarURL} onClick={openModeratorsDlg} {...css(COMMON_STYLES.smallImage)}/>;
      }
      else {
        return (
          <div onClick={openModeratorsDlg} {...css(STYLES.iconBackgroundCircle)}>
            <div {...css(STYLES.iconCenter)} >
              <icons.UserIcon {...css(COMMON_STYLES.smallIcon, {color: NICE_MIDDLE_BLUE})}/>
            </div>
          </div>
        );
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

    for (let i = 0; i < limit; i++) {
      const u = article.assignedModerators[i];
      if (u.avatarURL) {
        ret.push(<img key={u.id} src={u.avatarURL} {...css(COMMON_STYLES.xsmallImage, {margin: '1px'})}/>);
      }
      else {
        ret.push(
          <div key={u.id} {...css(STYLES.small, {display: 'inline-block', margin: '1px'})}>
            <div {...css(STYLES.iconBackgroundCircleSmall)}>
              <div {...css(STYLES.iconCenter)}>
                <icons.UserIcon {...css(STYLES.small, {color: NICE_MIDDLE_BLUE})}/>
              </div>
            </div>
          </div>,
        );
      }
    }
    if (extra) {
      ret.push(
        <div key="extra" style={{display: 'inline-block', margin: '1px'}}>
          <div {...css(STYLES.textCenterSmall)}>+{article.assignedModerators.length - 3}</div>
        </div>,
      );
    }

    return (
      <div onClick={openModeratorsDlg} {...css({display: 'flex', flexWrap: 'wrap', justifyContent: 'center'})}>
        {ret}
      </div>
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
    const articleId = this.state.selectedArticle.id;
    const moderatorIds = this.state.moderatorIds.toArray() as Array<string>;
    this.setState({
      popupToShow: SAVING,
      selectedArticle: null,
      moderatorIds: null,
    });

    updateRelationshipModels(
      'articles',
      articleId,
      'assignedModerators',
      moderatorIds,
    ).then(() => {
      this.clearPopups();
    });
  }

  renderSetModerators() {
    const article = this.state.selectedArticle;

    if (this.state.popupToShow === SAVING) {
      return (
        <Scrim isVisible onBackgroundClick={this.clearPopups} scrimStyles={STYLES.scrimPopup}>
          <div tabIndex={0} {...css(SCRIM_STYLE.popup)}>
            Saving....
          </div>
        </Scrim>
      );
    }

    if (this.state.popupToShow !== MODERATORS) {
      return null;
    }

    return (
      <Scrim isVisible onBackgroundClick={this.clearPopups} scrimStyles={STYLES.scrimPopup}>
        <FocusTrap focusTrapOptions={{clickOutsideDeactivates: true}}>
          <div tabIndex={0} {...css(SCRIM_STYLE.popup, {position: 'relative'})}>
            <AssignModeratorsSimple
              label="Assign a moderator"
              article={article}
              moderatorIds={this.state.moderatorIds}
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

  static renderSupertext(article: IArticleModel) {
    if (article.id === 'summary') {
      return null;
    }

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

  renderRow(article: IArticleModel) {
    let lastModerated: any = '';
    if (article.id !== 'summary') {
      lastModerated = ArticleTable.renderTime(article.lastModeratedAt);
    }

    function getLink(tag: string) {
      if (article.id === 'summary') {
        if (article.category) {
          return categoriesLink(article.category.id, tag);
        }
        return categoriesLink('all', tag);
      }
      return articlesLink(article.id, tag);
    }

    return (
      <tr key={article.id} {...css(ARTICLE_TABLE_STYLES.dataBody)}>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.textCell)}>
          {ArticleTable.renderTitle(article)}
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('new')} {...css(COMMON_STYLES.cellLink)}>
            {article.unmoderatedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('approved')} {...css(COMMON_STYLES.cellLink)}>
            {article.approvedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('rejected')} {...css(COMMON_STYLES.cellLink)}>
            {article.rejectedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('deferred')} {...css(COMMON_STYLES.cellLink)}>
            {article.deferredCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.numberCell)}>
          <Link to={getLink('flagged')} {...css(COMMON_STYLES.cellLink)}>
            {article.flaggedCount}
          </Link>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.timeCell)}>
          {article.id === 'summary' ? '' : <MagicTimestamp timestamp={article.updatedAt} inFuture={false}/>}
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.timeCell)}>
          {lastModerated}
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.iconCell)}>
          <div {...css({display: 'inline-block'})}>
            {this.renderFlags(article)}
          </div>
        </td>
        <td {...css(ARTICLE_TABLE_STYLES.dataCell, ARTICLE_TABLE_STYLES.iconCell)}>
          {this.renderModerators(article)}
        </td>
      </tr>
    );
  }

  @autobind
  nextPage() {
    this.setState({current_page: this.state.current_page + 1});
  }
  @autobind
  previousPage() {
    this.setState({current_page: this.state.current_page - 1});
  }

  renderPaging(pages: number) {
    const canNext = this.state.current_page !== pages - 1;
    const canPrevious = this.state.current_page !== 0;

    return (
      <div key="paging" {...css(STYLES.pagingBar)}>
        <div {...css({width: '60%', height: `${HEADER_HEIGHT}px`, lineHeight: `${HEADER_HEIGHT}px`, textAlign: 'center', position: 'relative'})}>
          {canPrevious && <span key="previous" onClick={this.previousPage} {...css({position: 'absolute', left: 0})}><icons.ArrowIcon/></span>}
          Page {this.state.current_page + 1} of {pages}&nbsp;
          {canNext && <span key="next" onClick={this.nextPage} {...css({position: 'absolute', right: 0})}><icons.ArrowFIcon/></span>}
        </div>
      </div>
    );
  }

  render() {
    const {
      articles,
      categories,
      location,
    } = this.props;

    const {
      filter,
      sort,
    } = this.state;

    let processedArticles: Array<IArticleModel> = articles.toArray();

    if (Object.keys(filter).length > 0) {
      processedArticles = processedArticles.filter(executeFilter(filter));
    }
    if (sort.length > 0) {
      processedArticles = processedArticles.sort(executeSort(sort));
    }
    else {
      processedArticles = processedArticles.sort(executeSort(['+sourceCreatedAt']));
    }

    const currentFilter = filterString(filter);
    const currentSort = sortString(sort);

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
            nextSortItem = sortField;
          }
          break;
        }
      }
      const newSort = sortString(updateSort(sort, nextSortItem));
      return (
        <Link to={dashboardLink(currentFilter, newSort)} {...css(COMMON_STYLES.cellLink)}>
          <span {...css({position: 'relative'})}>
            {label}
            {directionIndicator}
          </span>
        </Link>
      );
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
        summary[i] += (a as any)[i];
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
    summary['category'] = category;
    summary['assignedModerators'] = category ? category.assignedModerators : [];

    const pages = Math.ceil(processedArticles.length / this.state.page_size);
    const paging = pages > 1;
    if (paging) {
      const start = this.state.current_page * this.state.page_size;
      const end = Math.min(start + this.state.page_size, processedArticles.length);
      processedArticles = processedArticles.slice(start, end);
    }

    return (
      <div key="main">
        <table key="data" {...css(ARTICLE_TABLE_STYLES.dataTable, {position: 'relative'})}>
          <thead {...css(ARTICLE_TABLE_STYLES.dataHeader)}>
            <tr>
              <th key="title" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.textCell)}>
                {renderHeaderItem('Title', 'title')}
                <div {...css({float: 'right'})}>
                  {renderHeaderItem(<icons.ClockIcon/>, 'sourceCreatedAt')}
                </div>
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
                {renderHeaderItem('Modified', 'updatedAt')}
              </th>
              <th key="moderated" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.timeCell)}>
                {renderHeaderItem('Moderated', 'lastModeratedAt')}
              </th>
              <th key="flags" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.iconCell)}/>
              <th key="mods" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.iconCell, {color: NICE_LIGHTEST_BLUE})}>
                <icons.FilterIcon {...css(medium)} onClick={this.openFilters}/>
                {this.renderFilterPopup(filter, currentSort)}
              </th>
            </tr>
          </thead>
          <tbody>
            {this.renderRow(summary)}
            {processedArticles.map((article: IArticleModel) => this.renderRow(article))}
          </tbody>
        </table>
        {paging && this.renderPaging(pages)}
        {this.renderSetModerators()}
      </div>
    );
  }
}
