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
import { List } from 'immutable';
import React from 'react';
import { IArticleModel, ICategoryModel, IUserModel } from '../../../../../../../models';
import { CanvasTruncate, Link } from '../../../../../../components';
import {
  ARTICLE_CAPTION_TYPE,
  ARTICLE_CATEGORY_TYPE,
  ARTICLE_HEADLINE_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  DARK_TERTIARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  MEDIUM_COLOR,
} from '../../../../../../styles';
import { css, partial, stylesheet } from '../../../../../../util';
import { abbreviateModerators } from '../../../../../../util';

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

  moderation: {
    display: 'flex',
    marginTop: `${GUTTER_DEFAULT_SPACING}px`,
    alignItems: 'center',
  },

  moderatorButton: {
    ...ARTICLE_CAPTION_TYPE,
    fontSize: '14px',
    color: MEDIUM_COLOR,
    background: 'none',
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
    padding: 0,
    cursor: 'pointer',
    borderTop: 'none',
    borderRight: 'none',
    borderLeft: 'none',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    transition: 'borderBottomColor 0.3s ease',
    whiteSpace: 'nowrap',
    ':hover': {
      transition: 'borderBottomColor 0.3s ease',
      borderBottomColor: MEDIUM_COLOR,
    },
    ':focus': {
      outline: 'none',
      borderBottomColor: MEDIUM_COLOR,
    },
  },

  editButton: {
    marginLeft: `${GUTTER_DEFAULT_SPACING}px`,
    marginRight: 0,
  },

  moderators: {
    ...ARTICLE_CAPTION_TYPE,
    color: DARK_TERTIARY_TEXT_COLOR,
    margin: 0,
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
  onAddArticleModeratorClick?(article: IArticleModel): void;
  article: IArticleModel;
  category?: ICategoryModel;
  articleModerators?: List<IUserModel>;
  getLinkTarget(article: IArticleModel): string;
}

export interface IDashboardArticleItemContext {
  ariaControlsArticle: string;
  ariaExpandedArticle: string;
}

export class DashboardArticleItem
    extends React.Component<IDashboardArticleItemProps, void> {
  static contextTypes = {
    ariaControlsArticle: React.PropTypes.string,
    ariaExpandedArticle: React.PropTypes.bool,
  };

  context: IDashboardArticleItemContext;

  render() {
    const {
      article,
      category,
      articleModerators,
      onAddArticleModeratorClick,
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
                <Link key={`${article.category.id}`} {...css(STYLES.category)} to={`/dashboard/${article.category.id}`}>
                  {article.category.label}
                </Link>
            )}
            <p {...css(STYLES.time)}>{distanceInWordsToNow(publishedAt)} ago </p>
          </div>

          <Link
            key={`/articles/${article.id}`}
            to={partial(getLinkTarget, article)}
            {...css(STYLES.title)}
            aria-labelledby={`article${article.id}`}
          >
            <CanvasTruncate id={`article${article.id}`} text={article.title} lines={2} fontStyles={STYLES.title} />
          </Link>

          <div {...css(STYLES.moderation)}>
            {articleModerators.size === 0 && (
              <button
                key="assignArticlModerators"
                {...css(STYLES.moderatorButton)}
                onClick={partial(onAddArticleModeratorClick, article)}
                aria-controls={this.context.ariaControlsArticle}
                aria-expanded={this.context.ariaExpandedArticle}
              >
                + Assign a Moderator
              </button>
            )}

            <p {...css(STYLES.moderators)}>
              {articleModerators && abbreviateModerators(articleModerators)}
              {articleModerators.size >= 1 && (
                <button
                  key="addArticleModerators"
                  {...css(STYLES.moderatorButton, STYLES.editButton)}
                  onClick={partial(onAddArticleModeratorClick, article)}
                  aria-controls={this.context.ariaControlsArticle}
                  aria-expanded={this.context.ariaExpandedArticle}
                >
                  Edit
                </button>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }
}
