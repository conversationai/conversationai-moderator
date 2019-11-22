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
import { Action, createAction, handleActions } from 'redux-actions';
import { IAppDispatch, IAppState } from '../../../../../appstate';

import {
  ICommentDatedModel,
  ICommentScoredModel,
} from '../../../../../../models';

import {
  listHistogramScoresByArticle,
  listHistogramScoresByArticleByDate,
  listHistogramScoresByCategory,
  listHistogramScoresByCategoryByDate,
  listMaxHistogramScoresByCategory,
  listMaxSummaryScoreByArticle,
} from '../../../../../platform/dataService';

const loadCommentScoresStart = createAction(
  'article-detail-new/LOAD_COMMENTS_SCORES_START',
);

type ILoadCommentScoresCompletePayload = {
  scores: List<ICommentScoredModel | ICommentDatedModel>;
};
const loadCommentScoresComplete = createAction<ILoadCommentScoresCompletePayload>(
  'article-detail-new/LOAD_COMMENTS_SCORES_COMPLETE',
);

export const removeCommentScore: (payload: Array<string>) => Action<Array<string>> = createAction<Array<string>>(
  'article-detail-new/REMOVE_COMMENT_SCORES',
);

export async function loadCommentScoresForArticle(
  dispatch: IAppDispatch,
  articleId: string,
  tagId:  string | 'DATE' | 'SUMMARY_SCORE',
  sort: Array<string>,
) {
  await dispatch(loadCommentScoresStart());

  let scores;

  switch (tagId) {
    case undefined:
      break;
    case 'DATE':
      scores = await listHistogramScoresByArticleByDate(articleId, sort);
      break;
    case 'SUMMARY_SCORE':
      scores = await listMaxSummaryScoreByArticle(articleId, sort);
      break;
    default:
      scores = await listHistogramScoresByArticle(articleId, tagId, sort);
  }

  await dispatch(loadCommentScoresComplete({ scores }));
}

export async function loadCommentScoresForCategory(
  dispatch: IAppDispatch,
  categoryId: string | 'all',
  tagId: string | 'DATE' | 'SUMMARY_SCORE',
  sort: Array<string>,
) {
  await dispatch(loadCommentScoresStart());

  let scores;

  switch (tagId) {
    case undefined:
      break;
    case 'DATE':
      scores = await listHistogramScoresByCategoryByDate(categoryId, sort);
      break;
    case 'SUMMARY_SCORE':
      scores = await listMaxHistogramScoresByCategory(categoryId, sort);
      break;
    default:
      scores = await listHistogramScoresByCategory(categoryId, tagId, sort);
  }

  await dispatch(loadCommentScoresComplete({ scores }));
}

export type ICommentScoresState = Readonly<{
  isLoading: boolean;
  hasData: boolean;
  scores: List<ICommentScoredModel | ICommentDatedModel>;
}>;

const initailState = {
  isLoading: true,
  hasData: false,
  scores: List<ICommentScoredModel | ICommentDatedModel>(),
};

export const commentScoresReducer = handleActions<
  ICommentScoresState,
  void                                       | // loadCommentScoresStart
  ILoadCommentScoresCompletePayload          | // loadCommentScoresComplete
  Array<string>                                // removeCommentScore
>({
  [loadCommentScoresStart.toString()]: (state) => ({...state, isLoading: true, hasData: false }),

  [loadCommentScoresComplete.toString()]: (_state, { payload }: Action<ILoadCommentScoresCompletePayload>) => {
    const { scores } = payload;
    return { isLoading: false, hasData: true, scores};
  },

  [removeCommentScore.toString()]: (state, { payload }: Action<Array<string>>) => ({
    ...state,
    scores: List(state.scores.filter((score: ICommentScoredModel | ICommentDatedModel) => {
          const index = payload.findIndex((id: string) => id === score.commentId);
          return index === -1;
        })),
    }),
}, initailState);

function getStoreRecord(state: IAppState) {
  return state.scenes.commentsIndex.newComments.commentScores;
}

export function getIsLoading(state: IAppState) {
  const storeRecord = getStoreRecord(state);
  return storeRecord && storeRecord.isLoading;
}

export function getCommentScores(state: IAppState) {
  const storeRecord = getStoreRecord(state);
  return storeRecord && storeRecord.scores;
}
