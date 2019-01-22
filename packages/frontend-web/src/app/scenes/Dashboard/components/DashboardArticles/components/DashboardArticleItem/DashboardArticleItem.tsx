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

import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import PropTypes from 'prop-types';
import React from 'react';

import { IArticleModel, ICategoryModel } from '../../../../../../../models';
import { CanvasTruncate, Link } from '../../../../../../components';
import {
  ARTICLE_CATEGORY_TYPE,
  ARTICLE_HEADLINE_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  DARK_TERTIARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  MEDIUM_COLOR,
} from '../../../../../../styles';
import { css, stylesheet } from '../../../../../../utilx';
import { oldDashboardLink } from '../../../../../routes';

const STYLES = stylesheet({
  base: {
    width: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexWrap: 'no-wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  info: {
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
    width: '100%',
  },

  meta: {
    display: 'flex',
    marginBottom: `${GUTTER_DEFAULT_SPACING}px`,
  },

  category: {
    ...ARTICLE_CATEGORY_TYPE,
    fontSize: '13px',
    opacity: 0.86,
    textTransform: 'uppercase',
    color: DARK_PRIMARY_TEXT_COLOR,
    margin: `0 ${GUTTER_DEFAULT_SPACING}px 0 0`,
    ':focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },

  time: {
    ...ARTICLE_CATEGORY_TYPE,
    fontSize: '13px',
    margin: 0,
    color: DARK_TERTIARY_TEXT_COLOR,
  },

  title: {
    ...ARTICLE_HEADLINE_TYPE,
    display: 'block',
    margin: 0,
    color: DARK_PRIMARY_TEXT_COLOR,
    ':focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },

  comments: {
    ...ARTICLE_CATEGORY_TYPE,
    display: 'flex',
    flexWrap: 'no-wrap',
    width: '30%',
    color: MEDIUM_COLOR,
  },
});

export interface IDashboardArticleItemProps {
  article: IArticleModel;
  category?: ICategoryModel;
  getLinkTarget(article: IArticleModel): string;
}

export interface IDashboardArticleItemContext {
  ariaControlsArticle: string;
  ariaExpandedArticle: boolean;
}

export class DashboardArticleItem
    extends React.Component<IDashboardArticleItemProps> {
  static contextTypes = {
    ariaControlsArticle: PropTypes.string,
    ariaExpandedArticle: PropTypes.bool,
  };

  context: IDashboardArticleItemContext;

  render() {
    const {
      article,
      category,
      getLinkTarget,
    } = this.props;

    const publishedAt = new Date(article.sourceCreatedAt);

    return (
      <div {...css(STYLES.base)}>
        <div {...css(STYLES.info)}>
          <div {...css(STYLES.meta)}>
            { // Only show category label on dashboard when viewing all articles
              article.category &&
              article.category.label &&
              category &&
              category.label !== article.category.label && (
                <Link key={`${article.category.id}`} {...css(STYLES.category)} to={oldDashboardLink(article.category.id)}>
                  {article.category.label}
                </Link>
            )}
            <p {...css(STYLES.time)}>{distanceInWordsToNow(publishedAt)} ago </p>
          </div>

          <Link
            key={`/articles/${article.id}`}
            to={getLinkTarget(article)}
            {...css(STYLES.title)}
            aria-labelledby={`article${article.id}`}
          >
            <CanvasTruncate id={`article${article.id}`} text={article.title} lines={2} fontStyles={STYLES.title} />
          </Link>
        </div>
      </div>
    );
  }
}
