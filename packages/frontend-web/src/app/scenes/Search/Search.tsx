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
import { List } from 'immutable';
import { isEqual } from 'lodash';
import qs from 'query-string';
import React from 'react';
import { WithRouterProps } from 'react-router';

import {
  IArticleModel,
  ModelId,
} from '../../../models';
import {
  Header,
  RejectIcon,
  SearchAttribute,
} from '../../components';
import {
  LIGHT_PRIMARY_TEXT_COLOR,
  OFFSCREEN,
  PALE_COLOR,
  WHITE_COLOR,
} from '../../styles';
import { css, stylesheet } from '../../utilx';
import { ISearchQueryParams } from '../routes';
import { SearchResults } from './components';
import { ISearchScope, updateSearchQuery } from './types';

const HEADER_STYLES = stylesheet({
  main: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: WHITE_COLOR,
  },

  searchInput: {
    color: WHITE_COLOR,
    border: 'none',
    background: 'transparent',
    fontSize: '18px',
    padding: '0px',
    marginLeft: '16px',
    flex: 1,
    ':focus': {
      outline: 0,
    },
    '::placeholder': {
      color: PALE_COLOR,
    },
  },

  formContainer: {
    display: 'flex',
    flex: 1,
    marginRight: '20px',
    marginLeft: '20px',
  },

  button: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    borderBottom: '2px solid transparent',
    marginRight: '16px',
    ':focus': {
      outline: 0,
      borderBottom: '2px solid white',
    },
  },
});

export interface ISearchProps extends WithRouterProps {
  totalCommentCount?: number;
  allCommentIds?: List<number>;
  onSearch?(newScope: ISearchScope): any;
  articleMap: Map<ModelId, IArticleModel>;
  resetCommentIds?(): void;
}

export interface ISearchState {
  searchInputValue?: string;
  searchParams?: ISearchQueryParams;
  article?: IArticleModel;
}

export class Search extends React.Component<ISearchProps, ISearchState> {
  searchInputRef: any = null;

  state: ISearchState = {
    searchInputValue: '',
  };

  componentDidMount() {
    this.searchInputRef.focus();
  }

  static getDerivedStateFromProps(props: ISearchProps, state: ISearchState) {
    const searchParams: ISearchQueryParams = qs.parse(props.location.search);
    const newState: ISearchState = {searchParams};

    if (searchParams.term) {
      if (!isEqual(searchParams, state.searchParams)) {
        newState.searchInputValue = searchParams.term;
        props.onSearch({
          term: searchParams.term,
          params: {
            articleId: searchParams.articleId,
            searchByAuthor: searchParams.searchByAuthor,
            sort: [searchParams.sort] || searchParams.searchByAuthor ? ['-sourceCreatedAt'] : null,
          },
        });
      }
    }
    if (searchParams.articleId) {
      newState.article = props.articleMap.get(searchParams.articleId);
    }

    return newState;
  }

  @autobind
  onCancelSearch() {
    // reset results
    this.props.resetCommentIds();

    // This fixes a bug where hitting escape tries to both clear the currently focused item
    // as well as run this function. This was causing weird rendering issues.
    setTimeout(() => window.history.back(), 60);
  }

  @autobind
  handleSearchFormSubmit(e: React.FormEvent<any>) {
    e.preventDefault();

    updateSearchQuery(this.props, {
      term: this.state.searchInputValue,
    });
  }

  @autobind
  handleSearchArticleClose() {
    updateSearchQuery(this.props, {articleId: null});
  }

  @autobind
  handleSearchAuthorClose() {
    updateSearchQuery(this.props, {searchByAuthor: false});
  }

  @autobind
  saveSearchInputRef(ref: HTMLInputElement) {
    this.searchInputRef = ref;
  }

  @autobind
  onSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      searchInputValue: e.target.value,
    });
  }

  render() {
    const { article, searchInputValue, searchParams } = this.state;

    const placeholderText = searchParams.articleId ? 'Search comments by author ID or name' : 'Search';

    return (
      <div {...css({height: '100%'})}>
        <div {...css(HEADER_STYLES.main)}>
          <Header hideSearchIcon>
            <form key="search-form" aria-label="Search form" onSubmit={this.handleSearchFormSubmit} {...css(HEADER_STYLES.formContainer)}>
              { searchParams.articleId && article &&
                <SearchAttribute title={`Article: ${article.title}`} onClose={this.handleSearchArticleClose} />
              }
              { searchParams.searchByAuthor &&
                <SearchAttribute title="By Comment Author" onClose={this.handleSearchAuthorClose} />
              }
              <input
                key="search-input"
                placeholder={placeholderText}
                ref={this.saveSearchInputRef}
                type="text"
                value={searchInputValue}
                onChange={this.onSearchInputChange}
                {...css(HEADER_STYLES.searchInput)}
              />
            </form>

            <button aria-label="Close search" key="search-close" {...css(HEADER_STYLES.button)} onClick={this.onCancelSearch}>
              <span {...css(OFFSCREEN)}>Close search input</span>
              <RejectIcon {...css({fill: LIGHT_PRIMARY_TEXT_COLOR})} />
            </button>
          </Header>
          <SearchResults searchTerm={searchParams.term} searchByAuthor={searchParams.searchByAuthor}/>
        </div>
      </div>
    );
  }
}
