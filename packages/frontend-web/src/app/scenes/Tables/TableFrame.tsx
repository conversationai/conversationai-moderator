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
import { Iterable } from 'immutable';
import React from 'react';
import { WithRouterProps } from 'react-router';

import {
  Drawer,
} from '@material-ui/core';
import {
  createMuiTheme,
  MuiThemeProvider,
} from '@material-ui/core/styles';

import { ICategoryModel, IUserModel } from '../../../models';
import { HeaderBar } from '../../components';
import { NICE_CONTROL_BLUE } from '../../styles';
import { CategorySidebar, SIDEBAR_WIDTH } from './CategorySidebar';
import { FILTER_CATEGORY, FILTER_MODERATOR_ISME } from './utils';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: NICE_CONTROL_BLUE,
    },
  },
});

export interface ITableFrameProps extends WithRouterProps {
  dispatch: Function;
  user: IUserModel;
  isAdmin: boolean;
  categories: Iterable.Indexed<ICategoryModel>;
  logout (): void;
}

export interface ITableFrameState {
  sidebarOpen: boolean;
  fixedSidebar: boolean;
}

function fixedSidebar() {
  return SIDEBAR_WIDTH / window.innerWidth < 0.17;
}

export class TableFrame extends React.Component<ITableFrameProps, ITableFrameState> {
  constructor(props: ITableFrameProps) {
    super(props);

    this.state = {
      sidebarOpen: false,
      fixedSidebar: fixedSidebar(),
    };
  }
  @autobind
  showSidebar() {
    this.setState({sidebarOpen: true});
  }

  @autobind
  hideSidebar() {
    this.setState({sidebarOpen: false});
  }

  componentWillMount() {
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  @autobind
  updateWindowDimensions() {
    this.setState({fixedSidebar: fixedSidebar()});
  }

  renderSidebarPopup(selectMine: boolean, category?: ICategoryModel) {
    if (this.state.fixedSidebar) {
      return null;
    }

    const {
      user,
      categories,
      isAdmin,
    } = this.props;

    return (
      <Drawer open={this.state.sidebarOpen} onClose={this.hideSidebar}>
        <CategorySidebar
          user={user}
          categories={categories}
          selectedCategory={category}
          hideSidebar={this.hideSidebar}
          selectMine={selectMine}
          isAdmin={isAdmin}
        />
      </Drawer>
    );
  }

  render() {
    const {
      user,
      isAdmin,
      categories,
      location,
    } = this.props;

    const isMe = location.pathname.indexOf(FILTER_MODERATOR_ISME) >= 0;

    let category = null;
    const re = new RegExp(`${FILTER_CATEGORY}=(\\d+)`);
    const m = re.exec(location.pathname);
    if (m) {
      for (const c of categories.toArray()) {
        if (c.id === m[1]) {
          category = c;
        }
      }
    }

    if (this.state.fixedSidebar) {
      return (
        <div style={{width: '100vw', height: '100vh'}}>
          <HeaderBar
            isMe={isMe}
            category={category}
            logout={this.props.logout}
          />
          <div style={{float: 'left', width: `${SIDEBAR_WIDTH + 1}px`, backgroundColor: 'white'}}>
            <div style={{width: `${SIDEBAR_WIDTH}px`, borderRight: '1px solid rgba(0,0,0,0.12)'}}>
              <CategorySidebar
                user={user}
                categories={categories}
                selectedCategory={category}
                selectMine={isMe}
                isAdmin={isAdmin}
                isFixed
              />
            </div>
          </div>
          <div style={{marginLeft: `${SIDEBAR_WIDTH + 1}px`, height: '100%'}}>
            {this.props.children}
          </div>
        </div>
      );
    }

    return (
      <MuiThemeProvider theme={theme}>
        <HeaderBar
          isMe={isMe}
          category={category}
          showSidebar={this.showSidebar}
          logout={this.props.logout}
        />
        {this.renderSidebarPopup(isMe, category)}
        <div key="content">
          {this.props.children}
        </div>
      </MuiThemeProvider>
    );
  }
}
