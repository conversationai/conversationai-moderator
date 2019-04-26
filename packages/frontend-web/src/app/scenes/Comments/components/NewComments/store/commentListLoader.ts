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
import { Reducer } from 'redux-actions';
import { ITagModel } from '../../../../../../models';
import { IAppStateRecord, IThunkAction } from '../../../../../stores';
import { fetchCurrentColumnSort } from '../../../../../stores/columnSorts';
import { getTags } from '../../../../../stores/tags';
import { ILoadingStateRecord, makeLoadingReducer } from '../../../../../util';
import { commentSortDefinitions } from '../../../../../utilx';

import { loadTextSizesByIds } from '../../../../../stores/textSizes';
import { storeCommentPagingOptions } from '../../CommentDetail';
import {
  getCommentScores,
  loadCommentScoresForArticle,
  loadCommentScoresForCategory,
} from './commentScores';
import { setCurrentPagingIdentifier } from './currentPagingIdentifier';
import { getCommentIDsInRange, getSelectedTag } from './util';

import { DATA_PREFIX } from './reduxPrefix';

const LOADING_DATA = [...DATA_PREFIX, 'commentListLoader'];

function loadCommentList(
  isArticleDetail: boolean,
  articleId: string,
  categoryId: string,
  tag: string,
  pos1: number,
  pos2: number,
): () => IThunkAction<void> {
  return () => async (dispatch, getState) => {
    const tags = getTags(getState()) as List<ITagModel>;

    let tagId: string;
    let columnSort;
    const matchingTag = tags.find((t) => t.key === tag);

    if (tag === 'DATE') {
      tagId = tag;
      columnSort = await dispatch(fetchCurrentColumnSort('commentsIndexNew', tag));
    } else if (tag === 'SUMMARY_SCORE') {
      tagId = tag;
      columnSort = await dispatch(fetchCurrentColumnSort('commentsIndexNew', tag));
    } else {
      tagId = matchingTag.id;
      columnSort = await dispatch(fetchCurrentColumnSort('commentsIndexNew', tag));
    }

    const sortDef = commentSortDefinitions[columnSort]
        ? commentSortDefinitions[columnSort].sortInfo
        : commentSortDefinitions['tag'].sortInfo;

    if (isArticleDetail) {
      await dispatch(loadCommentScoresForArticle(
        articleId,
        tagId,
        sortDef,
      ));
    } else {
      await dispatch(loadCommentScoresForCategory(
        categoryId,
        tagId,
        sortDef,
      ));
    }

    const commentScores = getCommentScores(getState());
    const commentIDsInRange = getCommentIDsInRange(commentScores, pos1, pos2, tag === 'DATE');

    const currentTagModel = getSelectedTag(getState(), tag);

    const commentsLink = `new/${currentTagModel.key}?pos1=${pos1}&pos2=${pos2}`;

    const link = isArticleDetail ? `/articles/${articleId}/${commentsLink}` : `/categories/${categoryId}/${commentsLink}`;

    const currentPagingIdentifier = await dispatch(storeCommentPagingOptions({
      commentIds: commentIDsInRange.toList(),
      fromBatch: true,
      source: `Comment %i of ${commentIDsInRange.size} from new comments with tag "${currentTagModel.label}"`,
      link,
    }));

    dispatch(setCurrentPagingIdentifier({ currentPagingIdentifier }));

    const bodyContentWidth = 696;

    await dispatch(loadTextSizesByIds(commentIDsInRange, bodyContentWidth));
  };
}

const loadingReducer = makeLoadingReducer(LOADING_DATA);

const commentListLoaderReducer: Reducer<ILoadingStateRecord, void> = loadingReducer.reducer;
const getCommentListIsLoading: (state: IAppStateRecord) => boolean = loadingReducer.getIsLoading;
const getCommentListHasLoaded: (state: IAppStateRecord) => boolean = loadingReducer.getHasLoaded;

function executeCommentListLoader(
  isArticleDetail: boolean,
  articleId: string,
  categoryId: string,
  tag: string,
  pos1: number,
  pos2: number,
): IThunkAction<void> {
  return loadingReducer.execute(loadCommentList(
    isArticleDetail,
    articleId,
    categoryId,
    tag,
    pos1,
    pos2,
  ));
}

export {
  commentListLoaderReducer,
  executeCommentListLoader,
  getCommentListIsLoading,
  getCommentListHasLoaded,
};
