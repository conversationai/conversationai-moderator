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
import { pick } from 'lodash';
import { Reducer } from 'redux-actions';

import { search } from '../../../platform/dataService';
import { IAppStateRecord, IThunkAction } from '../../../stores';
import { loadTextSizesByIds } from '../../../stores/textSizes';
import { ILoadingStateRecord, makeLoadingReducer } from '../../../util';
import { storeCommentPagingOptions } from '../../Comments/components/CommentDetail/store';
import { searchLink } from '../../routes';
import { ISearchScope } from '../types';
import { setCurrentPagingIdentifier } from './currentPagingIdentifier';
import { loadAllCommentIdsComplete } from './searchResults';

import { DATA_PREFIX } from './reduxPrefix';

const LOADING_DATA = [...DATA_PREFIX, 'commentListLoader'];

function loadCommentList(
  scope: ISearchScope,
): () => IThunkAction<void> {
  return () => async (dispatch) => {
    const { term, params } = scope;
    const commentIds = await search(term, params);
    const commentIdsList = List(commentIds);

    dispatch(loadAllCommentIdsComplete(commentIdsList));

    const query = {
      ...pick(params, ['articleId', 'searchByAuthor', 'sort']),
      term,
    };
    const link = searchLink(query);

    const currentPagingIdentifier = await dispatch(storeCommentPagingOptions({
      commentIds: commentIdsList,
      fromBatch: true,
      source: `Comment %i of ${commentIdsList.size} from search for "${term}"`,
      link,
    }));

    dispatch(setCurrentPagingIdentifier({ currentPagingIdentifier }));

    const bodyContentWidth = 696;

    await dispatch(loadTextSizesByIds(commentIdsList, bodyContentWidth));
  };
}

const loadingReducer = makeLoadingReducer(LOADING_DATA);

const commentListLoaderReducer: Reducer<ILoadingStateRecord, void> = loadingReducer.reducer;
const getCommentListIsLoading: (state: IAppStateRecord) => boolean = loadingReducer.getIsLoading;
const getCommentListHasLoaded: (state: IAppStateRecord) => boolean = loadingReducer.getHasLoaded;

function executeCommentListLoader(
  scope: ISearchScope,
): IThunkAction<void> {
  return loadingReducer.execute(loadCommentList(
    scope,
  ));
}

export {
  commentListLoaderReducer,
  executeCommentListLoader,
  getCommentListIsLoading,
  getCommentListHasLoaded,
};
