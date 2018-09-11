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

import { ICategoryModel } from '../../../models';
import { logout } from '../../auth';
import * as icons from '../../components/Icons';
import { GUTTER_DEFAULT_SPACING, HEADER_HEIGHT, HEADLINE_TYPE, LIGHT_PRIMARY_TEXT_COLOR } from '../../styles';
import { NICE_DARK_BLUE, NICE_MIDDLE_BLUE } from '../../styles';
import { css, stylesheet } from '../../util';

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
    marginLeft: '10px',
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
});

export interface IITableFrameProps extends WithRouterProps {
  dispatch: Function;
  isAdmin: boolean;
  categories: List<ICategoryModel>;
}

export interface IITableFrameState {
}

export class TableFrame extends React.Component<IITableFrameProps, IITableFrameState> {
  @autobind
  logout() {
    this.props.dispatch(logout());
  }

  render() {
    const {
      isAdmin,
      location,
      categories,
    } = this.props;

    function renderHeaderItem(icon: any, text: string, link: string, matcher?: (val: string) => boolean) {
      let styles = {...css(STYLES.headerItem)};
      if (matcher && matcher(location.pathname)) {
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

    let category = 'All Sections';
    const m = /category=(\d+)/.exec(location.pathname);
    if (m) {
      category = `Unknown Section (${m[1]})`;
      for (const c of categories.toArray()) {
        if (c.id === m[1]) {
          category = `Section: ${c.label}`;
        }
      }
    }

    return (
      <div>
        <header key="header" role="banner" {...css(STYLES.header)}>
          <div key="appName" >
            <span key="icon" {...css(STYLES.menuIcon)}><icons.MenuIcon/></span> <span key="cat" {...css(STYLES.title)}>{category}</span>
          </div>
          {renderHeaderItem(<icons.ListIcon/>, 'My Articles', '/a/user=me/~', (val) => /^\/a\/.*user=me.*/.test(val))}
          {renderHeaderItem(<icons.ListIcon/>, 'All Articles', '/a',  (val) => (/^\/a.*/.test(val) && !/^\/a\/.*user=me.*/.test(val)))}
          <div key="spacer" style={{flexGrow: 1}}/>
          {renderHeaderItem(<icons.SearchIcon/>, 'Search', '/search')}
          {isAdmin && renderHeaderItem(<icons.SettingsIcon/>, 'Settings', '/settings')}
          <div key="logout" {...css(STYLES.headerItem)}>
            <div {...css(STYLES.headerLink)} aria-label="Logout" onClick={this.logout}>
              <icons.UserIcon/><br/>
              <span {...css(STYLES.headerText)}>Logout</span>
            </div>
          </div>
        </header>
        <div key="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}
