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
import { css, stylesheet } from '../../utilx';
import { CategorySidebar, SIDEBAR_WIDTH } from './CategorySidebar';
import { HeaderBar } from './HeaderBar';
import { FILTER_CATEGORY, FILTER_MODERATOR_ISME } from './utils';

const STYLES = stylesheet({
  categorybar: {
    position: 'absolute',
    top: '0',
    bottom: '0',
    left: `-${SIDEBAR_WIDTH}px`,
    zIndex: 50,
  },

  slideout: {
    left: 0,
    animationName: {
      from: {
        left: `-${SIDEBAR_WIDTH}px`,
      },
      to: {
        left: 0,
      },
    },
    animationDuration: '0.3s',
    animationTimingFunction: 'ease',
    animationIterationCount: 1,
  },

  slidein: {
    animationName: {
      from: {
        left: 0,
      },
      to: {
        left: `-${SIDEBAR_WIDTH}px`,
      },
    },
    animationDuration: '0.3s',
    animationTimingFunction: 'ease',
    animationIterationCount: 1,
  },

  fadeIn: {
    background: 'rgba(0, 0, 0, 0.4)',
    animationName: {
      from: {
        background: 'rgba(0, 0, 0, 0)',
      },
      to: {
        background: 'rgba(0, 0, 0, 0.4)',
      },
    },
    animationDuration: '0.3s',
    animationTimingFunction: 'ease',
    animationIterationCount: 1,
  },

  fadeOut: {
    background: 'rgba(0, 0, 0, 0)',
    animationName: {
      from: {
        background: 'rgba(0, 0, 0, 0.4)',
      },
      to: {
        background: 'rgba(0, 0, 0, 0)',
      },
    },
    animationDuration: '0.3s',
    animationTimingFunction: 'ease',
    animationIterationCount: 1,
  },
});

export interface IITableFrameProps extends WithRouterProps {
  dispatch: Function;
  user: IUserModel;
  isAdmin: boolean;
  categories: List<ICategoryModel>;
}

export interface IITableFrameState {
  sidebarState: 'open' | 'closing' | 'closed';
  fixedSidebar: boolean;
}

function fixedSidebar() {
  return SIDEBAR_WIDTH / window.innerWidth < 0.17;
}

export class TableFrame extends React.Component<IITableFrameProps, IITableFrameState> {
  constructor(props: IITableFrameProps) {
    super(props);

    this.state = {
      sidebarState: 'closed',
      fixedSidebar: fixedSidebar(),
    };
  }

  @autobind
  logout() {
    this.props.dispatch(logout());
  }

  @autobind
  showSidebar() {
    this.setState({sidebarState: 'open'});
  }

  @autobind
  hideSidebar() {
    this.setState({sidebarState: 'closing'});
    setTimeout(() => this.setState({sidebarState: 'closed'}), 300);
  }

  componentWillMount() {
    keyboardJS.bind('escape', this.hideSidebar);
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.hideSidebar);
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  @autobind
  updateWindowDimensions() {
    this.setState({fixedSidebar: fixedSidebar()});
  }

  renderSidebarPopup(selectMine: boolean, category?: ICategoryModel) {
    const state = this.state.sidebarState;
    if (state === 'closed') {
      return '';
    }

    const {
      user,
      categories,
      isAdmin,
    } = this.props;

    return (
      <Scrim isVisible onBackgroundClick={this.hideSidebar} scrimStyles={state === 'open' ? STYLES.fadeIn : STYLES.fadeOut}>
        <FocusTrap focusTrapOptions={{clickOutsideDeactivates: true}}>
          <div {...css(STYLES.categorybar, state === 'open' ? STYLES.slideout : STYLES.slidein)}>
            <CategorySidebar
              user={user}
              categories={categories}
              selectedCategory={category}
              hideSidebar={this.hideSidebar}
              selectMine={selectMine}
              isAdmin={isAdmin}
            />
          </div>
        </FocusTrap>
      </Scrim>
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
            logout={this.logout}
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
          <div style={{marginLeft: `${SIDEBAR_WIDTH + 1}px`}}>
            <div key="content">
              {this.props.children}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <HeaderBar
          isMe={isMe}
          category={category}
          showSidebar={this.showSidebar}
          logout={this.logout}
        />
        {this.renderSidebarPopup(isMe, category)}
        <div key="content">
          {this.props.children}
        </div>
      </div>
    );
  }
}
