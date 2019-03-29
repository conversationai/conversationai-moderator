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
import { ISearchScope } from './';

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
  searchTerm: string;
  totalCommentCount?: number;
  allCommentIds?: List<number>;
  onSearch?(newScope: ISearchScope): any;
  onCancelSearch?(): any;
  articleId?: ModelId;
  article?: IArticleModel;
  resetCommentIds?(): void;
  searchByAuthor?: boolean;
}

export interface ISearchState {
  searchInputValue?: string;
  searchRequested?: boolean;
  searchReturned?: boolean;
  searchByArticle?: boolean;
  searchByAuthor?: boolean;
}

export class Search extends React.Component<ISearchProps, ISearchState> {
  searchInputRef: any = null;

  state: ISearchState = {
    searchInputValue: this.props.searchTerm || '',
    searchRequested: false,
    searchReturned: false,
    searchByArticle: !!this.props.articleId,
    searchByAuthor: this.props.searchByAuthor,
  };

  componentDidMount() {
    if (!this.state.searchInputValue) {
      this.searchInputRef.focus();
    }

    if (this.state.searchInputValue) {
      this.onSearchSubmitted();
    }
  }

  componentWillUpdate(nextProps: ISearchProps, nextState: ISearchState) {
    if ( nextProps.allCommentIds.size > 0 && this.props.allCommentIds.size !== nextProps.allCommentIds.size && !nextState.searchReturned && !nextState.searchRequested) {
      // Aphrodite styles need to reinitialize
      setTimeout(() => {
          this.setState({
            searchReturned: true,
            searchRequested: true,
          });
        },
        180,
      );
    }
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

    this.setQueryStringParam({
      term: this.state.searchInputValue,
    });

    this.setState({ searchRequested: true });
    this.onSearchSubmitted();
  }

  @autobind
  setQueryStringParam({ term, articleId }: { term: string, articleId?: number }) {
    this.props.router.replace({
      pathname: this.props.location.pathname,
      query: { term, articleId },
    });
  }

  @autobind
  async onSearchSubmitted() {
    const articleId = this.state.searchByArticle ? this.props.articleId : null;
    const { searchByAuthor } = this.state;

    this.props.onSearch({
      term: this.state.searchInputValue,
      params: {
        articleId,
        searchByAuthor,
        sort: searchByAuthor ? ['-sourceCreatedAt'] : null,
      },
    });
    this.setState({
      searchRequested: null,
      searchReturned: true,
    });
    this.props.router.replace({
      pathname: 'search',
      query: {
        term: this.state.searchInputValue,
        articleId,
        searchByAuthor,
      },
    });
  }

  @autobind
  handleSearchAttributeClose() {
    this.setQueryStringParam({
      term: this.props.searchTerm,
    });
    this.props.onSearch({
      term: this.state.searchInputValue,
      params: {
        articleId: null,
        searchByAuthor: false,
      },
    });
    this.setState({
      searchByArticle: false,
      searchByAuthor: false,
      searchRequested: null,
      searchReturned: true,
    });
  }

  @autobind
  saveSearchInputRef(ref: HTMLInputElement) {
    this.searchInputRef = ref;
  }

  @autobind
  onSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      searchInputValue: e.target.value,
      searchReturned: null,
    });
  }

  render() {
    const { searchInputValue, searchReturned, searchByArticle, searchByAuthor } = this.state;
    const { article } = this.props;

    const placeholderText = searchByAuthor ? 'Search comments by author ID or name' : 'Search';

    return (
      <div {...css({height: '100%'})}>
        <div {...css(HEADER_STYLES.main)}>
          <Header hideSearchIcon>
            <form key="search-form" aria-label="Search form" onSubmit={this.handleSearchFormSubmit} {...css(HEADER_STYLES.formContainer)}>
              { searchByArticle && article &&
                <SearchAttribute title={article.title} onClose={this.handleSearchAttributeClose} />
              }
              { searchByAuthor &&
                <SearchAttribute title="By Comment Author" onClose={this.handleSearchAttributeClose} />
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

          {React.cloneElement(this.props.children as any, {
            ...this.props,
            searchReturned,
            searchByAuthor,
            searchByArticle,
          })}
        </div>
      </div>
    );
  }
}
