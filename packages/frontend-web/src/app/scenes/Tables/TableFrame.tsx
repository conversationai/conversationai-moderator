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
import { WithRouterProps } from 'react-router';

import { ICategoryModel, IUserModel } from '../../../models';
import { logout } from '../../auth';
import { Scrim } from '../../components/Scrim';
import { CategorySidebar} from './CategorySidebar';
import { HeaderBar } from './HeaderBar';
import { FILTER_CATEGORY, FILTER_MODERATOR_ISME } from './utils';

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

    let category = null;
    const re = new RegExp(`${FILTER_CATEGORY}=(\\d+)`);
    const m = re.exec(location.pathname);
    if (m) {
      for (const c of categories.toArray()) {
        if (c.id === m[1]) {
          category = c;
          // categoryFilter = `${FILTER_CATEGORY}=${c.id}`;
        }
      }
    }

    return (
      <div>
        <HeaderBar
          isAdmin={isAdmin}
          isMe={isMe}
          category={category}
          showSidebar={this.showSidebar}
          logout={this.logout}
        />
        {this.renderSidebar(isMe, category)}
        <div key="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}
