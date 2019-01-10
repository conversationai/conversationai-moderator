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
import { IArticleModel } from '../../../../../../../../../models';
import { css, stylesheet } from '../../../../../../../../utilx';

const STYLES = stylesheet({
  lazy: {
    width: '100%',
    height: '100%',
  },
});

export interface ILazyArticle {
  id: string;
  hasLoaded: boolean;
  model: IArticleModel;
}

export interface ILazyLoadArticleProps extends React.HTMLProps<any> {
  loadingPlaceholder?: JSX.Element | string;
  rowIndex: number;
  onRowRender(index: number): Promise<string>;
  articlePropsForRow(index: number): {
    article: ILazyArticle;
    articleModerators: any;
    newCommentsCount: any;
    sortContent: any;
  };
}

export interface ILazyLoadArticleState {
  hasLoaded?: boolean;
  currentIndex?: number;
}

export class LazyLoadArticle
    extends React.Component<ILazyLoadArticleProps, ILazyLoadArticleState> {
  state: ILazyLoadArticleState = {
    hasLoaded: false,
    currentIndex: null,
  };

  render() {
    const {
      articlePropsForRow,
      rowIndex,
      children,
      loadingPlaceholder,
    } = this.props;

    const props = articlePropsForRow(rowIndex);

    if (props && this.state.hasLoaded) {
      return (
        <div {...css(STYLES.lazy)}>
          {React.Children.map(
            children,
            (child: any) => (
              React.cloneElement(child, {
                ...child.props,
                ...props,
              })
            ),
          )}
        </div>
      );
    } else {
      if ('undefined' !== typeof loadingPlaceholder) {
        return (<div {...css(STYLES.lazy)}>{loadingPlaceholder}</div>);
      } else {
        return (<div {...css(STYLES.lazy)}>{children}</div>);
      }
    }
  }

  async componentWillMount() {
    this.setState({ currentIndex: this.props.rowIndex });

    const id = await this.props.onRowRender(this.props.rowIndex);

    this.loadComplete(id);
  }

  async componentWillUpdate() {
    if (this.state.currentIndex !== this.props.rowIndex) {
      this.setState({ currentIndex: this.props.rowIndex });

      const id = await this.props.onRowRender(this.props.rowIndex);

      this.loadComplete(id);
    }
  }

  @autobind
  loadComplete(_id: string) {
    const article = this.props.articlePropsForRow(this.props.rowIndex);

    if (article) {
      this.setState({ hasLoaded: true });
    }
  }
}
