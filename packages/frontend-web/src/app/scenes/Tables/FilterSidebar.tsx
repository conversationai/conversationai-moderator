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
import { List, Set } from 'immutable';
import React, { KeyboardEvent, SyntheticEvent } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

import 'react-perfect-scrollbar/dist/css/styles.css';

import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import InputAdornment from '@material-ui/core/InputAdornment';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';
import { Search } from '@material-ui/icons';

import { IUserModel, ModelId } from '../../../models';
import { Checkbox } from '../../components/Checkbox';
import * as icons from '../../components/Icons';
import { HEADER_HEIGHT, SCRIM_STYLE } from '../../styles';
import { css, stylesheet } from '../../utilx';
import { SmallUserIcon } from './components';
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
  isFilterActive,
  resetFilterToRoot,
  updateFilter,
} from './utils';

const STYLES = stylesheet({
  filter: {
    position: 'absolute',
    top: '0',
    right: '0',
    height: `${window.innerHeight - HEADER_HEIGHT}px`,
    color: 'black',
    display: 'flex',
    flexFlow: 'column',
    textAlign: 'left',
  },

  filterSection: {
    borderTop: '2px solid #eee',
    padding: '20px',
  },
  filterSectionModeratorsTitle: {
    borderTop: '2px solid #eee',
    padding: '20px 20px 10px 20px',
  },
  filterSectionModerators: {
    padding: '0 0 20px 20px',
  },
  filterSectionTitle: {
    padding: '20px',
    height: '30px',
    fontSize: '18px',
    margin: 0,
    flex: '0 0 auto',
  },
  filterSectionFixed: {
    flex: '0 0 auto',
  },
  filterSectionFlexible: {
    flex: '1 1 auto',
    overflowY: 'auto',
  },
  filterHeading: {
    ...SCRIM_STYLE.popupTitle,
    fontSize: '16px',
    fontWeight: 'bold',
    margin: 0,
    opacity: '0.4',
  },

  slideout: {
    height: 0,
    animationName: {
      from: {
        height: 'auto',
      },
      to: {
        height: 0,
      },
    },
    animationDuration: '0.3s',
    animationTimingFunction: 'ease',
    animationIterationCount: 1,
  },

  slidein: {
    height: 'auto',
    animationName: {
      from: {
        height: 0,
      },
      to: {
        height: 'auto',
      },
    },
    animationDuration: '0.3s',
    animationTimingFunction: 'ease',
    animationIterationCount: 1,
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
  isFilterActive: boolean;
  isDateFilterActive: boolean;
}

const DATE_FILTER_RANGE = 'custom';

export class FilterSidebar extends React.Component<IIFilterSidebarProps, IIFilterSidebarState> {
  _scrollBarRef: PerfectScrollbar = null;

  componentDidMount(): void {
    // For some reason, we have to give the perfect scrollbar a kick once the sizes of everything is known.
    // This is probably because we are in a flexbox.
    setTimeout(() => {
      (this._scrollBarRef as any).updateScroll();
    }, 50);
  }

  static unpackState(props: Readonly<IIFilterSidebarProps>): IIFilterSidebarState {
    const filter = props.filter;
    const moderatorFilterString = getFilterValue(filter, FILTER_MODERATORS);
    let moderatorFilterUsers: Array<string> = [];

    if (moderatorFilterString.length > 0 &&
      moderatorFilterString !== FILTER_MODERATORS_ME &&
      moderatorFilterString !== FILTER_MODERATORS_UNASSIGNED) {
      moderatorFilterUsers = moderatorFilterString.split(',');
    }

    let dateFilterKey = '';
    let dateFilterValue = '';
    let dateFilterSelect = null;
    let dateFilterFrom = null;
    let dateFilterTo = null;
    let isDateFilterActive = false;

    for (const f of filter) {
      if (f.key === FILTER_DATE_sourceCreatedAt ||
        f.key === FILTER_DATE_updatedAt ||
        f.key === FILTER_DATE_lastModeratedAt) {
        dateFilterKey = f.key;
        dateFilterValue = f.value;
        isDateFilterActive = true;
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
      isDateFilterActive,
      isCommentingEnabledFilter: getFilterValue(filter, FILTER_TOGGLE_isCommentingEnabled),
      isAutoModeratedFilter: getFilterValue(filter, FILTER_TOGGLE_isAutoModerated),
      commentsToReviewFilter: getFilterValue(filter, FILTER_TO_REVIEW),
      isFilterActive: isFilterActive(filter),
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
  setFilter(key: string) {
    return (e: any) => {
      this.props.setFilter(updateFilter(this.props.filter, key, e.target.value));
    };
  }

  @autobind
  changeTitleFilter(e: SyntheticEvent<any>) {
    this.setState({titleFilter: e.currentTarget.value});
  }

  @autobind
  setTitleFilter() {
    this.props.setFilter(updateFilter(this.props.filter, FILTER_TITLE, this.state.titleFilter));
  }

  @autobind
  checkForTitleEnter(e: KeyboardEvent<any>) {
    if (e.key === 'Enter') {
      this.props.setFilter(updateFilter(this.props.filter, FILTER_TITLE, this.state.titleFilter));
    }
  }

  @autobind
  changeDateFilter(currentFilter: Array<IFilterItem>, key: string, value: string) {
    this.props.setFilter(updateFilter(currentFilter, key, value));
  }

  @autobind
  changeDateFilterKey(e: React.ChangeEvent<HTMLSelectElement>) {
    const oldValue = this.state.dateFilterKey;
    const value = e.target.value;
    if (value === oldValue) {
      return;
    }

    const cleanedFilter = updateFilter(this.props.filter, oldValue);
    if (this.state.isDateFilterActive && value === '') {
      this.props.setFilter(cleanedFilter);
      return;
    }

    if (value !== '' && this.state.dateFilterValue !== '') {
      this.changeDateFilter(cleanedFilter, value, this.state.dateFilterValue);
      return;
    }

    this.setState({
      dateFilterKey: value,
      dateFilterSelect: value === '' ? '' : this.state.dateFilterSelect,
    });
  }

  @autobind
  changeDateFilterSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === this.state.dateFilterSelect) {
      return;
    }

    if (this.state.isDateFilterActive && value === '') {
      const cleanedFilter = updateFilter(this.props.filter, this.state.dateFilterKey);
      this.props.setFilter(cleanedFilter);
      return;
    }
    if (this.state.dateFilterKey !== '' && value !== '') {
      if (value !== DATE_FILTER_RANGE) {
        this.changeDateFilter(this.props.filter, this.state.dateFilterKey, value);
      }
      else {
        this.changeDateFilter(this.props.filter, this.state.dateFilterKey, filterDateRange(null, null));
      }
      return;
    }
    this.setState({
      dateFilterSelect: value,
      dateFilterValue: value === DATE_FILTER_RANGE ? filterDateRange(null, null) : value,
    });
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
        <td key="toggle" {...css({textAlign: 'right', paddingRight: '20px'})}>
          <Checkbox isSelected={this.state.moderatorFilterUsers.has(u.id)} onCheck={null} style={{display: 'inline-block'}}/>
        </td>
      </tr>
    );
  }

  renderCustomDateControls() {
    if (this.state.dateFilterSelect !== DATE_FILTER_RANGE) {
      return '';
    }
    return(
      <div key="date range" {...css({marginTop: '20px'})}>
        <TextField
          label="From"
          type="date"
          defaultValue={this.state.dateFilterFrom}
          InputLabelProps={{
            shrink: true,
          }}
          onChange={this.changeDateFilterFrom}
          style={{minWidth: 190, margin: '0 10px 0 0'}}
        />
        <TextField
          label="To"
          type="date"
          defaultValue={this.state.dateFilterTo}
          InputLabelProps={{
            shrink: true,
          }}
          onChange={this.changeDateFilterTo}
          style={{minWidth: 190, margin: '0 0 0 10px'}}
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
      <div key="main" tabIndex={0} {...css(SCRIM_STYLE.popupMenu, STYLES.filter)}>
        <h4 key="header" {...css(SCRIM_STYLE.popupTitle, STYLES.filterSectionTitle)}>
          Filter titles
          <div onClick={this.props.clearPopup} {...css({float: 'right'})}>
            <icons.CloseIcon/>
          </div>
          {this.state.isFilterActive &&
          <Button
            key="reset"
            variant="contained"
            color="primary"
            onClick={this.clearFilters}
            style={{float: 'right', marginTop: '-7px', marginRight: '30px'}}
          >
            Reset
          </Button>
          }
        </h4>
        {moderatorFilterString !== FILTER_MODERATORS_ME && [
          (<div key="moderatorTitle" {...css(STYLES.filterSectionModeratorsTitle, STYLES.filterSectionFixed)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Moderators
            </h5>
          </div>),
          (<div key="moderators" {...css(STYLES.filterSectionModerators, STYLES.filterSectionFlexible)}>
            <PerfectScrollbar ref={(ref) => { this._scrollBarRef = ref; }}>
              <table key="main" {...css({width: '100%'})}>
                <tbody>
                <tr key="unassigned" onClick={this.setModeratorUnassigned}>
                  <td key="icon"/>
                  <td key="text" {...css({textAlign: 'left'})}>
                    No moderator assigned.
                  </td>
                  <td key="toggle" {...css({textAlign: 'right', paddingRight: '20px'})}>
                    <Checkbox isSelected={moderatorFilterString === FILTER_MODERATORS_UNASSIGNED} onCheck={null} style={{display: 'inline-block'}}/>
                  </td>
                </tr>
                {this.renderModerator(me)}
                {others.map((u: IUserModel) => this.renderModerator(u))}
                </tbody>
              </table>
            </PerfectScrollbar>
          </div>),
        ]}
        <div key="title" {...css(STYLES.filterSection, STYLES.filterSectionFixed)}>
          <TextField
            label="Articles with titles that contain..."
            value={titleFilter}
            margin="dense"
            style={{width: '100%', marginTop: '20px'}}
            onKeyPress={this.checkForTitleEnter}
            onChange={this.changeTitleFilter}
            onBlur={this.setTitleFilter}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search style={{opacity: 0.40}}/>
                </InputAdornment>
              ),
            }}
          />
          <div key="dates" style={{marginTop: '40px'}}>
            <FormControl style={{minWidth: '190px', margin: '0 10px 0 0'}}>
              <InputLabel htmlFor="date-key">Articles with date</InputLabel>
              <Select
                value={dateFilterKey}
                onChange={this.changeDateFilterKey}
                inputProps={{id: 'date-key'}}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                <MenuItem value={FILTER_DATE_sourceCreatedAt}>Published</MenuItem>
                <MenuItem value={FILTER_DATE_updatedAt}>Last modified</MenuItem>
                <MenuItem value={FILTER_DATE_lastModeratedAt}>Last moderated</MenuItem>
              </Select>
            </FormControl>
            <FormControl disabled={dateFilterKey === ''} style={{minWidth: '190px', margin: '0 0 0 10px'}}>
              <InputLabel htmlFor="date-select">matching</InputLabel>
              <Select
                value={dateFilterSelect}
                onChange={this.changeDateFilterSelect}
                inputProps={{id: 'date-select'}}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                <MenuItem value={filterDateSince(12)}>Last 12 hours</MenuItem>
                <MenuItem value={filterDateSince(24)}>Last 24 hours</MenuItem>
                <MenuItem value={filterDateSince(48)}>Last 48 hours</MenuItem>
                <MenuItem value={filterDateSince(168)}>Last 7 days</MenuItem>
                <MenuItem value={filterDatePrior(48)}>Older than 48 hours</MenuItem>
                <MenuItem value={filterDatePrior(168)}>Older than 7 days</MenuItem>
                <MenuItem value={DATE_FILTER_RANGE}>Custom Range</MenuItem>
              </Select>
            </FormControl>
          </div>
          {this.renderCustomDateControls()}
          <div key="commenting" style={{marginTop: '40px'}}>
            <FormControl style={{minWidth: '400px', margin: '0'}}>
              <InputLabel htmlFor="ice-key">Articles with commenting...</InputLabel>
              <Select
                value={isCommentingEnabledFilter}
                onChange={this.setFilter(FILTER_TOGGLE_isCommentingEnabled)}
                inputProps={{id: 'ice-key'}}
              >
                <MenuItem value=""><em>Show All</em></MenuItem>
                <MenuItem value={FILTER_TOGGLE_ON}>Enabled</MenuItem>
                <MenuItem value={FILTER_TOGGLE_OFF}>Disabled</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div key="automoderation" style={{marginTop: '40px'}}>
            <FormControl style={{minWidth: '400px', margin: '0'}}>
              <InputLabel htmlFor="iam-key">Articles with auto-moderation...</InputLabel>
              <Select
                value={isAutoModeratedFilter}
                onChange={this.setFilter(FILTER_TOGGLE_isAutoModerated)}
                inputProps={{id: 'iam-key'}}
              >
                <MenuItem value="">Show All</MenuItem>
                <MenuItem value={FILTER_TOGGLE_ON}>Enabled</MenuItem>
                <MenuItem value={FILTER_TOGGLE_OFF}>Disabled</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div key="commentsToReview" style={{marginTop: '40px', marginBottom: '40px'}}>
            <FormControl style={{minWidth: '400px', margin: '0'}}>
              <InputLabel htmlFor="ctr-key">Articles with comments to review...</InputLabel>
              <Select
                value={commentsToReviewFilter}
                onChange={this.setFilter('commentsToReview')}
                inputProps={{id: 'ctr-key'}}
              >
                <MenuItem value="">Show All</MenuItem>
                <MenuItem value={FILTER_TO_REVIEW_ANY}>New and deferred</MenuItem>
                <MenuItem value={FILTER_TO_REVIEW_NEW}>New</MenuItem>
                <MenuItem value={FILTER_TO_REVIEW_DEFERRED}>Deferred</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
      </div>
    );
  }
}
