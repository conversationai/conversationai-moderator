/*
Copyright 2020 Google Inc.

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
import { combineReducers } from 'redux';

import { ITaggingSensitivityModel } from '../../../models';
import { IAppState } from '../../appstate';
import { getArticle } from '../../stores/articles';
import { ICommentSummaryScoreStateRecord } from '../../stores/commentSummaryScores';
import { getTaggingSensitivities } from '../../stores/taggingSensitivities';
import { ICommentDetailState, reducer as commentDetailReducer } from './components/CommentDetail/store';
import { IModeratedCommentsGlobalState, reducer as moderatedCommentsReducer } from './components/ModeratedComments/store';
import { INewCommentsState, newCommentsReducer } from './components/NewComments/store';
import { IThreadedCommentDetailState, reducer as threadedCommentDetailReducer } from './components/ThreadedCommentDetail/store';

export type ICommentsGlobalState = Readonly<{
  newComments: INewCommentsState;
  moderatedComments: IModeratedCommentsGlobalState;
  commentDetail: ICommentDetailState;
  threadedCommentDetail: IThreadedCommentDetailState;
}>;

export const commentsReducer = combineReducers<ICommentsGlobalState>({
  newComments: newCommentsReducer,
  moderatedComments: moderatedCommentsReducer,
  commentDetail: commentDetailReducer,
  threadedCommentDetail: threadedCommentDetailReducer,
});

function aboveThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  score: ICommentSummaryScoreStateRecord,
): boolean {
  if (score.tagId === null) {
    return false;
  }

  return taggingSensitivities.some((ts) => {
    return (
      (ts.tagId === null || ts.tagId === score.tagId) &&
      (score.score >= ts.lowerThreshold && score.score <= ts.upperThreshold)
    );
  });
}

export function getSummaryScoresAboveThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  scores: List<ICommentSummaryScoreStateRecord>): List<ICommentSummaryScoreStateRecord> {
  if (!scores) {
    return;
  }

  return scores
      .filter((s) => aboveThreshold(taggingSensitivities, s))
      .sort((a, b) => b.score - a.score) as List<ICommentSummaryScoreStateRecord>;
}

export function getSummaryScoresBelowThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  scores: List<ICommentSummaryScoreStateRecord>): List<ICommentSummaryScoreStateRecord> {
  if (!scores) {
    return;
  }
  const scoresAboveThreshold = scores.filter((s) => aboveThreshold(taggingSensitivities, s)) as List<ICommentSummaryScoreStateRecord>;
  const scoresBelowThreshold = scores.filter((s) =>
      !aboveThreshold(taggingSensitivities, s) &&
      !scoresAboveThreshold.find((sa) => sa.tagId === s.tagId)) as List<ICommentSummaryScoreStateRecord>;

  return scoresBelowThreshold
      .sort((a, b) => b.score - a.score) as List<ICommentSummaryScoreStateRecord>;
}

export function getTaggingSensitivitiesInCategory(
  state: IAppState,
  categoryId?: string,
  articleId?: string): List<ITaggingSensitivityModel> {
  if (articleId) {
    const article = getArticle(state, articleId);
    if (article) {
      categoryId = article.categoryId;
    }
  }

  const taggingSensitivities = getTaggingSensitivities(state);

  return taggingSensitivities.filter((ts: ITaggingSensitivityModel) => (
    ts.categoryId === categoryId || ts.categoryId === null
  )) as List<ITaggingSensitivityModel>;
}
