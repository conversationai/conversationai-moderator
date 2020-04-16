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
import { Link, MemoryRouter } from 'react-router-dom';

import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react';

import {
  ARTICLE_HEADLINE_TYPE,
  GUTTER_DEFAULT_SPACING,
  HEADLINE_TYPE,
  LIGHT_PRIMARY_TEXT_COLOR,
  VISUALLY_HIDDEN,
} from '../../styles';
import { css } from '../../utilx';
import { HomeIcon } from '../Icons';
import { SearchHeader } from './SearchHeader';

const STORY_STYLES = {
  main: {
    display: 'flex',
    alignItems: 'center',
    width: '50%',
  },

  pageTitle: {
    ...HEADLINE_TYPE,
    color: LIGHT_PRIMARY_TEXT_COLOR,
  },

  articleTitle: {
    ...ARTICLE_HEADLINE_TYPE,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    width: '100%',
    overflow: 'hidden',
    marginTop: 0,
    marginLeft: `${GUTTER_DEFAULT_SPACING}px`,
    marginBottom: 0,
    marginRight: 0,
  },
};

storiesOf('SearchHeader', module)
  .addDecorator((story) => (
    <MemoryRouter initialEntries={['/']}>{story()}</MemoryRouter>
  ))
  .add('main header', () => {
    return (
      <SearchHeader
        cancelSearch={action('cancel search')}
        searchByAuthor={false}
        setSearchByAuthor={action('set search by author')}
      >
        <Link to="/" {...css(STORY_STYLES.pageTitle)}>Moderator</Link>
      </SearchHeader>
    );
  })
  .add('article header', () => {
    return (
      <SearchHeader
        cancelSearch={action('cancel search')}
        searchByAuthor={false}
        setSearchByAuthor={action('set search by author')}
      >
        <div {...css(STORY_STYLES.main)}>
          <Link to="/">
            <span {...css(VISUALLY_HIDDEN)}>Home</span>
            <HomeIcon size={24}/>
          </Link>
          <h1 {...css(STORY_STYLES.articleTitle)}>
            At Hiroshima Memorial, Obama Says Nuclear Arms Require Moral Revolution
          </h1>
        </div>
      </SearchHeader>
    );
  });
