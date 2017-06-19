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
import { Link } from '../../../../../../components';
import {
  ARTICLE_CATEGORY_TYPE,
  DEFAULT_OPACITY,
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_OPACITY,
  OFFSCREEN,
  WHITE_COLOR,
} from '../../../../../../styles';
import { css, stylesheet } from '../../../../../../util';

const STYLES = stylesheet({
  button: {
    alignItems: 'center',
    borderWidth: 0,
    borderLeft: '4px solid transparent',
    borderLeftColor: 'transparent',
    color: LIGHT_PRIMARY_TEXT_COLOR,
    boxSizing: 'border-box',
    display: 'flex',
    minHeight: 56,
    justifyContent: 'space-between',
    padding: `16px ${GUTTER_DEFAULT_SPACING}px`,
    position: 'relative',
    userSelect: 'none',
    transition: 'all 0.3s ease',

    ':hover': {
      borderLeftColor: LIGHT_PRIMARY_TEXT_COLOR,
    },
  },

  active: {
    borderLeftColor: LIGHT_PRIMARY_TEXT_COLOR,
  },

  label: {
    ...ARTICLE_CATEGORY_TYPE,
    color: WHITE_COLOR,

    ':focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },

  count: {
    ...ARTICLE_CATEGORY_TYPE,
    fontWeight: 400,
    color: WHITE_COLOR,
    opacity: MEDIUM_OPACITY,

    ':focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },

  activeCount: {
    opacity: DEFAULT_OPACITY,
  },
});

export interface IDashboardNavCategoryProps {
  label: string;
  count: number;
  slug: string;
  isActive?: boolean;
  hasNewItems?: boolean;
}

export class DashboardNavCategory extends React.Component<IDashboardNavCategoryProps, void> {
  render() {
    const {
      label,
      count,
      slug,
      isActive,
      hasNewItems,
    } = this.props;

    return (
      <div
        {...css(
          STYLES.button,
          isActive && STYLES.active,
        )}
      >
        <Link key={`label${slug}`} to={`/dashboard/${slug}`} {...css(STYLES.label)}>{label}</Link>
        {(slug === 'assignments' || slug === 'deferred') ? (
          <span
            key={`count${slug}`}
            {...css(
              STYLES.count,
              hasNewItems && STYLES.activeCount,
            )}
          >
            {count}
            <span {...css(OFFSCREEN)}>{` article${count !== 1 ? 's' : ''}`}</span>
          </span>
        ) : (
          <Link
            key={`count${slug}`}
            to={`/categories/${slug}`}
            {...css(
              STYLES.count,
              hasNewItems && STYLES.activeCount,
            )}
          >
            {count}
            <span {...css(OFFSCREEN)}>{` article${count !== 1 ? 's' : ''}`}</span>
          </Link>
        )}
      </div>
    );
  }
}
