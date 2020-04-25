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

import check from 'check-types';

import {
  getArticleText,
  getCommentFlags,
  getComments,
  getCommentScores,
  getModeratedCommentIdsForArticle,
  getModeratedCommentIdsForCategory,
  IModeratedComments,
  listMaxHistogramScoresByCategory,
  listMaxSummaryScoreByArticle,
  listTextSizesByIds,
} from '../app/platform/dataService';
import { ICommentScore, ModelId } from '../models';
import {
  checkArrayOf,
  checkCommentFlag,
  checkCommentScore,
  checkHistogramScores,
  checkListComments,
  checkModeratedComments,
  checkSingleComment,
  checkTextSizes,
} from './objectChecks';

export async function fetchArticleText(articleId: ModelId) {
  const text = await getArticleText(articleId);
  check.string(text);
}

export async function listCommentsPage(comments: Array<ModelId>) {
  const sizes =  await listTextSizesByIds(comments, 696);
  checkTextSizes(sizes);
  const data = await getComments(comments);
  checkListComments(data);
}

export async function listNewCommentsPage_SUMMARY_SCORE(
  type: 'all' | 'category' | 'article',
  id?: ModelId,
) {
  const sort = ['-score'];

  if (type === 'all') {
    id = 'all';
  }

  let scores: Array<ICommentScore>;
  if (type === 'article') {
    scores = await listMaxSummaryScoreByArticle(id, sort);
  }
  else {
    scores = await listMaxHistogramScoresByCategory(id, sort);
  }

  checkHistogramScores(scores);

  // not working yet.  Data in wrong format?
  // await loadTopScoresForSummaryScores(scores.toArray().slice(0, 5));
  return scores.map((s) => s.commentId);
}

export async function listModeratedCommentsPage(
  tab: 'approved' | 'highlighted' | 'flagged',
  type: 'all' | 'category' | 'article',
  id?: ModelId,
) {
  let sort: Array<string>;
  if (tab === 'flagged') {
    sort = ['-unresolvedFlagsCount'];
  } else {
    sort = ['-updatedAt'];
  }

  let mc: IModeratedComments;
  if (type === 'article') {
    mc = await getModeratedCommentIdsForArticle(id, sort);
  } else {
    mc = await getModeratedCommentIdsForCategory(type === 'all' ? 'all' : id, sort);
  }

  checkModeratedComments(mc);
  await listCommentsPage(mc[tab]);
  return mc[tab];
}

export async function commentDetailsPage(commentId: string)  {
  const c = await getComments([commentId]);
  checkSingleComment(c);
  const flags = await getCommentFlags(commentId);
  checkArrayOf(checkCommentFlag, flags);
  const scores = await getCommentScores(commentId);
  checkArrayOf(checkCommentScore, scores);
  // dataService.js:1289 listAuthorCounts ["c44181ec-1957-936e-4fb0-fbc21828d365"]
}
