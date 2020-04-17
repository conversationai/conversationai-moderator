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

import qs from 'query-string';
import React, {useEffect, useRef, useState} from 'react';
import { useDispatch } from 'react-redux';
import { Route, Switch } from 'react-router';
import { useHistory, useLocation } from 'react-router-dom';

import {
  HeaderBar,
  SearchAttribute,
  SearchHeader,
} from '../../components';
import { useCachedArticle } from '../../injectors/articleInjector';
import {
  WHITE_COLOR,
} from '../../styles';
import { css, stylesheet } from '../../utilx';
import { CommentDetail } from '../Comments/components/CommentDetail';
import { ISearchQueryParams, searchBase, searchLink } from '../routes';
import { SearchResults } from './components';
import { loadCommentList, resetCommentIds } from './store';

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

export function Search(_props: {}) {
  const dispatch = useDispatch();
  const searchInputRef = useRef(null);
  useEffect(() => {
    searchInputRef.current.focus();
  }, []);

  const history = useHistory();
  const location = useLocation();
  const query: ISearchQueryParams = qs.parse(location.search);

  function updateSearchQuery(queryDelta: ISearchQueryParams) {
    history.replace(searchLink({
      ...query,
      ...queryDelta,
    }));
  }

  const {articleId, term, searchByAuthor, sort} = query;

  useEffect(() => {
    if (term) {
      loadCommentList(dispatch, {
        term,
        params: {
          articleId,
          searchByAuthor,
          sort: [sort] || searchByAuthor ? ['-sourceCreatedAt'] : null,
        },
      });
    }
    else {
      dispatch(resetCommentIds());
    }
  }, [articleId, term, searchByAuthor, sort]);

  function onCancelSearch() {
    dispatch(resetCommentIds());
    // This fixes a bug where hitting escape tries to both clear the currently focused item
    // as well as run this function. This was causing weird rendering issues.
    setTimeout(() => window.history.back(), 60);
  }

  function handleSearchArticleClose() {
    updateSearchQuery({articleId: null});
  }

  function setSearchByAuthor(value: boolean) {
    updateSearchQuery({searchByAuthor: value});
  }

  const [searchInputValue, setSearchInputValue] = useState(term || '');
  function onSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchInputValue(e.target.value);
  }
  function handleSearchFormSubmit(e: React.FormEvent<any>) {
    e.preventDefault();
    updateSearchQuery({term: searchInputValue});
  }

  const {article} = useCachedArticle(articleId);
  const placeholderText = searchByAuthor ? 'Search comments by author ID or name' : 'Search';

  return (
    <div {...css({height: '100%'})}>
      <div {...css(HEADER_STYLES.main)}>
        <HeaderBar title="Search" homeLink/>
        <SearchHeader
          searchByAuthor={searchByAuthor}
          setSearchByAuthor={setSearchByAuthor}
          cancelSearch={onCancelSearch}
        >
          <form key="search-form" aria-label="Search form" onSubmit={handleSearchFormSubmit} {...css(HEADER_STYLES.formContainer)}>
            { article && (
              <SearchAttribute title={`Article: ${article.title}`} onClose={handleSearchArticleClose} />
            )}
            <input
              key="search-input"
              placeholder={placeholderText}
              ref={searchInputRef}
              type="text"
              value={searchInputValue}
              onChange={onSearchInputChange}
              {...css(HEADER_STYLES.searchInput)}
            />
          </form>
        </SearchHeader>
        <Switch>
          <Route path={`/${searchBase}/comments/:commentId`}>
            <CommentDetail/>
          </Route>
          <Route path={`/${searchBase}`}>
            <SearchResults searchTerm={term} searchByAuthor={searchByAuthor} updateSearchQuery={updateSearchQuery}/>
          </Route>
        </Switch>
      </div>
    </div>
  );
}
