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
import { List } from 'immutable';
import React from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { Link } from 'react-router';

import 'react-perfect-scrollbar/dist/css/styles.css';

import { AccountCircle, Settings } from '@material-ui/icons';

import { ICategoryModel, IUserModel } from '../../../models';
import {
  ALMOST_WHITE,
  HEADER_HEIGHT,
} from '../../styles';
import { css, stylesheet } from '../../utilx';
import { categoriesLink, dashboardLink, settingsLink } from '../routes';
import { COMMON_STYLES } from './styles';
import { FILTER_CATEGORY, FILTER_MODERATOR_ISME } from './utils';

const SIDEBAR_HEADER_HEIGHT = 159;
const SIDEBAR_ROW_HEIGHT = 55;
const SIDEBAR_ICON_SIZE = 36;
const SIDEBAR_XPAD = 17;
export const SIDEBAR_WIDTH = 280;

const STYLES = stylesheet({
  sidebar: {
    width: `${SIDEBAR_WIDTH}px`,
    backgroundColor: ALMOST_WHITE,
    color: 'black',
    display: 'flex',
    flexFlow: 'column',
  },

  sidebarFixed: {
    height: `${window.innerHeight - HEADER_HEIGHT}px`,
  },

  sidebarFloating: {
    height: '100%',
  },

  sidebarChunk: {
    flex: `0 0 auto`,
  },

  sidebarHeader: {
    flex: `0 0 ${SIDEBAR_HEADER_HEIGHT}px`,
    fontSize: '14px',
    display: 'flex',
  },

  sidebarFooter: {
    flex: `0 0 ${30}px`,
  },

  sidebarBar: {
    width: '100%',
    height: '0px',
    borderBottom: `1px solid black`,
    opacity: '0.08',
    flex: `0 0 ${1}px`,
  },

  sidebarHeaderIcon: {
    width: `${SIDEBAR_ICON_SIZE}px`,
    height: `${SIDEBAR_ICON_SIZE}px`,
    borderRadius: `${(SIDEBAR_ICON_SIZE / 2)}px`,
    margin: `${(SIDEBAR_HEADER_HEIGHT - SIDEBAR_ICON_SIZE) / 2}px 13px ${(SIDEBAR_HEADER_HEIGHT - SIDEBAR_ICON_SIZE) / 2}px 18px`,
  },

  verticalCenterText: {
    height: '100%',
    display: 'inline-flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  sidebarRow: {
    width: `${SIDEBAR_WIDTH - 16}px`,
    padding: `8px`,
  },

  sidebarRowInner: {
    width: `${SIDEBAR_WIDTH - 16}px`,
    height: `${SIDEBAR_ROW_HEIGHT - 16}px`,
    padding: `0 ${SIDEBAR_XPAD}px`,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    fontSize: '14px',
  },

  sidebarRowSelected: {
    backgroundColor: 'rgba(46,131,237,0.12)',
    borderRadius: '4px',
    boxShadow: `0 2px 4px 0 rgba(0,0,0,0.25)`,
  },

  sidebarSettings: {
    fontSize: '14px',
    color: 'rgba(0,0,0,0.56)',
    height: `${SIDEBAR_ROW_HEIGHT - 16}px`,
  },

  sidebarRowHeader: {
    fontSize: '12px',
    color: 'rgba(0,0,0,0.54)',
  },

  sidebarSection: {
  },

  sidebarCount: {
    marginLeft: `${SIDEBAR_XPAD}px`,
    minWidth: '50px',
    textAlign: 'right',
  },

  sidebarLink: {
    color: 'inherit',
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
    ':focus': {
      outline: 'none',
    },
  },
});

export interface ICategorySidebarProps {
  user: IUserModel;
  categories: List<ICategoryModel>;
  selectedCategory?: ICategoryModel;
  selectMine: boolean;
  isAdmin?: boolean;
  isFixed?: boolean;
  hideSidebar?(): void;
}

export class CategorySidebar extends React.Component<ICategorySidebarProps> {
  _scrollBarRef: PerfectScrollbar = null;

  componentDidMount(): void {
    // For some reason, we have to give the perfect scrollbar a kick once the sizes of everything is known.
    // This is probably because we are in a flexbox.
    setTimeout(() => {
      (this._scrollBarRef as any).updateScroll();
    }, 50);
  }

