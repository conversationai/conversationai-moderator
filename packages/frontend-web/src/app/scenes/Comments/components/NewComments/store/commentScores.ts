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
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { IAppStateRecord, IThunkAction } from '../../../../../stores';
import { DATA_PREFIX } from './reduxPrefix';

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

const SCORES_HAS_DATA = [...DATA_PREFIX, 'commentScores', 'hasData'];
const SCORES_DATA = [...DATA_PREFIX, 'commentScores', 'scores'];
const SCORES_IS_LOADING = [...DATA_PREFIX, 'commentScores', 'isLoading'];

const loadCommentScoresStart = createAction(
  'article-detail-new/LOAD_COMMENTS_SCORES_START',
);

type ILoadCommentScoresCompletePayload = {
  scores: List<ICommentScoredModel | ICommentDatedModel>;
};
const loadCommentScoresComplete = createAction<ILoadCommentScoresCompletePayload>(
  'article-detail-new/LOAD_COMMENTS_SCORES_COMPLETE',
);

const removeCommentScore: (payload: Array<string>) => Action<Array<string>> = createAction<Array<string>>(
  'article-detail-new/REMOVE_COMMENT_SCORES',
);

export function loadCommentScoresForArticle(articleId: string, tagId:  string | 'DATE' | 'SUMMARY_SCORE', sort: Array<string>): IThunkAction<Promise<void>> {
  return async (dispatch) => {
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
  };
}

export function loadCommentScoresForCategory(categoryId: string | 'all', tagId: string | 'DATE' | 'SUMMARY_SCORE', sort: Array<string>): IThunkAction<Promise<void>> {
  return async (dispatch) => {
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
  };
}

export interface ICommentScoresState {
  isLoading: boolean;
  hasData: boolean;
  scores: List<ICommentScoredModel | ICommentDatedModel>;
}

export interface ICommentScoresStateRecord extends TypedRecord<ICommentScoresStateRecord>, ICommentScoresState {}

const CommentScoresStateFactory = makeTypedFactory<ICommentScoresState, ICommentScoresStateRecord>({
  isLoading: true,
  hasData: false,
  scores: List<ICommentScoredModel | ICommentDatedModel>(),
});

export const commentScoresReducer = handleActions<
  ICommentScoresStateRecord,
  void                                       | // loadCommentScoresStart
  ILoadCommentScoresCompletePayload          | // loadCommentScoresComplete
  Array<string>                                // removeCommentScore
>({
  [loadCommentScoresStart.toString()]: (state) => (
    state
        .set('isLoading', true)
        .set('hasData', false)
  ),

  [loadCommentScoresComplete.toString()]: (state, { payload }: Action<ILoadCommentScoresCompletePayload>) => {
    const { scores } = payload;
    return state
        .set('isLoading', false)
        .set('scores', scores)
        .set('hasData', true);
  },

  [removeCommentScore.toString()]: (state, { payload }: Action<Array<string>>) => (
    state
        .updateIn(['scores'], (scores: List<ICommentScoredModel | ICommentDatedModel>) => {
          return scores.filter((score: ICommentScoredModel | ICommentDatedModel) => {
            const index = payload.findIndex((id: string) => id === score.commentId);

            return index === -1;
          });
        })
    ),
}, CommentScoresStateFactory());

function getCommentScoresHasData(state: IAppStateRecord): boolean {
  return state.getIn(SCORES_HAS_DATA);
}

function getCommentScores(state: IAppStateRecord): List<ICommentScoredModel | ICommentDatedModel> {
  return state.getIn(SCORES_DATA);
}

function getCommentScoresIsLoading(state: IAppStateRecord): boolean {
  return state.getIn(SCORES_IS_LOADING);
}

export {
  getCommentScoresHasData,
  getCommentScores,
  getCommentScoresIsLoading,
  removeCommentScore,
};
