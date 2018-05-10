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

export interface INewColumnProps extends React.HTMLProps<any> {
  article?: IArticleModel;
  newCommentsCount: number;
  styles?: object;
}

export class NewColumn extends React.Component<INewColumnProps> {
  render() {
    const {
      article,
      newCommentsCount,
      styles,
    } = this.props;

    return (
      <Link
        key={`/articles/${article.id}/new`}
        to={`/articles/${article.id}/new`}
        {...css(STYLES.link, styles)}
      >
        {newCommentsCount}
      </Link>
    );
  }
}
