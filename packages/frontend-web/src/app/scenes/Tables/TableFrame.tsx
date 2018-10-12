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
import { List } from 'immutable';
import React from 'react';
import { Link, WithRouterProps } from 'react-router';

import { ICategoryModel, IUserModel } from '../../../models';
import { logout } from '../../auth';
import * as icons from '../../components/Icons';
import {
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  HEADLINE_TYPE,
  LIGHT_PRIMARY_TEXT_COLOR,
  NICE_LIGHT_BLUE,
  NICE_LIGHT_HIGHLIGHT_BLUE,
  SIDEBAR_BLUE,
} from '../../styles';
import { NICE_DARK_BLUE, NICE_MIDDLE_BLUE } from '../../styles';
import { css, stylesheet } from '../../util';
import { dashboardLink, searchLink, settingsLink } from '../routes';
import { COMMON_STYLES } from './styles';

const SIDEBAR_XPAD = 15;

const STYLES = stylesheet({
  header: {
    alignItems: 'center',
    background: NICE_DARK_BLUE,
    foreground: LIGHT_PRIMARY_TEXT_COLOR,
    boxSizing: 'border-box',
    display: 'flex',
    width: '100%',
    height: `${HEADER_HEIGHT}px`,
  },

  menuIcon: {
    color: LIGHT_PRIMARY_TEXT_COLOR,
    marginLeft: `10px`,
    position: 'relative',
    top: '-4px',
  },

  title: {
    ...HEADLINE_TYPE,
    fontSize: '22px',
    color: LIGHT_PRIMARY_TEXT_COLOR,
    margin: '0 50px',
  },

  headerItem: {
    color: LIGHT_PRIMARY_TEXT_COLOR,
    textAlign: 'center',
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
    paddingTop: `${10}px`,
    marginTop: `${3}px`,
    flexGrow: 0,
    height: `${HEADER_HEIGHT - 10 - 3}px`,
  },
  headerItemSelected: {
    background: NICE_MIDDLE_BLUE,
    borderTopLeftRadius: `${6}px`,
    borderTopRightRadius: `${6}px`,
  },

  headerLink: {
    color: LIGHT_PRIMARY_TEXT_COLOR,
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  headerText: {
    fontSize: '10px',
    color: LIGHT_PRIMARY_TEXT_COLOR,
  },
  sidebarOverlay: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'black',
    opacity: '0.4',
    zIndex: '1',
  },

  sidebar: {
    position: 'absolute',
    top: '0',
    left: '0',
    bottom: '0',
    width: '27%',
    backgroundColor: SIDEBAR_BLUE,
    color: 'white',
    opacity: '1',
    zIndex: '2',
  },

  sidebarHeader: {
    height: `${HEADER_HEIGHT * 1.5}px`,
    lineHeight: `${HEADER_HEIGHT * 1.5}px`,
    borderBottom: `1px solid ${NICE_LIGHT_BLUE}`,
    padding: `0 ${SIDEBAR_XPAD}px`,
    marginBottom: '10px',
  },

  sidebarHeaderIcon: {
    marginRight: '30px',
    position: 'relative',
    top: '13px',
  },

  sidebarRow: {
    width: '100%',
    padding: `15px ${SIDEBAR_XPAD}px`,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
  },

  sidebarRowSelected: {
    backgroundColor: NICE_MIDDLE_BLUE,
    borderLeft: `5px solid ${NICE_LIGHT_HIGHLIGHT_BLUE}`,
    paddingLeft: `${SIDEBAR_XPAD - 5}px`,
  },

  sidebarRowHeader: {
    fontSize: '12px',
    color: NICE_LIGHT_BLUE,
  },

  sidebarSection: {
  },

  sidebarCount: {
    marginLeft: `${SIDEBAR_XPAD}px`,
  },
});

export interface IITableFrameProps extends WithRouterProps {
  dispatch: Function;
  user: IUserModel;
  isAdmin: boolean;
  categories: List<ICategoryModel>;
}

export interface IITableFrameState {
  sidebarVisible: boolean;
}

export class TableFrame extends React.Component<IITableFrameProps, IITableFrameState> {
  constructor(props: IITableFrameProps) {
    super(props);

    this.state = {
      sidebarVisible: false,
    };
  }

  @autobind
  logout() {
    this.props.dispatch(logout());
  }

  @autobind
  showSidebar() {
    this.setState({sidebarVisible: true});
  }

  @autobind
  hideSidebar() {
    this.setState({sidebarVisible: false});
  }

