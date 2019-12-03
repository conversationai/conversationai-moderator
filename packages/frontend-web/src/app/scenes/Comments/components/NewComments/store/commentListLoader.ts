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
import { ITagModel } from '../../../../../../models';
import { IThunkAction } from '../../../../../appstate';
import { getTags } from '../../../../../stores/tags';
import { loadTextSizesByIds } from '../../../../../stores/textSizes';
import { commentSortDefinitions } from '../../../../../utilx';
import {
  INewCommentsPathParams,
  isArticleContext,
  newCommentsPageLink,
} from '../../../../routes';
import { storeCommentPagingOptions } from '../../CommentDetail/store';
import {
  getCommentScores,
  loadCommentScoresForArticle,
  loadCommentScoresForCategory,
} from './commentScores';
import { setCurrentPagingIdentifier } from './currentPagingIdentifier';
import { getCommentIDsInRange } from './util';

export function loadCommentList(
  params: INewCommentsPathParams,
  pos1: number,
  pos2: number,
  sort: string,
): IThunkAction<void> {
  return async (dispatch, getState) => {
    const tags = getTags(getState()) as List<ITagModel>;

    const tagId = (params.tag === 'DATE' || params.tag === 'SUMMARY_SCORE') ? params.tag :
      tags.find((t) => t.key === params.tag).id;

    const sortDef = commentSortDefinitions[sort]
        ? commentSortDefinitions[sort].sortInfo
        : commentSortDefinitions['tag'].sortInfo;

    const loader = isArticleContext(params) ? loadCommentScoresForArticle : loadCommentScoresForCategory;
    await loader(dispatch, params.contextId, tagId, sortDef);

    const commentScores = getCommentScores(getState());
    const commentIDsInRange = getCommentIDsInRange(
      commentScores,
      pos1,
      pos2,
      params.tag === 'DATE',
    );
    const link = newCommentsPageLink(params, {pos1: pos1.toString(), pos2: pos2.toString(), sort});

    const currentPagingIdentifier = await dispatch(storeCommentPagingOptions({
      commentIds: commentIDsInRange.toList(),
      fromBatch: true,
      source: `Comment %i of ${commentIDsInRange.size} from new comments with tag "${params.tag}"`,
      link,
    }));

    dispatch(setCurrentPagingIdentifier({ currentPagingIdentifier }));

    const bodyContentWidth = 696;

    await dispatch(loadTextSizesByIds(commentIDsInRange, bodyContentWidth));
  };
}
