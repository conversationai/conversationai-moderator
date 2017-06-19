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
import React from 'react';
import { css, stylesheet } from '../../util';
const FocusTrap = require('focus-trap-react');
import keyboardJS from 'keyboardjs';
import { IArticleModel, ICategoryModel, IUserModel } from '../../../models';
import { logout } from '../../auth';
import {
  Header,
  Link,
  Scrim,
} from '../../components';
import {
  APP_NAME,
} from '../../config';
import { restoreFocus, saveFocus } from '../../stores/focus';
import { loadArticleModerators, loadCategoryModerators } from '../../stores/moderators';
import { updateArticleModerators, updateCategoryModerators } from '../../stores/moderators';
import {
  ACCOUNT_SETTINGS_MENU_Z_INDEX,
  BOX_DEFAULT_SPACING,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  HEADLINE_TYPE,
  LIGHT_OPACITY,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
  MODAL_DROP_SHADOW,
  SCRIM_STYLE,
  WHITE_COLOR,
} from '../../styles';
import { autoFocus, withContext} from '../../util';
import { AssignModerators } from '../Root/components/AssignModerators';
import { DashboardAccountInfo } from './components/DashboardAccountInfo';
import { DashboardCategories } from './components/DashboardCategories';
const ACCOUNT_SETTINGS_POPUP_ID = 'account-dropdown';
const ASSIGN_ARTICLE_MODERATORS_POPUP_ID = 'assign-article-moderators';
const ASSIGN_CATEGORY_MODERATORS_POPUP_ID = 'assign-category-moderators';
const ACCOUNT_MODAL_WIDTH = 150;
export const SIDEBAR_WIDTH = 300;

const autoFocusModeratorList = autoFocus(ASSIGN_ARTICLE_MODERATORS_POPUP_ID, (props) => props.isVisible );
const AutoFocusModeratorListScrim = autoFocusModeratorList(Scrim);

