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

import { Reducer } from 'redux-actions';

import { IAppDispatch, IAppStateRecord, IThunkAction } from '../../../../../stores';
import { getCurrentColumnSort } from '../../../../../stores/columnSorts';
import { loadTextSizesByIds } from '../../../../../stores/textSizes';
import { ILoadingStateRecord, makeLoadingReducer } from '../../../../../util';
import { commentSortDefinitions,  } from '../../../../../utilx';
import {
  IModeratedCommentsPathParams,
  isArticleContext,
  moderatedCommentsPageLink,
} from '../../../../routes';
import { storeCommentPagingOptions } from '../../CommentDetail/store';
import { setCurrentPagingIdentifier } from './currentPagingIdentifier';
import {
  getModeratedComments,
  loadModeratedCommentsForArticle,
  loadModeratedCommentsForCategory,
} from './moderatedComments';
import { DATA_PREFIX } from './reduxPrefix';

const LOADING_DATA = [...DATA_PREFIX, 'commentListLoader'];

function loadCommentList(params: IModeratedCommentsPathParams): () => IThunkAction<void> {
  return () => async (dispatch, getState) => {
    const columnSort = getCurrentColumnSort(getState(), 'commentsIndexModerated', params.disposition || 'approved');
    const sortDef = commentSortDefinitions[columnSort].sortInfo;
    const isArticleDetail = isArticleContext(params);
    if (isArticleDetail) {
      await dispatch(loadModeratedCommentsForArticle(
        params.contextId,
        sortDef,
      ));
    }
    else {
      await dispatch(loadModeratedCommentsForCategory(
        params.contextId,
        sortDef,
      ));
    }

    const commentIds = getModeratedComments(getState(), params).get(params.disposition);

    const bodyContentWidth = 696;

    const link = moderatedCommentsPageLink(params);

    const currentPagingIdentifier = await dispatch(storeCommentPagingOptions({
      commentIds,
      fromBatch: false,
      source: `Comment %i of ${commentIds.size} from moderated comments with disposition "${params.disposition}"`,
      link,
    }));

    dispatch(setCurrentPagingIdentifier({ currentPagingIdentifier }));

    await dispatch(loadTextSizesByIds(commentIds, bodyContentWidth));
  };
}

const loadingReducer = makeLoadingReducer(LOADING_DATA);

const commentListLoaderReducer: Reducer<ILoadingStateRecord, void> = loadingReducer.reducer;
const getCommentListIsLoading: (state: IAppStateRecord) => boolean = loadingReducer.getIsLoading;
const getCommentListHasLoaded: (state: IAppStateRecord) => boolean = loadingReducer.getHasLoaded;

export async function executeCommentListLoader(dispatch: IAppDispatch, params: IModeratedCommentsPathParams) {
  await loadingReducer.execute(dispatch, loadCommentList(params));
}

export {
  commentListLoaderReducer,
  getCommentListIsLoading,
  getCommentListHasLoaded,
};
