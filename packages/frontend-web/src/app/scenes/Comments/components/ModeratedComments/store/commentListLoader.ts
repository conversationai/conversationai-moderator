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

import { IAppStateRecord, IThunkAction } from '../../../../../stores';
import { getCurrentColumnSort } from '../../../../../stores/columnSorts';
import { loadTextSizesByIds } from '../../../../../stores/textSizes';
import { ILoadingStateRecord, makeLoadingReducer } from '../../../../../util';
import { commentSortDefinitions,  } from '../../../../../utilx';
import { articleBase, categoryBase, moderatedCommentsPageLink } from '../../../../routes';
import { storeCommentPagingOptions } from '../../CommentDetail/store';
import { setCurrentPagingIdentifier } from './currentPagingIdentifier';
import {
  getModeratedComments,
  loadModeratedCommentsForArticle,
  loadModeratedCommentsForCategory,
} from './moderatedComments';
import { DATA_PREFIX } from './reduxPrefix';

const LOADING_DATA = [...DATA_PREFIX, 'commentListLoader'];

function loadCommentList(
  isArticleDetail: boolean,
  articleId: string,
  categoryId: string,
  disposition: string,
): () => IThunkAction<void> {
  return () => async (dispatch, getState) => {
    const columnSort = getCurrentColumnSort(getState(), 'commentsIndexModerated', disposition || 'approved');
    const sortDef = commentSortDefinitions[columnSort].sortInfo;

    if (isArticleDetail) {
      await dispatch(loadModeratedCommentsForArticle(
        articleId,
        sortDef,
      ));
    } else {
      await dispatch(loadModeratedCommentsForCategory(
        categoryId,
        sortDef,
      ));
    }

    const commentIds = getModeratedComments(getState(), {
      articleId,
      categoryId,
    }).get(disposition);

    const bodyContentWidth = 696;

    const context = isArticleDetail ? articleBase : categoryBase;
    const contextId = isArticleDetail ? articleId : categoryId;
    const link = moderatedCommentsPageLink({context, contextId, disposition});

    const currentPagingIdentifier = await dispatch(storeCommentPagingOptions({
      commentIds,
      fromBatch: false,
      source: `Comment %i of ${commentIds.size} from moderated comments with tag "${disposition}"`,
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

function executeCommentListLoader(
  isArticleDetail: boolean,
  articleId: string,
  category: string,
  tag: string,
): IThunkAction<void> {
  return loadingReducer.execute(loadCommentList(
    isArticleDetail,
    articleId,
    category,
    tag,
  ));
}

export {
  commentListLoaderReducer,
  executeCommentListLoader,
  getCommentListIsLoading,
  getCommentListHasLoaded,
};