  render() {
    const {
      user,
      categories,
      selectedCategory,
      hideSidebar,
      selectMine,
      isAdmin,
      isFixed,
    } = this.props;

    const isMeSuffix = selectMine ? `+${FILTER_MODERATOR_ISME}` : '';
    const allLink = selectMine ? dashboardLink(FILTER_MODERATOR_ISME) : dashboardLink();
    const allUnmoderated = categories.reduce((r: number, v: ICategoryModel) => (r + v.unmoderatedCount), 0);

    return(
      <div key="sidebar" {...css(STYLES.sidebar, isFixed ? STYLES.sidebarFixed : STYLES.sidebarFloating)}>
        <div key="header" {...css(STYLES.sidebarHeader)} onClick={hideSidebar}>
          {user.avatarURL ?
            <img src={user.avatarURL} {...css(STYLES.sidebarHeaderIcon)} alt="Your image"/> :
            <AccountCircle {...css(STYLES.sidebarHeaderIcon, {fontSize: SIDEBAR_ICON_SIZE})}/>
          }
          <span {...css(STYLES.verticalCenterText)}>{user.name}</span>
        </div>
        <div key="bar" {...css(STYLES.sidebarBar)}/>
        {isAdmin &&
          <div key="settings" {...css(STYLES.sidebarRow, STYLES.sidebarSettings, STYLES.sidebarChunk, {paddingLeft: `${SIDEBAR_XPAD + 8}px`})}>
            <Link to={settingsLink()} aria-label="Settings" {...css(STYLES.sidebarLink)}>
              <div key="label" {...css(STYLES.sidebarSection, STYLES.verticalCenterText)}><Settings/></div>
              <div key="count" {...css(STYLES.sidebarCount, STYLES.verticalCenterText, {marginLeft: '46px', verticalAlign: 'bottom'})}>Settings</div>
            </Link>
          </div>}
        {isAdmin && <div key="bar2" {...css(STYLES.sidebarBar)}/>}
        <div key="labels" {...css(STYLES.sidebarRow, STYLES.sidebarRowHeader, STYLES.sidebarChunk)}>
          <div {...css(STYLES.sidebarRowInner)}>
            <span key="label" {...css(STYLES.sidebarSection, STYLES.verticalCenterText)}>Section</span>
            <span key="count" {...css(STYLES.sidebarCount, STYLES.verticalCenterText)}>New comments</span>
          </div>
        </div>
        <PerfectScrollbar key="scrollbarArea" ref={(ref) => { this._scrollBarRef = ref; }}>
          <div key="all" {...css(STYLES.sidebarRow)}>
            <div {...css(STYLES.sidebarRowInner, selectedCategory ? {} : STYLES.sidebarRowSelected)}>
              <div key="label" {...css(STYLES.sidebarSection, STYLES.verticalCenterText)}>
                <Link to={allLink} onClick={hideSidebar} {...css(COMMON_STYLES.cellLink)}>Home / All</Link>
              </div>
              <Link to={categoriesLink('all', 'new')} {...css(COMMON_STYLES.cellLink)}>
                <div key="count" {...css(STYLES.sidebarCount, STYLES.verticalCenterText)}>{allUnmoderated}</div>
              </Link>
            </div>
          </div>
          {categories.map((c: ICategoryModel) => (
            <div key={c.id} {...css(STYLES.sidebarRow)}>
              <div {...css(STYLES.sidebarRowInner, selectedCategory && selectedCategory.id === c.id ? STYLES.sidebarRowSelected : {})}>
                <div key="label" {...css(STYLES.sidebarSection, STYLES.verticalCenterText)}>
                  <Link to={dashboardLink(`${FILTER_CATEGORY}=${c.id}${isMeSuffix}`)} onClick={hideSidebar} {...css(COMMON_STYLES.cellLink)}>
                    {c.label}
                  </Link>
                </div>
                <div key="count" {...css(STYLES.sidebarCount, STYLES.verticalCenterText)}>
                  <Link to={categoriesLink(c.id, 'new')} {...css(COMMON_STYLES.cellLink)}>
                    {c.unmoderatedCount}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </PerfectScrollbar>
        {isAdmin && <div key="bar3" {...css(STYLES.sidebarBar)}/>}
        <div key="footer" {...css(STYLES.sidebarFooter)}/>
      </div>
    );
  }
}
