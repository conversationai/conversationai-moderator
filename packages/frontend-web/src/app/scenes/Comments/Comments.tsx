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

import { List, Set } from 'immutable';
import React from 'react';
import { RouteComponentProps } from 'react-router';

import { IArticleModel, ICategoryModel, IUserModel, ModelId } from '../../../models';
import {
  HeaderBar,
} from '../../components';
import { IAppDispatch } from '../../stores';
import { ISummaryCounts } from '../../stores/categories';
import {
  HEADER_HEIGHT,
  WHITE_COLOR,
} from '../../styles';
import { css, stylesheet } from '../../utilx';
import {
  ICommentDetailsPathParams,
  ICommentReplyDetailsPathParams,
  IModeratedCommentsPathParams,
  INewCommentsPathParams,
  isArticleContext,
} from '../routes';
import { SubheaderBar } from './components/SubheaderBar';

const STYLES = stylesheet({
  main: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
});

export interface ICommentsProps extends RouteComponentProps<
  INewCommentsPathParams |
  IModeratedCommentsPathParams |
  ICommentDetailsPathParams |
  ICommentReplyDetailsPathParams
> {
  dispatch?: IAppDispatch;
  article?: IArticleModel;
  category?: ICategoryModel;
  moderators?: List<IUserModel>;
  globalCounts: ISummaryCounts;
  logout(): void;
}

export interface ICommentsState {
  isArticleDetail: boolean;
  isCommentDetail: boolean;
  hideCommentHeader: boolean;
  counts?: ISummaryCounts;
  isModeratorModalVisible?: boolean;
  moderatorIds?: Set<ModelId>;
}

export class Comments extends React.Component<ICommentsProps, ICommentsState> {
  state: ICommentsState = {
    isModeratorModalVisible: false,
    isArticleDetail: false,
    isCommentDetail: false,
    hideCommentHeader: false,
  };

  static getDerivedStateFromProps(props: ICommentsProps, _state: ICommentsState) {
    const counts =
      props.article ? props.article :
      props.category ? props.category :
      props.globalCounts;

    return {
      isArticleDetail: isArticleContext(props.match.params),
      isCommentDetail: ('commentId' in props),
      hideCommentHeader: ('originatingCommentId' in props),
      counts,
    };
  }

  render() {
    const {
      article,
      category,
      globalCounts,
      logout,
      children,
    } = this.props;

    const {
      hideCommentHeader,
    } = this.state;

    return (
      <div {...css({height: '100%'})}>
        <div {...css(STYLES.main)}>
          { !hideCommentHeader && (
            <HeaderBar
              category={category}
              article={article}
              homeLink
              logout={logout}
            />
          )}

          <SubheaderBar
            global={globalCounts}
            category={category}
            article={article}
            location={location.pathname}
          />
          <div
            {...css({
              background: WHITE_COLOR,
              height: hideCommentHeader ? '100%' : `calc(100% - ${HEADER_HEIGHT * 2 + 12}px)`,
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
}
