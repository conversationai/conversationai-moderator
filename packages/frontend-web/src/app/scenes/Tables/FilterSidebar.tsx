/*
Copyright 2018 Google Inc.

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
import React, { KeyboardEvent, SyntheticEvent } from 'react';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import { IUserModel } from '../../../models';
import { Checkbox } from '../../components/Checkbox';
import * as icons from '../../components/Icons';
import { ModelId } from '../../stores/moderators';
import { SCRIM_STYLE } from '../../styles';
import {css, stylesheet} from '../../utilx';
import { SETTINGS_STYLES } from '../Settings/settingsStyles';
import { SmallUserIcon } from './components';
import { ARTICLE_TABLE_STYLES } from './styles';
import {
  FILTER_DATE_lastModeratedAt,
  FILTER_DATE_sourceCreatedAt,
  FILTER_DATE_updatedAt,
  FILTER_MODERATORS,
  FILTER_MODERATORS_ME,
  FILTER_MODERATORS_UNASSIGNED,
  FILTER_TITLE,
  FILTER_TO_REVIEW,
  FILTER_TO_REVIEW_ANY,
  FILTER_TO_REVIEW_DEFERRED,
  FILTER_TO_REVIEW_NEW,
  FILTER_TOGGLE_isAutoModerated,
  FILTER_TOGGLE_isCommentingEnabled,
  FILTER_TOGGLE_OFF,
  FILTER_TOGGLE_ON,
} from './utils';
import {
  filterDatePrior,
  filterDateRange,
  filterDateRangeValues,
  filterDateSince,
  getFilterValue,
  IFilterItem,
  resetFilterToRoot,
  updateFilter,
} from './utils';

const STYLES = stylesheet({
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

export interface IIFilterSidebarProps {
  filterString: string;
  filter: Array<IFilterItem>;

  myUserId: string;
  users: List<IUserModel>;

  setFilter(filter: Array<IFilterItem>): void;
  clearPopup(): void;
}

export interface IIFilterSidebarState {
  titleFilter: string;
  moderatorFilterString: string;
  moderatorFilterUsers: Set<ModelId>;
  dateFilterKey: string;
  dateFilterValue: string;
  dateFilterSelect?: string;
  dateFilterFrom?: string;
  dateFilterTo?: string;
  isCommentingEnabledFilter: string;
  isAutoModeratedFilter: string;
  commentsToReviewFilter: string;
}

const DATE_FILTER_RANGE = 'custom';

export class FilterSidebar extends React.Component<IIFilterSidebarProps, IIFilterSidebarState> {
  static unpackState(props: Readonly<IIFilterSidebarProps>): IIFilterSidebarState {
    const filter = props.filter;
    const moderatorFilterString = getFilterValue(filter, FILTER_MODERATORS);
    let moderatorFilterUsers: Array<string> = [];

    if (moderatorFilterString.length > 0 &&
      moderatorFilterString !== FILTER_MODERATORS_ME &&
      moderatorFilterString !== FILTER_MODERATORS_UNASSIGNED) {
      moderatorFilterUsers = moderatorFilterString.split(',');
    }

    let dateFilterKey = FILTER_DATE_sourceCreatedAt;
    let dateFilterValue = '';
    let dateFilterSelect = null;
    let dateFilterFrom = null;
    let dateFilterTo = null;

    for (const f of filter) {
      if (f.key === FILTER_DATE_sourceCreatedAt ||
        f.key === FILTER_DATE_updatedAt ||
        f.key === FILTER_DATE_lastModeratedAt) {
        dateFilterKey = f.key;
        dateFilterValue = f.value;
        break;
      }
    }

    const dateFilterRangeValues = filterDateRangeValues(dateFilterValue);
    if (dateFilterRangeValues) {
      dateFilterSelect = DATE_FILTER_RANGE;
      dateFilterFrom = dateFilterRangeValues[0];
      dateFilterTo = dateFilterRangeValues[1];
    }
    else {
      dateFilterSelect = dateFilterValue;
    }

    return {
      titleFilter: getFilterValue(filter, FILTER_TITLE),
      moderatorFilterString: moderatorFilterString,
      moderatorFilterUsers: Set<string>(moderatorFilterUsers),
      dateFilterKey,
      dateFilterValue,
      dateFilterSelect,
      dateFilterFrom,
      dateFilterTo,
      isCommentingEnabledFilter: getFilterValue(filter, FILTER_TOGGLE_isCommentingEnabled),
      isAutoModeratedFilter: getFilterValue(filter, FILTER_TOGGLE_isAutoModerated),
      commentsToReviewFilter: getFilterValue(filter, FILTER_TO_REVIEW),
    };
  }

  constructor(props: Readonly<IIFilterSidebarProps>) {
    super(props);
    this.state = FilterSidebar.unpackState(props);
  }

  componentWillReceiveProps(props: Readonly<IIFilterSidebarProps>): void {
    this.setState(FilterSidebar.unpackState(props));
  }

  @autobind
  changeFilter(param: 'titleFilter') {
    return ((e: SyntheticEvent<any>) => {
      this.setState({[param]: e.currentTarget.value} as any);
    });
  }

  @autobind
  setFilter(key: string) {
    return (e: SyntheticEvent<any>) => {
      this.props.setFilter(updateFilter(this.props.filter, key, e.currentTarget.value));
    };
  }

  @autobind
  checkForEnter(key: string) {
    return (e: KeyboardEvent<any>) => {
      if (e.key === 'Enter') {
        this.props.setFilter(updateFilter(this.props.filter, key, e.currentTarget.value));
      }
    };
  }

  @autobind
  changeDateFilter(currentFilter: Array<IFilterItem>, key: string, value: string) {
    this.props.setFilter(updateFilter(currentFilter, key, value));
  }

  @autobind
  changeDateFilterKey(e: SyntheticEvent<any>) {
    const key = e.currentTarget.value;
    if (this.state.dateFilterValue === '') {
      this.setState({dateFilterKey: key});
    }
    else if (key !== this.state.dateFilterKey) {
      const cleanedFilter = updateFilter(this.props.filter, this.state.dateFilterKey);
      this.changeDateFilter(cleanedFilter, key, this.state.dateFilterValue);
    }
  }

  @autobind
  changeDateFilterSelect(e: SyntheticEvent<any>) {
    const newFilterSelect = e.currentTarget.value;
    if (newFilterSelect !== this.state.dateFilterSelect) {
      if (newFilterSelect !== DATE_FILTER_RANGE) {
        this.changeDateFilter(this.props.filter, this.state.dateFilterKey, newFilterSelect);
      }
      else {
        this.changeDateFilter(this.props.filter, this.state.dateFilterKey, filterDateRange(null, null));
      }
    }
  }

  @autobind
  changeDateFilterFrom(e: SyntheticEvent<any>) {
    const newFilterValue = filterDateRange(e.currentTarget.value, this.state.dateFilterTo);
    this.changeDateFilter(this.props.filter, this.state.dateFilterKey, newFilterValue);
  }

  @autobind
  changeDateFilterTo(e: SyntheticEvent<any>) {
    const newFilterValue = filterDateRange(this.state.dateFilterFrom, e.currentTarget.value);
    this.changeDateFilter(this.props.filter, this.state.dateFilterKey, newFilterValue);
  }

  @autobind
  setModerator(id: string) {
    // return (checked: boolean) => {
    //   const mf = checked ? this.state.moderatorFilter.add(id) : this.state.moderatorFilter.remove(id);
    return () => {
      const currentUsers = this.state.moderatorFilterUsers;
      const newUsers = currentUsers.contains(id) ? currentUsers.delete(id) : currentUsers.add(id);
      const moderators = newUsers.toArray().reduce<string | null>((s: string | null, v: ModelId) => (s ? `${s},${v}` : v.toString()), null);
      this.props.setFilter(updateFilter(this.props.filter, FILTER_MODERATORS, moderators));
    };
  }

  @autobind
  setModeratorUnassigned() {
    this.props.setFilter(updateFilter(this.props.filter, FILTER_MODERATORS, FILTER_MODERATORS_UNASSIGNED));
  }

  @autobind
  clearFilters() {
    this.props.clearPopup();
    this.props.setFilter(resetFilterToRoot(this.props.filter));
  }

  renderModerator(u: IUserModel) {
    return (
      <tr key={u.id} onClick={this.setModerator(u.id)}>
        <td key="icon">
          <SmallUserIcon user={u}/>
        </td>
        <td key="text" {...css({textAlign: 'left'})}>
          {u.name}
        </td>
        <td key="toggle" {...css({textAlign: 'right'})}>
          <Checkbox isSelected={this.state.moderatorFilterUsers.has(u.id)} onCheck={null}/>
        </td>
      </tr>
    );
  }

  renderCustomDateControls() {
    if (this.state.dateFilterSelect !== DATE_FILTER_RANGE) {
      return '';
    }
    return(
      <div {...css({marginTop: '20px'})}>
        <TextField
          label="From"
          type="date"
          defaultValue={this.state.dateFilterFrom}
          InputLabelProps={{
            shrink: true,
          }}
          onChange={this.changeDateFilterFrom}
        />&nbsp;
        <TextField
          label="To"
          type="date"
          defaultValue={this.state.dateFilterTo}
          InputLabelProps={{
            shrink: true,
          }}
          onChange={this.changeDateFilterTo}
        />
      </div>
    );
  }

  render() {
    const {
      myUserId,
      users,
    } = this.props;

    const {
      titleFilter,
      moderatorFilterString,
      dateFilterKey,
      dateFilterSelect,
      isCommentingEnabledFilter,
      isAutoModeratedFilter,
      commentsToReviewFilter,
    } = this.state;

    const me = users.find((u) => u.id === myUserId);
    const others = users.filter((u) => u.id !== myUserId).sort((u1, u2) => ('' + u1.name).localeCompare(u2.name));

    return (
      <div tabIndex={0} {...css(SCRIM_STYLE.popupMenu, {position: 'absolute', top: '0', right: '0', color: 'black'})}>
        <FocusTrap focusTrapOptions={{clickOutsideDeactivates: true}} >
          <h4 key="header" {...css(SCRIM_STYLE.popupTitle, {padding: '20px', fontSize: '18px', margin: 0})}>
            Filter titles
            <div onClick={this.props.clearPopup} {...css({float: 'right'})}>
              <icons.CloseIcon/>
            </div>
            <Button variant="contained" color="primary" onClick={this.clearFilters} style={{float: 'right', marginTop: '-7px', marginRight: '30px'}}>Reset</Button>
          </h4>
          <div key="title" {...css(STYLES.filterSection)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Title
            </h5>
            <input
              type="text"
              value={titleFilter}
              onKeyPress={this.checkForEnter(FILTER_TITLE)}
              onChange={this.changeFilter('titleFilter')}
              onBlur={this.setFilter(FILTER_TITLE)}
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
              <tr key="unassigned" onClick={this.setModeratorUnassigned}>
                <td key="icon"/>
                <td key="text" {...css({textAlign: 'left'})}>
                  No moderator assigned.
                </td>
                <td key="toggle" {...css({textAlign: 'right'})}>
                  <Checkbox isSelected={moderatorFilterString === FILTER_MODERATORS_UNASSIGNED} onCheck={null}/>
                </td>
              </tr>
              {this.renderModerator(me)}
              {others.map((u: IUserModel) => this.renderModerator(u))}
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
                  <select value={dateFilterKey} onChange={this.changeDateFilterKey} {...css(ARTICLE_TABLE_STYLES.select, {width: '200px'})}>
                    <option value={FILTER_DATE_sourceCreatedAt}>Date published</option>
                    <option value={FILTER_DATE_updatedAt}>Date last modified</option>
                    <option value={FILTER_DATE_lastModeratedAt}>Date last moderated</option>
                  </select>
                </td>
              </tr>
              <tr>
                <th key="label" {...css({textAlign: 'left'})}>
                  Filter range:
                </th>
                <td key="value" {...css({textAlign: 'right'})}>
                  <select value={dateFilterSelect} onChange={this.changeDateFilterSelect} {...css(ARTICLE_TABLE_STYLES.select, {width: '200px'})}>
                    <option value=""/>
                    <option value={filterDateSince(12)}>Last 12 hours</option>
                    <option value={filterDateSince(24)}>Last 24 hours</option>
                    <option value={filterDateSince(48)}>Last 48 hours</option>
                    <option value={filterDateSince(168)}>Last 7 days</option>
                    <option value={filterDatePrior(48)}>Older than 48 hours</option>
                    <option value={filterDatePrior(168)}>Older than 7 days</option>
                    <option value="custom">Custom range</option>
                  </select>
                </td>
              </tr>
              </tbody>
            </table>
            {this.renderCustomDateControls()}
          </div>
          <div key="commenting" {...css(STYLES.filterSection)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Comment settings
            </h5>
            <select
              value={isCommentingEnabledFilter}
              onChange={this.setFilter(FILTER_TOGGLE_isCommentingEnabled)}
              {...css(ARTICLE_TABLE_STYLES.select, {width: '100%', marginTop: '20px'})}
            >
              <option value="">Show All</option>
              <option value={FILTER_TOGGLE_ON}>Comments Enabled</option>
              <option value={FILTER_TOGGLE_OFF}>Comments Disabled</option>
            </select>
          </div>
          <div key="automoderation" {...css(STYLES.filterSection)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Automoderation settings
            </h5>
            <select
              value={isAutoModeratedFilter}
              onChange={this.setFilter(FILTER_TOGGLE_isAutoModerated)}
              {...css(ARTICLE_TABLE_STYLES.select, {width: '100%', marginTop: '20px'})}
            >
              <option value="">Show All</option>
              <option value={FILTER_TOGGLE_ON}>Automoderation Enabled</option>
              <option value={FILTER_TOGGLE_OFF}>Automoderation Disabled</option>
            </select>
          </div>
          <div key="commentsToReview" {...css(STYLES.filterSection)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Comments to review
            </h5>
            <select
              value={commentsToReviewFilter}
              onChange={this.setFilter('commentsToReview')}
              {...css(ARTICLE_TABLE_STYLES.select, {width: '100%', marginTop: '20px'})}
            >
              <option value="">Show All</option>
              <option value={FILTER_TO_REVIEW_ANY}>New and deferred comments to review</option>
              <option value={FILTER_TO_REVIEW_NEW}>New comments to review</option>
              <option value={FILTER_TO_REVIEW_DEFERRED}>Deferred comments to review</option>
            </select>
          </div>
        </FocusTrap>
      </div>
    );
  }
}
