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
import React, { KeyboardEvent, SyntheticEvent } from 'react';
import { InjectedRouter, Link, WithRouterProps } from 'react-router';

import { IArticleModel, ICategoryModel, IUserModel } from '../../../models';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import * as icons from '../../components/Icons';
import { Scrim } from '../../components/Scrim';
import { Toggle } from '../../components/Toggle';
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
import { SETTINGS_STYLES } from '../Settings/settingsStyles';
import { MagicTimestamp } from './components';
import { ARTICLE_TABLE_STYLES, COMMON_STYLES, IMAGE_BASE } from './styles';
import { FILTER_MODERATORS, FILTER_MODERATORS_ME, FILTER_MODERATORS_UNASSIGNED} from './utils';
import {
  executeFilter,
  executeSort,
  filterString,
  getFilterValue,
  IFilterItem, isFilterActive,
  parseFilter,
  parseSort, resetFilterToRoot,
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

const flexCenter = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
    ...flexCenter,
  },

  textCenterSmall: {
    ...small,
    fontSize: '12px',
    ...flexCenter,
  },

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

  filterSection: {
    borderTop: '2px solid #eee',
    padding: '20px',
  },
  filterTitle: {
    fontSize: '16px',
    fontWeight: 'normal',
  },

  filterHeading: {
    ...SCRIM_STYLE.popupTitle,
    fontSize: '16px',
    fontWeight: 'bold',
    margin: 0,
    opacity: '0.4',
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

const POPUP_MODERATORS = 'moderators';
const POPUP_CONTROLS = 'controls';
const POPUP_FILTERS = 'filters';
const POPUP_SAVING = 'saving';

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

  // Fields used by the set filters popup
  titleFilter: string;
  moderatorFilterString: string;
  moderatorFilterUsers: Set<ModelId>;
  dateFilterKey: string;
  dateFilterValue: string;
  dateFilterFrom?: Date;
  dateFilterTo?: Date;
  isCommentingEnabledFilter: string;
  isAutoModeratedFilter: string;
  commentsToReviewFilter: string;
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

interface ISmallUserIconProps {
  user: IUserModel;
}

class SmallUserIcon extends React.Component<ISmallUserIconProps> {
  render() {
    const user = this.props.user;
    if (user.avatarURL) {
      return (<img key={user.id} src={user.avatarURL} {...css(COMMON_STYLES.xsmallImage, {margin: '1px'})}/>);
    }
    else {
      return (
        <div key={user.id} {...css(STYLES.small, {display: 'inline-block', margin: '1px'})}>
          <div {...css(STYLES.iconBackgroundCircleSmall)}>
            <div {...css(STYLES.iconCenter)}>
              <icons.UserIcon {...css(STYLES.small, {color: NICE_MIDDLE_BLUE})}/>
            </div>
          </div>
        </div>
      );
    }
  }
}

function getStateFromProps(props: Readonly<IIArticleTableProps>) {
  const filter: Array<IFilterItem> = props.routeParams ? parseFilter(props.routeParams.filter) : [];
  const sort: Array<string> = props.routeParams ? parseSort(props.routeParams.sort) : [];

  let dateFilterKey = 'sourceCreatedAt';
  let dateFilterValue = '';
  const dateFilterFrom = new Date(Date.now());
  const dateFilterTo = new Date(Date.now());
  for (let i = 0; i < filter.length; i++) {
    if (['lastModeratedAt', 'updatedAt', 'sourceCreatedAt'].indexOf(filter[i].key) >= 0) {
      dateFilterKey = filter[i].key;
      const range = filter[i].value.split('|');
      if (range.length < 2) {
        dateFilterValue = range[0];
      }
      else {
        dateFilterValue = 'custom';
      }
      break;
    }
  }

  const moderatorFilterString = getFilterValue(filter, FILTER_MODERATORS);
  let moderatorFilterUsers: Array<string> = [];

  if (moderatorFilterString.length > 0 &&
    moderatorFilterString !== FILTER_MODERATORS_ME &&
    moderatorFilterString !== FILTER_MODERATORS_UNASSIGNED) {
    moderatorFilterUsers = moderatorFilterString.split(',');
  }

  return {
    filter,
    sort,

    titleFilter: getFilterValue(filter, 'title'),
    moderatorFilterString: moderatorFilterString,
    moderatorFilterUsers: Set<string>(moderatorFilterUsers),
    dateFilterKey,
    dateFilterValue,
    dateFilterFrom,
    dateFilterTo,
    isCommentingEnabledFilter: getFilterValue(filter, 'isCommentingEnabled'),
    isAutoModeratedFilter: getFilterValue(filter, 'isAutoModerated'),
    commentsToReviewFilter: getFilterValue(filter, 'commentsToReview'),
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
      popupToShow: POPUP_MODERATORS,
      selectedArticle: article,
      moderatorIds: Set<ModelId>(article.assignedModerators.map((m) => m.id)),
    });
  }

  @autobind
  openFilters() {
    this.setState({
      popupToShow: POPUP_FILTERS,
      selectedArticle: null,
    });
  }

  @autobind
  openControls(article: IArticleModel) {
    this.setState({
      popupToShow: POPUP_CONTROLS,
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

  renderFilterPopup(currentSort: string) {
    if (this.state.popupToShow !== POPUP_FILTERS) {
      return null;
    }

    const {
      myUserId,
      users,
      router,
    } = this.props;

    const {
      filter,
      titleFilter,
      moderatorFilterString,
      moderatorFilterUsers,
      dateFilterKey,
      dateFilterValue,
      isCommentingEnabledFilter,
      isAutoModeratedFilter,
      commentsToReviewFilter,
    } = this.state;

    const me = users.find((u) => u.id === myUserId);
    const others = users.filter((u) => u.id !== myUserId).sort((u1, u2) => ('' + u1.name).localeCompare(u2.name));

    const that = this;
    function changeFilter(param: 'titleFilter' | 'dateFilterKey' | 'dateFilterValue') {
      return ((e: SyntheticEvent<any>) => {
        that.setState({[param]: e.currentTarget.value} as any);
      });
    }

    function setFilter(key: string) {
      return (e: SyntheticEvent<any>) => {
        const f = updateFilter(filter, key, e.currentTarget.value);
        router.push(dashboardLink(filterString(f), currentSort));
      };
    }

    function checkForEnter(key: string) {
      return (e: KeyboardEvent<any>) => {
        if (e.key === 'Enter') {
          const f = updateFilter(filter, key, e.currentTarget.value);
          router.push(dashboardLink(filterString(f), currentSort));
        }
      };
    }

    function setModerator(id: string) {
      // return (checked: boolean) => {
      //   const mf = checked ? that.state.moderatorFilter.add(id) : that.state.moderatorFilter.remove(id);
      return () => {
        const currentUsers = that.state.moderatorFilterUsers;
        const newUsers = currentUsers.contains(id) ? currentUsers.delete(id) : currentUsers.add(id);
        const moderators = newUsers.toArray().reduce<string | null>((s: string | null, v: ModelId) => (s ? `${s},${v}` : v.toString()), null);
        const f = updateFilter(filter, FILTER_MODERATORS, moderators);
        router.push(dashboardLink(filterString(f), currentSort));
      };
    }

    function setModeratorUnassigned() {
      const f = updateFilter(filter, FILTER_MODERATORS, FILTER_MODERATORS_UNASSIGNED);
      router.push(dashboardLink(filterString(f), currentSort));
    }

    function clearFilters() {
      router.push(dashboardLink(filterString(resetFilterToRoot(filter)), currentSort));
    }

    function renderModerator(u: IUserModel) {
      return (
        <tr key="{u.id}" onClick={setModerator(u.id)}>
          <td key="icon">
            <SmallUserIcon user={u}/>
          </td>
          <td key="text" {...css({textAlign: 'left'})}>
            {u.name}
          </td>
          <td key="toggle" {...css({textAlign: 'right'})}>
            <Checkbox isSelected={moderatorFilterUsers.has(u.id)} onCheck={null}/>
          </td>
        </tr>
      );
    }

    function renderCustomDateControls() {
      if (dateFilterValue !== 'custom') {
        return '';
      }
      return(
        <div>
          date1,date2
        </div>
      );
    }

    return (
      <div tabIndex={0} {...css(SCRIM_STYLE.popupMenu, {position: 'absolute', top: '0', right: '0', color: 'black'})}>
        <FocusTrap focusTrapOptions={{clickOutsideDeactivates: true}} >
          <h4 key="header" {...css(SCRIM_STYLE.popupTitle, {padding: '20px', fontSize: '18px', margin: 0})}>
            Filter titles
            <div onClick={this.clearPopups} {...css({float: 'right'})}>
              <icons.CloseIcon/>
            </div>
            <Button
              label="Reset"
              onClick={clearFilters}
              buttonStyles={{float: 'right', marginRight: '30px', color: NICE_LIGHTEST_BLUE, backgroundColor: NICE_MIDDLE_BLUE, padding: '7px 20px', marginTop: '-6px'}}
            />
          </h4>
          <div key="title" {...css(STYLES.filterSection)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Title
            </h5>
            <input
              type="text"
              value={titleFilter}
              onKeyPress={checkForEnter('title')}
              onChange={changeFilter('titleFilter')}
              onBlur={setFilter('title')}
              {...css(SETTINGS_STYLES.input, {width: '100%', marginTop: '20px'})}
            />
          </div>
          {moderatorFilterString !== FILTER_MODERATORS_ME &&
          <div key="moderators" {...css(STYLES.filterSection)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Moderators
            </h5>
            <table key="main" {...css({width: '100%', marginTop: '10px'})}>
              <tbody>
              <tr key="unassigned" onClick={setModeratorUnassigned}>
                <td key="icon"/>
                <td key="text" {...css({textAlign: 'left'})}>
                  No moderator assigned.
                </td>
                <td key="toggle" {...css({textAlign: 'right'})}>
                  <Checkbox isSelected={moderatorFilterString === FILTER_MODERATORS_UNASSIGNED} onCheck={null}/>
                </td>
              </tr>
              {renderModerator(me)}
              {others.map((u: IUserModel) => renderModerator(u))}
              </tbody>
            </table>
          </div>
          }
          <div key="dates" {...css(STYLES.filterSection)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Date
            </h5>
            <table {...css({width: '100%', marginTop: '10px'})}>
              <tbody>
              <tr>
                <th key="label" {...css({textAlign: 'left'})}>
                  Filter by:
                </th>
                <td key="value" {...css({textAlign: 'right'})}>
                  <select value={dateFilterKey} onChange={changeFilter('dateFilterKey')} {...css(ARTICLE_TABLE_STYLES.select, {width: '200px'})}>
                    <option value="sourceCreatedAt">Date published</option>
                    <option value="updatedAt">Date last modified</option>
                    <option value="lastModeratedAt">Date last moderated</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th key="label" {...css({textAlign: 'left'})}>
                  Filter range:
                </th>
                <td key="value" {...css({textAlign: 'right'})}>
                  <select value={dateFilterValue} onChange={changeFilter('dateFilterValue')} {...css(ARTICLE_TABLE_STYLES.select, {width: '200px'})}>
                    <option value=""/>
                    <option value="last-12-hours">Last 12 hours</option>
                    <option value="last-24-hours">Last 24 hours</option>
                    <option value="last-48-hours">Last 48 hours</option>
                    <option value="last-7-days">Last 7 days</option>
                    <option value="last-30-days">Last 30 days</option>
                    <option value="custom">Custom range</option>
                  </select>
                </td>
              </tr>
              </tbody>
            </table>
            {renderCustomDateControls()}
          </div>
          <div key="commenting" {...css(STYLES.filterSection)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Comment settings
            </h5>
            <select
              value={isCommentingEnabledFilter}
              onChange={setFilter('isCommentingEnabled')}
              {...css(ARTICLE_TABLE_STYLES.select, {width: '100%', marginTop: '20px'})}
            >
              <option value="">Show All</option>
              <option value="yes">Comments Enabled</option>
              <option value="no">Comments Disabled</option>
            </select>
          </div>
          <div key="automoderation" {...css(STYLES.filterSection)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Automoderation settings
            </h5>
            <select
              value={isAutoModeratedFilter}
              onChange={setFilter('isAutoModerated')}
              {...css(ARTICLE_TABLE_STYLES.select, {width: '100%', marginTop: '20px'})}
            >
              <option value="">Show All</option>
              <option value="yes">Automoderation Enabled</option>
              <option value="no">Automoderation Disabled</option>
            </select>
          </div>
          <div key="commentsToReview" {...css(STYLES.filterSection)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Comments to review
            </h5>
            <select
              value={commentsToReviewFilter}
              onChange={setFilter('commentsToReview')}
              {...css(ARTICLE_TABLE_STYLES.select, {width: '100%', marginTop: '20px'})}
            >
              <option value="">Show All</option>
              <option value="yes">New and deferred comments to review</option>
              <option value="new">New comments to review</option>
              <option value="deferred">Deferred comments to review</option>
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
      popupToShow: POPUP_SAVING,
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
    if (this.state.popupToShow !== POPUP_CONTROLS || !imOpen) {
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
      ret.push(<SmallUserIcon user={article.assignedModerators[i]}/>);
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
      popupToShow: POPUP_SAVING,
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

    if (this.state.popupToShow === POPUP_SAVING) {
      return (
        <Scrim isVisible onBackgroundClick={this.clearPopups} scrimStyles={STYLES.scrimPopup}>
          <div tabIndex={0} {...css(SCRIM_STYLE.popup)}>
            Saving....
          </div>
        </Scrim>
      );
    }

    if (this.state.popupToShow !== POPUP_MODERATORS) {
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
      myUserId,
    } = this.props;

    const {
      filter,
      sort,
    } = this.state;

    let processedArticles: Array<IArticleModel> = articles.toArray();

    if (Object.keys(filter).length > 0) {
      processedArticles = processedArticles.filter(executeFilter(filter, {myId: myUserId}));
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

    const filterActive = isFilterActive(this.state.filter);
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
              <th key="mods" {...css(ARTICLE_TABLE_STYLES.headerCell, ARTICLE_TABLE_STYLES.iconCell, {...flexCenter, color: filterActive ? NICE_MIDDLE_BLUE : NICE_LIGHTEST_BLUE})}>
                <div {...css({width: '44px', height: '44px', borderRadius: '50%', ...flexCenter, backgroundColor: filterActive ? NICE_LIGHTEST_BLUE : NICE_MIDDLE_BLUE})}>
                  <icons.FilterIcon {...css(medium)} onClick={this.openFilters}/>
                </div>
                {this.renderFilterPopup(currentSort)}
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
