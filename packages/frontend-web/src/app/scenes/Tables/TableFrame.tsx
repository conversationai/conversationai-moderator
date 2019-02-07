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
import { List } from 'immutable';
import keyboardJS from 'keyboardjs';
import React from 'react';
import { Link, WithRouterProps } from 'react-router';

import { ICategoryModel, IUserModel } from '../../../models';
import { logout } from '../../auth';
import * as icons from '../../components/Icons';
import { Scrim } from '../../components/Scrim';
import {
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  HEADLINE_TYPE,
  LIGHT_PRIMARY_TEXT_COLOR,
  SIDEBAR_BLUE,
} from '../../styles';
import { NICE_DARK_BLUE, NICE_MIDDLE_BLUE } from '../../styles';
import { css, stylesheet } from '../../utilx';
import { dashboardLink, searchLink, settingsLink } from '../routes';
import { CategorySidebar} from './CategorySidebar';
import { FILTER_CATEGORY, FILTER_MODERATOR_ISME } from './utils';

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

  sidebar: {
    position: 'absolute',
    top: '0',
    left: '0',
    bottom: '0',
    width: '27%',
    backgroundColor: SIDEBAR_BLUE,
    color: 'white',
    opacity: '1',
    zIndex: 30,
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

  componentWillMount() {
    keyboardJS.bind('escape', this.hideSidebar);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.hideSidebar);
  }

  renderSidebar(selectMine: boolean, category?: ICategoryModel) {
    if (!this.state.sidebarVisible) {
      return '';
    }

    const {
      user,
      categories,
    } = this.props;

    return (
      <Scrim isVisible onBackgroundClick={this.hideSidebar} scrimStyles={{background: 'rgba(0, 0, 0, 0.4)'}}>
        <FocusTrap focusTrapOptions={{clickOutsideDeactivates: true}}>
          <CategorySidebar
            user={user}
            categories={categories}
            selectedCategory={category}
            hideSidebar={this.hideSidebar}
            selectMine={selectMine}
          />
        </FocusTrap>
      </Scrim>
    );
  }

  render() {
    const {
      isAdmin,
      categories,
      location,
    } = this.props;

    const isMe = location.pathname.indexOf(FILTER_MODERATOR_ISME) >= 0;

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
    const re = new RegExp(`${FILTER_CATEGORY}=(\\d+)`);
    const m = re.exec(location.pathname);
    if (m) {
      categoryStr = `Unknown Section (${m[1]})`;
      for (const c of categories.toArray()) {
        if (c.id === m[1]) {
          category = c;
          categoryStr = `Section: ${c.label}`;
          categoryFilter = `${FILTER_CATEGORY}=${c.id}`;
        }
      }
    }

    let allArticles = dashboardLink();
    let myArticles = dashboardLink(FILTER_MODERATOR_ISME);
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