const STYLES = stylesheet({
  main: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },

  base: {
    display: 'flex',
    flex: '1 1 auto',
    flexFlow: 'row',
    height: window.innerHeight - HEADER_HEIGHT,
  },

  sidebar: {
    background: MEDIUM_COLOR,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    width: `${SIDEBAR_WIDTH}px`,
    paddingBottom: `${GUTTER_DEFAULT_SPACING}px`,
    height: window.innerHeight - HEADER_HEIGHT,
    boxSizing: 'border-box',
  },

  articles: {
    flex: 1,
    position: 'relative',
    width: '100%',
    background: WHITE_COLOR,
  },

  title: {
    ...HEADLINE_TYPE,
    fontSize: '22px',
    color: LIGHT_PRIMARY_TEXT_COLOR,
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    textDecoration: 'none',
    ':focus': {
      textDecoration: 'underline',
      outline: 'none',
    },
  },

  hr: {
    borderTop: 0,
    borderLeft: 0,
    borderRight: 0,
    borderBottom: `1px solid rgba(255, 255, 255, ${LIGHT_OPACITY})`,
  },

  accountOptionsScrim: {
    backgroundColor: 'transparent',
  },

  accountOptionsModal: {
    position: 'absolute',
    backgroundColor: 'white',
    boxShadow: MODAL_DROP_SHADOW,
    width: ACCOUNT_MODAL_WIDTH,
    zIndex: ACCOUNT_SETTINGS_MENU_Z_INDEX,
  },

  accountModalList: {
    listStyle: 'none',
    paddingTop: `${BOX_DEFAULT_SPACING}px`,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: `${BOX_DEFAULT_SPACING}px`,
    margin: 0,
    ':focus': {
      outline: 0,
    },
  },

  accountModalListItem: {
    padding: 0,
  },

  accountModalLink: {
    background: 'none',
    border: 0,
    cursor: 'pointer',
    color: MEDIUM_COLOR,
    width: '100%',
    textAlign: 'left',
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING * 2}px`,
    paddingTop: `${BOX_DEFAULT_SPACING}px`,
    paddingBottom: `${BOX_DEFAULT_SPACING}px`,
    display: 'inline-block',
    boxSizing: 'border-box',
    zIndex: 5,

    ':hover': {
      textDecoration: 'underline',
    },

    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  scrimFocusContainer: {
    position: 'relative',
    paddingRight: 0,
    ':focus': {
      outline: 0,
    },
  },
});

const autoFocusFirstLink = autoFocus('ul', (props) => props.isVisible);
const AutoFocusFirstLinkScrim = autoFocusFirstLink(Scrim);
const DashboardChildrenContext = withContext(
  ({ children }: any) => children,
  {
    ariaControlsArticle: React.PropTypes.string,
    ariaExpandedArticle: React.PropTypes.bool,
    ariaControlsCategory: React.PropTypes.string,
    ariaExpandedCategory: React.PropTypes.bool,
    openArticleModeratorModal: React.PropTypes.func,
    openCategoryModeratorModal: React.PropTypes.func,
  },
);

export interface IDashboardProps extends React.Props<any> {
  // Will be able to type with with TS 2.2
  dispatch: Function;
  user: IUserModel;
  isAdmin: boolean;
  workload: Array<ICategoryModel>;
  categories: Array<ICategoryModel>;
  router: any;
}

export interface IDashboardState {
  isAccountDropdownOpen?: boolean;
  accountDropDownPosition?: { top: number, right: number };
  isArticleModeratorAssignmentModalOpen?: boolean;
  isCategoryModeratorAssignmentModalOpen?: boolean;
  moderatorAssignmentArticle?: IArticleModel;
  moderatorAssignmentCategory?: ICategoryModel;
}

export class Dashboard extends React.Component<IDashboardProps, IDashboardState> {
  accountDropdownButtonRef: HTMLButtonElement;
  accountDropdownRef: HTMLElement;

  state: IDashboardState = {
    isAccountDropdownOpen: false,
    accountDropDownPosition: { top: 0, right: 0 },
    isArticleModeratorAssignmentModalOpen: false,
    isCategoryModeratorAssignmentModalOpen: false,
    moderatorAssignmentArticle: null,
    moderatorAssignmentCategory: null,
  };

  @autobind
  saveAccountDropdownRef(ref: HTMLDivElement) {
    this.accountDropdownRef = ref;
  }

  @autobind
  saveAccountDropdownButtonRef(ref: HTMLButtonElement) {
    this.accountDropdownButtonRef = ref;
  }

  render() {
    const {
      user,
      isAdmin,
      workload,
      categories,
      children,
    } = this.props;

    const {
      isAccountDropdownOpen,
      accountDropDownPosition,
      isArticleModeratorAssignmentModalOpen,
      isCategoryModeratorAssignmentModalOpen,
      moderatorAssignmentArticle,
      moderatorAssignmentCategory,
    } = this.state;

    return (
      <div {...css({height: '100%'})}>
        <div {...css(STYLES.main)}>
          <Header onSearchClick={this.onSearchClick} onAuthorSearchClick={this.onAuthorSearchClick}>
            <Link key={APP_NAME} to="/" {...css(STYLES.title)}>{APP_NAME}</Link>
          </Header>
          <div {...css(STYLES.base)}>
            {/* sidebar */}
            <div {...css(STYLES.sidebar)}>
              <DashboardAccountInfo
                user={user}
                ariaControls={ACCOUNT_SETTINGS_POPUP_ID}
                ariaExpanded={isAccountDropdownOpen}
                accountDropdownButtonRef={this.saveAccountDropdownButtonRef}
                onDropdownClick={this.onAccountInfoDropdownClick}
              />

              {/* User Account Menu */}
              <AutoFocusFirstLinkScrim
                scrimStyles={STYLES.accountOptionsScrim}
                isVisible={isAccountDropdownOpen}
                onBackgroundClick={this.closeDropdown}
              >
                <div
                  id={ACCOUNT_SETTINGS_POPUP_ID}
                  {...css(
                    STYLES.accountOptionsModal,
                    {
                      top: accountDropDownPosition.top,
                      left: accountDropDownPosition.right - ACCOUNT_MODAL_WIDTH,
                    },
                  )}
                  ref={this.saveAccountDropdownRef}
                >
                  <ul
                    {...css(STYLES.accountModalList)}
                    tabIndex={0}
                  >
                    {isAdmin && (
                      <li {...css(STYLES.accountModalListItem)}>
                        <Link key="settingsLink" {...css(STYLES.accountModalLink)} to="/settings">
                          Settings
                        </Link>
                      </li>
                    )}
                    <li {...css(STYLES.accountModalListItem)}>
                      <button key="logoutButton" {...css(STYLES.accountModalLink)} onClick={this.logout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </AutoFocusFirstLinkScrim>

              <nav>
                <DashboardCategories categories={workload} key="workload" />
                <hr {...css(STYLES.hr)} />
                <DashboardCategories categories={categories} key="categories" />
              </nav>
            </div>

            {/* table */}
            <div {...css(STYLES.articles)}>
              <DashboardChildrenContext
                context={{
                  ariaControlsArticle: ASSIGN_ARTICLE_MODERATORS_POPUP_ID,
                  ariaExpandedArticle: isArticleModeratorAssignmentModalOpen,
                  ariaControlsCategory: ASSIGN_CATEGORY_MODERATORS_POPUP_ID,
                  ariaExpandedCategory: isCategoryModeratorAssignmentModalOpen,
                  openArticleModeratorModal: this.openArticleModeratorModal,
                  openCategoryModeratorModal: this.openCategoryModeratorModal,
                }}
              >
                {children}
              </DashboardChildrenContext>
            </div>
          </div>
        </div>

        {/* Assign Article Moderators Modal */}
        <AutoFocusModeratorListScrim
          selector={ASSIGN_ARTICLE_MODERATORS_POPUP_ID}
          key="articleModeratorAssignmentScrim"
          scrimStyles={SCRIM_STYLE.scrim}
          isVisible={isArticleModeratorAssignmentModalOpen}
          onBackgroundClick={this.closeArticleModeratorAssignmentModal}
        >
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
            }}
          >
            <div
              key="articleModeratorsContainer"
              id={ASSIGN_ARTICLE_MODERATORS_POPUP_ID}
              tabIndex={0}
              {...css(SCRIM_STYLE.popup, STYLES.scrimFocusContainer)}
            >
              {/* moderatorAssignmentArticle */}
              <AssignModerators
                label="Assign a moderator"
                article={moderatorAssignmentArticle}
                onClickDone={this.saveArticleModeratorAssignmentModal}
                onClickClose={this.closeArticleModeratorAssignmentModal}
              />
            </div>
          </FocusTrap>
        </AutoFocusModeratorListScrim>

        {/* Assign Category Moderators Modal */}
        <AutoFocusModeratorListScrim
          selector={ASSIGN_CATEGORY_MODERATORS_POPUP_ID}
          key="categoryModeratorAssignmentScrim"
          scrimStyles={SCRIM_STYLE.scrim}
          isVisible={isCategoryModeratorAssignmentModalOpen}
          onBackgroundClick={this.closeCategoryModeratorAssignmentModal}
        >
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
            }}
          >
            <div
              key="categoryModeratorsContainer"
              id={ASSIGN_CATEGORY_MODERATORS_POPUP_ID}
              tabIndex={0}
              {...css(SCRIM_STYLE.popup, STYLES.scrimFocusContainer)}
            >
              {/* moderatorAssignmentArticle */}
              <AssignModerators
                label="Assign a moderator"
                category={moderatorAssignmentCategory}
                onClickDone={this.saveCategoryModeratorAssignmentModal}
                onClickClose={this.closeCategoryModeratorAssignmentModal}
              />
            </div>
          </FocusTrap>
        </AutoFocusModeratorListScrim>
      </div>
    );
  }

  @autobind
  onSearchClick() {
    this.props.router.push('/search');
  }

  @autobind
  onAuthorSearchClick() {
    this.props.router.push('/search?searchByAuthor=true');
  }

  @autobind
  onPressEscape() {
    if (this.state.isAccountDropdownOpen) {
      this.closeDropdown();
    }

    if (this.state.isArticleModeratorAssignmentModalOpen) {
      this.closeArticleModeratorAssignmentModal();
    }

    if (this.state.isCategoryModeratorAssignmentModalOpen) {
      this.closeCategoryModeratorAssignmentModal();
    }
  }

  componentWillMount() {
    keyboardJS.bind('escape', this.onPressEscape);
    window.addEventListener('click', this.checkAccountDropdownState);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.onPressEscape);
    window.removeEventListener('click', this.checkAccountDropdownState);
  }

  @autobind
  logout() {
    this.props.dispatch(logout());
  }

  @autobind
  async openArticleModeratorModal(article: IArticleModel) {
    await this.props.dispatch(loadArticleModerators(article.id));
    this.props.dispatch(saveFocus());

    this.setState({
      isArticleModeratorAssignmentModalOpen: true,
      moderatorAssignmentArticle: article,
    });
  }

  @autobind
  async openCategoryModeratorModal(category: ICategoryModel) {
    await this.props.dispatch(loadCategoryModerators(category));
    this.props.dispatch(saveFocus());

    this.setState({
      isCategoryModeratorAssignmentModalOpen: true,
      moderatorAssignmentCategory: category,
    });
  }

  @autobind
  checkAccountDropdownState(e: Event) {
    if (!this.state.isAccountDropdownOpen) { return; }

    const target = e.target as HTMLElement;

    if (!this.accountDropdownRef.contains(target) &&
        !this.accountDropdownButtonRef.contains(target) &&
        this.accountDropdownButtonRef !== target) {
      this.closeDropdown();
    }
  }

  @autobind
  onAccountInfoDropdownClick() {
    const { top, right } = this.accountDropdownButtonRef.getBoundingClientRect();

    this.props.dispatch(saveFocus());

    if (this.state.isAccountDropdownOpen) {
      this.closeDropdown();
    } else {
      this.setState({
        accountDropDownPosition: { top, right },
        isAccountDropdownOpen: true,
      });
    }
  }

  @autobind
  closeDropdown() {
    this.setState({ isAccountDropdownOpen: false });

    this.props.dispatch(restoreFocus());
  }

  @autobind
  saveArticleModeratorAssignmentModal(article: IArticleModel, moderators: Array<IUserModel>) {
    this.props.dispatch(updateArticleModerators(article, moderators));
    this.closeArticleModeratorAssignmentModal();
  }

  @autobind
  async saveCategoryModeratorAssignmentModal(category: ICategoryModel, moderators: Array<IUserModel>) {
    this.props.dispatch(updateCategoryModerators(category, moderators));
    this.closeCategoryModeratorAssignmentModal();
  }

  @autobind
  closeArticleModeratorAssignmentModal() {
    this.setState({ isArticleModeratorAssignmentModalOpen: false, moderatorAssignmentArticle: null });

    this.props.dispatch(restoreFocus());
  }

  @autobind
  closeCategoryModeratorAssignmentModal() {
    this.setState({ isCategoryModeratorAssignmentModalOpen: false, moderatorAssignmentArticle: null });

    this.props.dispatch(restoreFocus());
  }
}
