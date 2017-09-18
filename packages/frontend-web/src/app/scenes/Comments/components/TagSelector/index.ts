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

import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { provideHooks } from 'redial';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import { IRedialLocals } from '../../../../../types';
import { getToken } from '../../../../auth/store';
import { API_URL } from '../../../../config';
import { getTags, loadTags } from '../../../../stores/tags';
import { TagSelector as PureTagSelector } from './TagSelector';

const mapStateToProps = createStructuredSelector({
  tags: getTags,

  articleId: (_: any, { params: { articleId }}: any) => {
    return articleId;
  },

  categoryId: (_: any, { params: { categoryId }}: any) => {
    let parsedCategoryId;

    if (categoryId === 'all') {
      parsedCategoryId = 'all';
    } else {
      parsedCategoryId = parseInt(categoryId, 10);
    }

    return parsedCategoryId;
  },

  getImagePath: (_: any, { params: { categoryId, articleId }}: any) => ({ tagId, width, height }: any) => {

    let parsedCategoryId: 'all' | number;

    if (categoryId === 'all') {
      parsedCategoryId = 'all';
    } else {
      parsedCategoryId = parseInt(categoryId, 10);
    }

    const dp = window.devicePixelRatio || 1;
    const startPath = !!articleId ?
        `articles/${articleId}` :
        `categories/${parsedCategoryId}`;

    let tagSuffix;

    if (tagId === 'DATE') {
      tagSuffix = 'byDate';
    } else {
      tagSuffix = `tags/${tagId}`;
    }

    return `${API_URL}/services/histogramScores/`
        + startPath
        + '/'
        + tagSuffix
        + `/chart?width=${width * dp}&height=${height * dp}&token=${getToken()}`;
  },
});

export const TagSelector = compose(
  withRouter,
  connect(mapStateToProps),
  provideHooks<IRedialLocals>({
    fetch: ({ dispatch }) => {
      return Promise.resolve(
        dispatch(loadTags()),
      );
    },
  }),
)(PureTagSelector) as any;
