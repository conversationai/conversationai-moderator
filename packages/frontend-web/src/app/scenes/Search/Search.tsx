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
import { RouteComponentProps } from 'react-router';

import {
  IArticleModel,
  ModelId,
} from '../../../models';
import {
  HeaderBar,
  SearchAttribute,
  SearchHeader,
} from '../../components';
import {
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
    backgroundColor: 'white',
    height: '50px',
    border: 'none',
    borderRadius: '3px',
    color: 'black',
    padding: '0 10px',
    fontSize: '18px',
    flex: 1,
    marginLeft: '16px',
    '::placeholder': {
      color: 'grey',
    },
  },

  formContainer: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    marginRight: '20px',
    marginLeft: '20px',
  },
});

export interface ISearchProps extends RouteComponentProps<{}>  {
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
  saveSearchInputRef(ref: HTMLInputElement) {
    this.searchInputRef = ref;
  }

  @autobind
  onSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      searchInputValue: e.target.value,
    });
  }

  @autobind
  setSearchByAuthor(value: boolean) {
    updateSearchQuery(this.props, {searchByAuthor: value});
  }

  render() {
    const { article, searchInputValue, searchParams } = this.state;

    const placeholderText = searchParams.searchByAuthor ? 'Search comments by author ID or name' : 'Search';

    return (
      <div {...css({height: '100%'})}>
        <div {...css(HEADER_STYLES.main)}>
          <HeaderBar title="Search" homeLink/>
          <SearchHeader
            searchByAuthor={searchParams.searchByAuthor}
            setSearchByAuthor={this.setSearchByAuthor}
            cancelSearch={this.onCancelSearch}
          >
            <form key="search-form" aria-label="Search form" onSubmit={this.handleSearchFormSubmit} {...css(HEADER_STYLES.formContainer)}>
              { searchParams.articleId && article &&
                <SearchAttribute title={`Article: ${article.title}`} onClose={this.handleSearchArticleClose} />
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
          </SearchHeader>
          <SearchResults searchTerm={searchParams.term} searchByAuthor={searchParams.searchByAuthor}/>
        </div>
      </div>
    );
  }
}
