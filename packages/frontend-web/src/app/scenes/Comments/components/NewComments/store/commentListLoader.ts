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
  categoryId: string | null,
  articleId: string | null,
  tag: string,
  pos1: number,
  pos2: number,
  sort: string,
): () => IThunkAction<void> {
  return () => async (dispatch, getState) => {
    const tags = getTags(getState()) as List<ITagModel>;

    let tagId: string;
    const matchingTag = tags.find((t) => t.key === tag);

    if (tag === 'DATE' || tag === 'SUMMARY_SCORE') {
      tagId = tag;
    } else {
      tagId = matchingTag.id;
    }

    const sortDef = commentSortDefinitions[sort]
        ? commentSortDefinitions[sort].sortInfo
        : commentSortDefinitions['tag'].sortInfo;

    if (articleId) {
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

    const link = articleId ? `/articles/${articleId}/${commentsLink}` : `/categories/${categoryId}/${commentsLink}`;

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
  articleId: string,
  categoryId: string,
  tag: string,
  pos1: number,
  pos2: number,
  sort: string,
): IThunkAction<void> {
  return loadingReducer.execute(loadCommentList(
    categoryId,
    articleId,
    tag,
    pos1,
    pos2,
    sort,
  ));
}

export {
  commentListLoaderReducer,
  executeCommentListLoader,
  getCommentListIsLoading,
  getCommentListHasLoaded,
};
