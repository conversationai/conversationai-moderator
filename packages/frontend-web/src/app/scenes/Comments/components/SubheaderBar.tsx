/*
Copyright 2019 Google Inc.

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
import { Link } from 'react-router';

import { IArticleModel, ICategoryModel } from '../../../../models';
import { ISummaryCounts } from '../../../stores/categories';
import {
  HEADER_HEIGHT,
  LIGHT_PRIMARY_TEXT_COLOR,
  NICE_MIDDLE_BLUE,
} from '../../../styles';
import { css, stylesheet } from '../../../utilx';
import {
  articleBase,
  categoryBase,
  moderatedCommentsPageLink,
  NEW_COMMENTS_DEFAULT_TAG,
  newCommentsPageLink,
} from '../../routes';

const STYLES = stylesheet({
  header: {
    background: NICE_MIDDLE_BLUE,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: `${HEADER_HEIGHT + 12}px`,
  },

  headerItem: {
    color: `rgba(255,255,255,0.54)`,
    textAlign: 'center',
    paddingTop: `${10}px`,
    marginTop: `${3}px`,
    width: '13vw',
    height: `${HEADER_HEIGHT - 10 - 3}px`,
    borderBottom: `3px solid rgba(255,255,255,0.05)`,
  },

  headerItemSelected: {
    color: `${LIGHT_PRIMARY_TEXT_COLOR}`,
    borderBottom: `3px solid ${LIGHT_PRIMARY_TEXT_COLOR}`,
  },

  headerLink: {
    color: 'inherit',
    textDecoration: 'none',
  },

  headerText: {
    fontSize: '12px',
    lineHeight: '20px',
    fontWeight: 500,
  },
});

export interface ISubheaderBarProps {
  global?: ISummaryCounts;
  category?: ICategoryModel;
  article?: IArticleModel;
  location: string;
}

const CELLS = [
  ['New', 'unmoderatedCount', 'new'],
  ['Approved', 'approvedCount', 'approved'],
  ['Rejected', 'rejectedCount', 'rejected'],
  ['Deferred', 'deferredCount', 'deferred'],
  ['Highlighted', 'highlightedCount', 'highlighted'],
  ['Flagged', 'flaggedCount', 'flagged'],
  ['Batched', 'batchedCount', 'batched'],
];

export class SubheaderBar extends React.Component<ISubheaderBarProps> {
  render() {
    const {
      global,
      category,
      article,
      location,
    } = this.props;

    function linkFunction(disposition: string) {
      if (disposition === 'new') {
        return newCommentsPageLink({
          context: article ? articleBase : categoryBase,
          contextId: article ? article.id : category ? category.id : 'all',
          tag: NEW_COMMENTS_DEFAULT_TAG,
        });
      }
      return moderatedCommentsPageLink({
        context: article ? articleBase : categoryBase,
        contextId: article ? article.id : category ? category.id : 'all',
        disposition,
      });
    }

    const counts = article ? article :
      category ? category :
        global;

    function renderHeaderItem(cell: Array<string>) {
      let styles = {...css(STYLES.headerItem)};
      if (location.indexOf(`/${cell[2]}`) >= 0) {
        styles = {...css(STYLES.headerItem, STYLES.headerItemSelected)};
      }
      return (
        <div key={cell[2]} {...styles}>
          <Link to={linkFunction(cell[2])} aria-label={cell[0]} {...css(STYLES.headerLink)}>
            <div {...css(STYLES.headerText)}>{cell[0]}</div>
            <div {...css(STYLES.headerText)}>{(counts as any)[cell[1]]}</div>
          </Link>
        </div>
      );
    }

    return (
      <header key="header" role="banner" {...css(STYLES.header)}>
        {CELLS.map(renderHeaderItem)}
      </header>
    );
  }
}
