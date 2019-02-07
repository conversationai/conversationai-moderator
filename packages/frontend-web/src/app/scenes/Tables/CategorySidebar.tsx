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
import { Link } from 'react-router';

import { AccountCircle } from '@material-ui/icons';

import { ICategoryModel, IUserModel } from '../../../models';
import {
  NICE_LIGHT_BLUE,
  NICE_LIGHT_HIGHLIGHT_BLUE,
  NICE_MIDDLE_BLUE,
  SIDEBAR_BLUE,
} from '../../styles';
import { css, stylesheet } from '../../utilx';
import { dashboardLink } from '../routes';
import { COMMON_STYLES } from './styles';
import { FILTER_CATEGORY, FILTER_MODERATOR_ISME } from './utils';

const SIDEBAR_HEADER_HEIGHT = 96;
const SIDEBAR_ICON_SIZE = 36;
const SIDEBAR_XPAD = 25;
export const SIDEBAR_WIDTH = 280;

const STYLES = stylesheet({
  sidebar: {
    position: 'absolute',
    top: '0',
    left: '0',
    bottom: '0',
    width: `${SIDEBAR_WIDTH}px`,
    backgroundColor: SIDEBAR_BLUE,
    color: 'white',
    opacity: '1',
    zIndex: 30,
  },

  sidebarHeader: {
    height: `${SIDEBAR_HEADER_HEIGHT}px`,
    fontSize: '14px',
    display: 'flex',
  },

  sidebarBar: {
    width: '100%',
    height: '0px',
    borderBottom: `1px solid ${NICE_LIGHT_BLUE}`,
    opacity: '0.12',
  },

  sidebarHeaderIcon: {
    width: `${SIDEBAR_ICON_SIZE}px`,
    height: `${SIDEBAR_ICON_SIZE}px`,
    borderRadius: `${(SIDEBAR_ICON_SIZE / 2)}px`,
    margin: `${(SIDEBAR_HEADER_HEIGHT - SIDEBAR_ICON_SIZE) / 2}px 13px ${(SIDEBAR_HEADER_HEIGHT - SIDEBAR_ICON_SIZE) / 2}px 18px`,
  },

  verticalCenterText: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  sidebarRow: {
    width: '100%',
    height: `${SIDEBAR_HEADER_HEIGHT / 2}px`,
    paddingLeft: `${SIDEBAR_XPAD}px`,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    fontSize: '14px',
  },

  sidebarRowSelected: {
    backgroundColor: NICE_MIDDLE_BLUE,
    borderLeft: `5px solid ${NICE_LIGHT_HIGHLIGHT_BLUE}`,
    paddingLeft: `${SIDEBAR_XPAD - 5}px`,
  },

  sidebarRowHeader: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.54)',
  },

  sidebarSection: {
  },

  sidebarCount: {
    marginLeft: `${SIDEBAR_XPAD}px`,
    marginRight: `${SIDEBAR_XPAD}px`,
    minWidth: '50px',
    textAlign: 'right',
  },
});

export interface ICategorySidebarProps {
  user: IUserModel;
  categories: List<ICategoryModel>;
  selectedCategory?: ICategoryModel;
  selectMine: boolean;
  hideSidebar?(): void;
}

export class CategorySidebar extends React.Component<ICategorySidebarProps> {
  render() {
    const {
      user,
      categories,
      selectedCategory,
      hideSidebar,
      selectMine,
    } = this.props;

    const isMeSuffix = selectMine ? `+${FILTER_MODERATOR_ISME}` : '';
    const allLink = selectMine ? dashboardLink(FILTER_MODERATOR_ISME) : dashboardLink();
    const allUnmoderated = categories.reduce((r: number, v: ICategoryModel) => (r + v.unmoderatedCount), 0);

    return(
      <div key="sidebar" {...css(STYLES.sidebar)}>
        <div key="header" {...css(STYLES.sidebarHeader)} onClick={hideSidebar}>
          {user.avatarURL ?
            <img src={user.avatarURL} {...css(STYLES.sidebarHeaderIcon)} alt="Your image"/> :
            <AccountCircle {...css(STYLES.sidebarHeaderIcon, {fontSize: SIDEBAR_ICON_SIZE})}/>
          }
          <span {...css(STYLES.verticalCenterText)}>{user.name}</span>
        </div>
        <div key="bar" {...css(STYLES.sidebarBar)}/>
        <div key="labels" {...css(STYLES.sidebarRow, STYLES.sidebarRowHeader)}>
          <div key="label" {...css(STYLES.sidebarSection, STYLES.verticalCenterText)}>Section</div>
          <div key="count" {...css(STYLES.sidebarCount, STYLES.verticalCenterText)}>New comments</div>
        </div>
        <div key="all" {...css(STYLES.sidebarRow, selectedCategory ? {} : STYLES.sidebarRowSelected)}>
          <div key="label" {...css(STYLES.sidebarSection, STYLES.verticalCenterText)}>
            <Link to={allLink} onClick={hideSidebar} {...css(COMMON_STYLES.cellLink)}>All</Link>
          </div>
          <div key="count" {...css(STYLES.sidebarCount, STYLES.verticalCenterText)}>{allUnmoderated}</div>
        </div>
        <div {...css({maxHeight: '80vh', overflowY: 'auto'})}>
          {categories.map((c: ICategoryModel) => (
            <div key={c.id} {...css(STYLES.sidebarRow, selectedCategory && selectedCategory.id === c.id ? STYLES.sidebarRowSelected : {})}>
              <div key="label" {...css(STYLES.sidebarSection, STYLES.verticalCenterText)}>
                <Link to={dashboardLink(`${FILTER_CATEGORY}=${c.id}${isMeSuffix}`)} onClick={hideSidebar} {...css(COMMON_STYLES.cellLink)}>
                  {c.label}
                </Link>
              </div>
              <div key="count" {...css(STYLES.sidebarCount, STYLES.verticalCenterText)}>{c.unmoderatedCount}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
