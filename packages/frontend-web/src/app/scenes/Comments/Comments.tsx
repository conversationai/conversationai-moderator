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
import FocusTrap from 'focus-trap-react';
import { List, Set } from 'immutable';
import keyboardJS from 'keyboardjs';
import React from 'react';
import { WithRouterProps } from 'react-router';

import { IArticleModel, ICategoryModel, IUserModel, ModelId } from '../../../models';
import {
  HeaderBar,
  Scrim,
} from '../../components';
import { updateArticleModerators } from '../../platform/dataService';
import { IAppDispatch } from '../../stores';
import { IGlobalCounts } from '../../stores/categories';
import {
  clearReturnSavedCommentRow,
} from '../../util';
import { css, stylesheet } from '../../utilx';
import { AssignModerators } from '../Root/components/AssignModerators';
import { ArticlePreview } from './components/ArticlePreview';

import {
  ARTICLE_HEADER,
  HEADER_HEIGHT,
  SCRIM_STYLE,
  WHITE_COLOR,
} from '../../styles';

const ASSIGN_MODERATORS_POPUP_ID = 'assign-moderators';

const STYLES = stylesheet({
  main: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
});

export interface ICommentsProps extends WithRouterProps {
  dispatch?: IAppDispatch;
  article?: IArticleModel;
  category?: ICategoryModel;
  moderators?: List<IUserModel>;
  globalCounts: IGlobalCounts;
  logout(): void;
}

export interface ICommentsState {
  isArticleDetail: boolean;
  isCommentDetail: boolean;
  hideCommentHeader: boolean;
  counts?: IGlobalCounts;
  isPreviewModalVisible?: boolean;
  isModeratorModalVisible?: boolean;
  moderatorIds?: Set<ModelId>;
}

export class Comments extends React.Component<ICommentsProps, ICommentsState> {
  state: ICommentsState = {
    isPreviewModalVisible: false,
    isModeratorModalVisible: false,
    isArticleDetail: false,
    isCommentDetail: false,
    hideCommentHeader: false,
  };

  componentDidMount() {
    keyboardJS.bind('escape', this.onCloseClick);
  }

  componentWillUnmount() {
    keyboardJS.unbind('escape', this.onCloseClick);
  }

  static getDerivedStateFromProps(nextProps: ICommentsProps,  _prevState: ICommentsState) {
    const {
      articleId,
      commentId,
      originatingCommentId,
    } = nextProps.params;

    const counts =
      nextProps.article ? nextProps.article :
      nextProps.category ? nextProps.category :
      nextProps.globalCounts;

    return {
      isArticleDetail: !!articleId,
      isCommentDetail: !!commentId,
      hideCommentHeader: !!originatingCommentId || nextProps.routes[3].path === 'tagselector',
      counts,
    };
  }

  render() {
    const {
      article,
      category,
      globalCounts,
      logout,
      moderators,
      children,
    } = this.props;

    const {
      isArticleDetail,
      isCommentDetail,
      hideCommentHeader,
      isPreviewModalVisible,
      isModeratorModalVisible,
    } = this.state;

    const selectedTab = location.pathname.indexOf('/new/') >= 0 ? 'new' : 'moderated';

    return (
      <div {...css({height: '100%'})}>
        { isArticleDetail && (
          <Scrim
            key="articlePreviewScrim"
            scrimStyles={ARTICLE_HEADER.articlePreviewScrim}
            wrapperStyles={ARTICLE_HEADER.articlePreviewWrapper}
            isVisible={isPreviewModalVisible}
            onBackgroundClick={this.onCloseClick}
          >
            <FocusTrap
              focusTrapOptions={{
                clickOutsideDeactivates: true,
              }}
            >
              <ArticlePreview
                isCommentDetail={isCommentDetail}
                article={article}
                moderators={moderators}
                onAddModeratorClick={this.onAddModeratorClick}
                onClose={this.onCloseClick}
              />
            </FocusTrap>
            <Scrim
              key="moderatorAssignmentScrim"
              scrimStyles={SCRIM_STYLE.scrim}
              isVisible={isModeratorModalVisible}
              onBackgroundClick={this.closeModeratorAssignmentModal}
            >
              <FocusTrap
                focusTrapOptions={{
                  clickOutsideDeactivates: true,
                }}
              >
                <div
                  key="AssignModeratorsContainer"
                  id={ASSIGN_MODERATORS_POPUP_ID}
                  {...css(
                    SCRIM_STYLE.popup, {position: 'relative', paddingRight: 0},
                  )}
                >
                  <AssignModerators
                    label="Assign a moderator"
                    moderatorIds={this.state.moderatorIds}
                    superModeratorIds={this.props.category ? Set<ModelId>(this.props.category.assignedModerators) : null}
                    onAddModerator={this.onAddModerator}
                    onRemoveModerator={this.onRemoveModerator}
                    onClickDone={this.saveModeratorAssignmentModal}
                    onClickClose={this.closeModeratorAssignmentModal}
                  />
                </div>
              </FocusTrap>
            </Scrim>
          </Scrim>
        )}

        <div {...css(STYLES.main)}>
          { !hideCommentHeader && (
            <HeaderBar
              global={globalCounts}
              category={category}
              article={article}
              homeLink
              selectedTab={selectedTab}
              logout={logout}
            />
          )}

          <div
            {...css({
              background: WHITE_COLOR,
              height: hideCommentHeader ? '100%' : `calc(100% - ${HEADER_HEIGHT}px)`,
              position: 'relative',
              overflow: 'hidden',
              WebkitOverflowScrolling: 'touch',
            })}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  @autobind
  handleBackButtonClick() {
    clearReturnSavedCommentRow();
  }

  @autobind
  onSearchClick() {
    const searchPath = this.props.article ?
        `/search?articleId=${this.props.article.id}` :
        `/search`;
    this.props.router.push(searchPath);
  }

  @autobind
  onAuthorSearchClick() {
    this.props.router.push('/search?searchByAuthor=true');
  }

  @autobind
  onOpenClick() {
    this.setState({ isPreviewModalVisible: true });
  }

  @autobind
  onCloseClick() {
    this.setState({ isPreviewModalVisible: false });
  }

  @autobind
  async onAddModeratorClick() {
    this.setState({
      isModeratorModalVisible: true,
      moderatorIds: Set<ModelId>(this.props.article.assignedModerators),
    });
  }

  @autobind
  onAddModerator(userId: string) {
    this.setState({moderatorIds: this.state.moderatorIds.add(userId)});
  }

  @autobind
  onRemoveModerator(userId: string) {
    this.setState({moderatorIds: this.state.moderatorIds.remove(userId)});
  }

  @autobind
  closeModeratorAssignmentModal() {
    this.setState({ isModeratorModalVisible: false });
  }

  @autobind
  saveModeratorAssignmentModal() {
    const moderatorIds = this.state.moderatorIds.toArray();
    updateArticleModerators(this.props.article.id, moderatorIds);
    this.closeModeratorAssignmentModal();
  }
}
