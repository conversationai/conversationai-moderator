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

import { List } from 'immutable';
import React from 'react';
import PropTypes from 'prop-types';
import { ICategoryModel, IUserModel } from '../../../../../../../models';
import { Link } from '../../../../../../components';
import {
  ARTICLE_CAPTION_TYPE,
  ARTICLE_CATEGORY_TYPE,
  ARTICLE_HEADLINE_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  DARK_TERTIARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  MEDIUM_COLOR,
} from '../../../../../../styles';
import { css, stylesheet } from '../../../../../../util';
import { abbreviateModerators, maybeCallback, partial } from '../../../../../../util';

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
  },

  time: {
    ...ARTICLE_CATEGORY_TYPE,
    fontSize: '13px',
    margin: 0,
    color: DARK_TERTIARY_TEXT_COLOR,
  },

  title: {
    ...ARTICLE_HEADLINE_TYPE,
    margin: 0,
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  moderation: {
    display: 'flex',
    height: '100%',
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  moderatorButton: {
    ...ARTICLE_CAPTION_TYPE,
    fontSize: '14px',
    color: MEDIUM_COLOR,
    background: 'none',
    marginTop: `${GUTTER_DEFAULT_SPACING / 2}px`,
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

  link: {
    width: '100%',
    color: MEDIUM_COLOR,
    textAlign: 'left',
    textDecoration: 'none',
    ':focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },
});

export interface IDashboardCategoryItemProps {
  onAddCategoryModeratorClick?(category: ICategoryModel): void;
  category?: ICategoryModel;
  categoryModerators?: List<IUserModel>;
}

export interface IDashboardCategoryItemContext {
  ariaControlsCategory: string;
  ariaExpandedCategory: string;
}

export class DashboardCategoryItem
    extends React.Component<IDashboardCategoryItemProps> {
  static contextTypes = {
    ariaControlsCategory: PropTypes.string,
    ariaExpandedCategory: PropTypes.bool,
  };

  context: IDashboardCategoryItemContext;

  render() {
    const {
      category,
      categoryModerators,
      onAddCategoryModeratorClick,
    } = this.props;

    return (
      <div {...css(STYLES.moderation)}>

        <Link
          key={`${category && category.label}`}
          to={`/categories/${category && category.id}`}
          {...css(STYLES.link)}
        >
          <h2 {...css(STYLES.category, { fontSize: '16px', fontWeight: 400, })}>{category && category.label}</h2>
        </Link>
        <div {...css({ alignSelf: 'flex-start' })}>
        {categoryModerators && categoryModerators.size === 0 && (
          <button
            key={`assign${category && category.id}`}
            {...css(STYLES.moderatorButton)}
            onClick={partial(maybeCallback(onAddCategoryModeratorClick), category)}
            aria-controls={this.context.ariaControlsCategory}
            aria-expanded={this.context.ariaExpandedCategory}
          >
            + Assign a Moderator
          </button>
        )}

        <p {...css(STYLES.moderators)}>
          {categoryModerators && abbreviateModerators(categoryModerators)}
          {categoryModerators && categoryModerators.size >= 1 && (
            <button
              key={`moderators${category && category.id}`}
              {...css(STYLES.moderatorButton, STYLES.editButton)}
              onClick={partial(maybeCallback(onAddCategoryModeratorClick), category)}
              aria-controls={this.context.ariaControlsCategory}
              aria-expanded={this.context.ariaExpandedCategory}
            >
              Edit
            </button>
          )}
        </p>
        </div>
      </div>
    );
  }
}
