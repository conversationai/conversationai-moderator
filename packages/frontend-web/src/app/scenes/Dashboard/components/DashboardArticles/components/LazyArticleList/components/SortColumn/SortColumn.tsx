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

import React from 'react';
import { IArticleModel } from '../../../../../../../../../models';
import { Link } from '../../../../../../../../components';
import { css, stylesheet } from '../../../../../../../../util';

const STYLES = stylesheet({
  link: {
    ':focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },
});

export interface ISortColumnProps extends React.HTMLProps<any> {
  article?: IArticleModel;
  sortContent: string;
  sortType: string;
  styles?: object;
}

export class SortColumn extends React.Component<ISortColumnProps, void> {
  render() {
    const {
      article,
      sortContent,
      sortType,
      styles,
    } = this.props;

    let sortTypeLink;
    switch (sortType) {
      case 'newest':
        sortTypeLink = '';
      case 'oldest':
        sortTypeLink = '';
      case 'date':
        sortTypeLink = '';
        break;
      case 'moderated':
        sortTypeLink = 'moderated';
        break;
      default:
        sortTypeLink = `moderated/${sortType}`;
    }

    return (
      <Link
        key={`/articles/${article.id}/${sortTypeLink}`}
        to={`/articles/${article.id}/${sortTypeLink}`}
        {...css(STYLES.link, styles)}
      >
        {sortContent}
      </Link>
    );
  }
}