  renderSidebar(isMe: boolean, category?: ICategoryModel) {
    if (!this.state.sidebarVisible) {
      return '';
    }

    const {
      user,
      categories,
    } = this.props;

    const isMeSuffix = isMe ? '+user=me' : '';
    const allLink = isMe ? dashboardLink('user=me') : dashboardLink();
    const allUnmoderated = categories.reduce((r: number, v: ICategoryModel) => (r + v.unmoderatedCount), 0);

    return (
      <div>
        <div key="overlay" {...css(STYLES.sidebarOverlay)}/>
        <div key="sidebar" {...css(STYLES.sidebar)}>
          <div key="header" {...css(STYLES.sidebarHeader)} onClick={this.hideSidebar}>
            {user.avatarURL ?
              <img src={user.avatarURL} {...css(COMMON_STYLES.smallImage, STYLES.sidebarHeaderIcon)}/> :
              <icons.UserIcon {...css(COMMON_STYLES.smallIcon, STYLES.sidebarHeaderIcon, {color: NICE_MIDDLE_BLUE})}/>
            }
            {user.name}
          </div>
          <div key="labels" {...css(STYLES.sidebarRow, STYLES.sidebarRowHeader)}>
            <div key="label" {...css(STYLES.sidebarSection)}>Section</div>
            <div key="count" {...css(STYLES.sidebarCount)}>New comments</div>
          </div>
          <div key="all" {...css(STYLES.sidebarRow, category ? {} : STYLES.sidebarRowSelected)}>
            <div key="label" {...css(STYLES.sidebarSection)}>
              <Link to={allLink} onClick={this.hideSidebar} {...css(COMMON_STYLES.cellLink)}>All</Link>
            </div>
            <div key="count" {...css(STYLES.sidebarCount)}>{allUnmoderated}</div>
          </div>
          {categories.map((c: ICategoryModel) => (
            <div key={c.id} {...css(STYLES.sidebarRow, category && category.id === c.id ? STYLES.sidebarRowSelected : {})}>
              <div key="label" {...css(STYLES.sidebarSection)}>
                <Link to={dashboardLink(`category=${c.id}${isMeSuffix}`)} onClick={this.hideSidebar} {...css(COMMON_STYLES.cellLink)}>
                  {c.label}
                </Link>
              </div>
              <div key="count" {...css(STYLES.sidebarCount)}>{c.unmoderatedCount}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  render() {
    const {
      isAdmin,
      categories,
      location,
    } = this.props;

    const isMe = /user=me/.test(location.pathname);

    function renderHeaderItem(icon: any, text: string, link: string, selected?: boolean) {
      let styles = {...css(STYLES.headerItem)};
      if (selected) {
        styles = {...css(STYLES.headerItem, STYLES.headerItemSelected)};
      }

      return (
        <div key={text} {...styles}>
          <Link to={link} aria-label={text} {...css(STYLES.headerLink)}>
            {icon}<br/>
            <span {...css(STYLES.headerText)}>{text}</span>
          </Link>
        </div>
      );
    }

    let category = null;
    let categoryStr = 'All Sections';
    let categoryFilter = null;
    const m = /category=(\d+)/.exec(location.pathname);
    if (m) {
      categoryStr = `Unknown Section (${m[1]})`;
      for (const c of categories.toArray()) {
        if (c.id === m[1]) {
          category = c;
          categoryStr = `Section: ${c.label}`;
          categoryFilter = `category=${c.id}`;
        }
      }
    }

    let allArticles = dashboardLink();
    let myArticles = dashboardLink('user=me');
    if (categoryFilter) {
      allArticles += `/${categoryFilter}`;
      myArticles += `+${categoryFilter}`;
    }

    return (
      <div>
        <header key="header" role="banner" {...css(STYLES.header)}>
          <div key="appName"  onClick={this.showSidebar}>
            <span key="icon" {...css(STYLES.menuIcon)}><icons.MenuIcon/></span> <span key="cat" {...css(STYLES.title)}>{categoryStr}</span>
          </div>
          {renderHeaderItem(<icons.ListIcon/>, 'All Articles', allArticles, !isMe)}
          {renderHeaderItem(<icons.ListIcon/>, 'My Articles', myArticles, isMe)}
          <div key="spacer" style={{flexGrow: 1}}/>
          {renderHeaderItem(<icons.SearchIcon/>, 'Search', searchLink())}
          {isAdmin && renderHeaderItem(<icons.SettingsIcon/>, 'Settings', settingsLink())}
          <div key="logout" {...css(STYLES.headerItem)}>
            <div {...css(STYLES.headerLink)} aria-label="Logout" onClick={this.logout}>
              <icons.UserIcon/><br/>
              <span {...css(STYLES.headerText)}>Logout</span>
            </div>
          </div>
        </header>
        {this.renderSidebar(isMe, category)}
        <div key="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}
