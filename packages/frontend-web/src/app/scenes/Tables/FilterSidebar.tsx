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
import { Seq, Set } from 'immutable';
import React, { KeyboardEvent, SyntheticEvent } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

import 'react-perfect-scrollbar/dist/css/styles.css';

import {
  Button,
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  FormControl,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  Slide,
  TextField,
} from '@material-ui/core';
import {
  ExpandMore,
} from '@material-ui/icons';

import { IUserModel, ModelId } from '../../../models';
import { getMyUserId } from '../../auth';
import { Avatar } from '../../components';
import * as icons from '../../components/Icons';
import { HEADER_HEIGHT, SCRIM_STYLE } from '../../styles';
import { css, stylesheet } from '../../utilx';
import {
  FILTER_DATE_lastModeratedAt,
  FILTER_DATE_sourceCreatedAt,
  FILTER_DATE_updatedAt,
  FILTER_MODERATORS,
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

const SIDEBAR_WIDTH = 350;

const STYLES = stylesheet({
  filter: {
    position: 'absolute',
    bottom: '0',
    right: '0',
    height: `${window.innerHeight - HEADER_HEIGHT}px`,
    width: `${SIDEBAR_WIDTH + 40}px`,
    color: 'black',
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'flex-start',
    textAlign: 'left',
  },

  filterSection: {
    borderTop: '2px solid #eee',
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
    flex: '0 1 auto',
    overflowY: 'auto',
  },
  filterHeading: {
    ...SCRIM_STYLE.popupTitle,
    fontSize: '16px',
    fontWeight: 'bold',
    margin: 0,
    opacity: '0.4',
  },
});

export interface IFilterSidebarProps {
  open: boolean;
  filterString: string;
  filter: Array<IFilterItem>;

  users: Seq.Indexed<IUserModel>;

  setFilter(filter: Array<IFilterItem>): void;

  clearPopups(): void;
}

export interface IFilterSidebarState {
  titleFilter: string;
  moderatorFilterString: string;
  moderatorFilterUsers?: Set<ModelId>;
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
  wasOpen: boolean;
}

const DATE_FILTER_RANGE = 'custom';

export class FilterSidebar extends React.Component<IFilterSidebarProps, IFilterSidebarState> {
  state: IFilterSidebarState = {
    titleFilter: '',
    moderatorFilterString: '',
    dateFilterKey: '',
    dateFilterValue: '',
    isCommentingEnabledFilter: '',
    isAutoModeratedFilter: '',
    commentsToReviewFilter: '',
    isFilterActive: false,
    isDateFilterActive: false,
    wasOpen: false,
  };

  static getDerivedStateFromProps(props: Readonly<IFilterSidebarProps>, state: Readonly<IFilterSidebarState>): IFilterSidebarState {
    const filter = props.filter;
    const moderatorFilterString = getFilterValue(filter, FILTER_MODERATORS);
    let moderatorFilterUsers: Array<string> = [];

    if (moderatorFilterString.length > 0 &&
      moderatorFilterString !== FILTER_MODERATORS_UNASSIGNED) {
      moderatorFilterUsers = moderatorFilterString.split(',');
    }

    // For things whose effect don't occur immediately, we only update their state when opening the sidebar
    let titleFilter = state.titleFilter;
    let dateFilterKey = state.dateFilterKey;
    let dateFilterValue = state.dateFilterValue;
    let dateFilterSelect = state.dateFilterSelect;
    let dateFilterFrom = state.dateFilterFrom;
    let dateFilterTo = state.dateFilterTo;
    let isDateFilterActive = state.isDateFilterActive;

    if (!state.wasOpen) {
      titleFilter = getFilterValue(filter, FILTER_TITLE);

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
    }

    return {
      titleFilter,
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
      wasOpen: props.open,
    };
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
    this.props.clearPopups();
    this.props.setFilter(resetFilterToRoot(this.props.filter));
  }

  renderModerator(u: IUserModel) {
    return (
      <tr key={u.id} onClick={this.setModerator(u.id)}>
        <td key="icon">
          <Avatar target={u} size={30}/>
        </td>
        <td key="text" {...css({textAlign: 'left'})}>
          {u.name}
        </td>
        <td key="toggle" {...css({textAlign: 'right', paddingRight: '20px'})}>
          <Radio checked={this.state.moderatorFilterUsers.has(u.id)} color="primary"/>
        </td>
      </tr>
    );
  }

  renderCustomDateControls() {
    if (this.state.dateFilterSelect !== DATE_FILTER_RANGE) {
      return '';
    }
    return (
      <div key="date range" {...css({marginTop: '10px'})}>
        <TextField
          label="From"
          type="date"
          defaultValue={this.state.dateFilterFrom}
          InputLabelProps={{
            shrink: true,
          }}
          onChange={this.changeDateFilterFrom}
          style={{width: `${SIDEBAR_WIDTH / 2 - 10}px`, margin: '0 10px 0 0'}}
        />
        <TextField
          label="To"
          type="date"
          defaultValue={this.state.dateFilterTo}
          InputLabelProps={{
            shrink: true,
          }}
          onChange={this.changeDateFilterTo}
          style={{width: `${SIDEBAR_WIDTH / 2 - 10}px`, margin: '0 0 0 10px'}}
        />
      </div>
    );
  }

  render() {
    const {
      users,
      open,
      clearPopups,
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

    const myUserId = getMyUserId();
    const me = users.find((u) => u.id === myUserId);
    const others = users.filter((u) => u.id !== myUserId).sort((u1, u2) => ('' + u1.name).localeCompare(u2.name));

    return (
      <Slide direction="left" in={open} mountOnEnter unmountOnExit>
        <div key="main" tabIndex={0} {...css(SCRIM_STYLE.popupMenu, STYLES.filter)}>
          <h4 key="header" {...css(SCRIM_STYLE.popupTitle, STYLES.filterSectionTitle)}>
            Filter titles
            <div onClick={clearPopups} {...css({float: 'right'})}>
              <icons.CloseIcon/>
            </div>
            {this.state.isFilterActive &&  (
              <Button
                key="reset"
                variant="contained"
                color="primary"
                onClick={this.clearFilters}
                style={{float: 'right', marginTop: '-7px', marginRight: '30px'}}
              >
                Reset
              </Button>
            )}
          </h4>
          <div key="moderatorTitle" {...css(STYLES.filterSectionModeratorsTitle, STYLES.filterSectionFixed)}>
            <h5 key="header" {...css(STYLES.filterHeading)}>
              Moderators
            </h5>
          </div>
          <div key="moderators" {...css(STYLES.filterSectionModerators, STYLES.filterSectionFlexible)}>
            <PerfectScrollbar>
              <table key="main" {...css({width: '100%'})}>
                <tbody>
                <tr key="unassigned" onClick={this.setModeratorUnassigned}>
                  <td key="icon"/>
                  <td key="text" {...css({textAlign: 'left'})}>
                    No moderator assigned.
                  </td>
                  <td key="toggle" {...css({textAlign: 'right', paddingRight: '20px'})}>
                    <Radio checked={moderatorFilterString === FILTER_MODERATORS_UNASSIGNED} color="primary"/>
                  </td>
                </tr>
                {this.renderModerator(me)}
                {others.map((u: IUserModel) => this.renderModerator(u))}
                </tbody>
              </table>
            </PerfectScrollbar>
          </div>
          <div key="title" {...css(STYLES.filterSection, STYLES.filterSectionFixed)}>
            <ExpansionPanel elevation={0} defaultExpanded>
              <ExpansionPanelSummary expandIcon={<ExpandMore/>}>
                <h5 key="header" {...css(STYLES.filterHeading)}>
                  Other filters
                </h5>
              </ExpansionPanelSummary>
              <ExpansionPanelDetails>
                <div style={{display: 'flex', flexDirection: 'column'}}>
                  <TextField
                    label="Articles with titles that contain..."
                    value={titleFilter}
                    margin="dense"
                    style={{width: `${SIDEBAR_WIDTH}px`, marginTop: '0px'}}
                    onKeyPress={this.checkForTitleEnter}
                    onChange={this.changeTitleFilter}
                    onBlur={this.setTitleFilter}
                  />
                  <div key="dates" style={{marginTop: '40px'}}>
                    <FormControl style={{minWidth: `${SIDEBAR_WIDTH}px`, margin: '0'}}>
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
                  </div>
                  <div key="dates2" style={{marginTop: '10px'}}>
                    <FormControl disabled={dateFilterKey === ''} style={{minWidth: `${SIDEBAR_WIDTH}px`, margin: '0'}}>
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
                    <FormControl style={{width: `${SIDEBAR_WIDTH}px`, margin: '0'}}>
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
                    <FormControl style={{width: `${SIDEBAR_WIDTH}px`, margin: '0'}}>
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
                    <FormControl style={{width: `${SIDEBAR_WIDTH}px`, margin: '0'}}>
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
              </ExpansionPanelDetails>
            </ExpansionPanel>
          </div>
        </div>
      </Slide>
    );
  }
}
