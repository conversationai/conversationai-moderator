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

import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { IAppDispatch, IAppStateRecord } from '../../appstate';
import { getArticleMap } from '../../stores/articles';
import {ISearchProps, Search as PureSearch} from './Search';
import {
  getAllCommentIds,
  loadCommentList,
  resetCommentIds,
} from './store';
import { ISearchScope } from './types';

export { SearchResults } from './components/SearchResults';
export { searchReducer } from './store';

const mapStateToProps = createStructuredSelector({
  totalCommentCount: (state: IAppStateRecord) => getAllCommentIds(state).size,
  allCommentIds: getAllCommentIds,
  articleMap: getArticleMap,
});

function mapDispatchToProps(dispatch: IAppDispatch): Partial<ISearchProps> {
  return {
    onSearch: async (newScope: ISearchScope)  => {
      await loadCommentList(dispatch, newScope);
    },

    resetCommentIds: () => dispatch(resetCommentIds()),
  };
}

export const Search: React.ComponentClass<{}> = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(PureSearch);

export * from './store';
