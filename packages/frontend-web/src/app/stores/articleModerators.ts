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

import { fromJS, List, Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { IArticleModel, IUserModel} from '../../models';
import { IAppStateRecord, IThunkAction } from '../stores';
import {
  convertItemFromJSONAPI,
  listRelationshipModels,
} from '../util';
import { updateArticleModeratorsById, updateArticleModeratorsComplete } from './moderators';

const loadArticleModeratorsStart =
  createAction('article-moderators/LOAD_ARTICLE_MODERATORS_START');

const loadArticleModeratorsComplete =
  createAction<Array<object>>('article-moderators/LOAD_ARTICLE_MODERATORS_COMPLETE');

export type ISaveArticlePayload = {
  article: IArticleModel;
  moderators: List<IUserModel>;
};
export const saveArticle: (payload: ISaveArticlePayload) => Action<ISaveArticlePayload> =
  createAction<ISaveArticlePayload>('article-moderators/SAVE_ARTICLE');

const STATE_ROOT = ['global', 'articleModerators'];
const ARTICLE_MODERATORS_DATA = [...STATE_ROOT, 'items'];

export interface IArticleModeratorsState {
  hasData: boolean;
  isFetching: boolean;
  items: Map<string, List<IUserModel>>;
}

export interface IArticleModeratorsStateRecord extends TypedRecord<IArticleModeratorsStateRecord>, IArticleModeratorsState {}

const StateFactory = makeTypedFactory<IArticleModeratorsState, IArticleModeratorsStateRecord>({
  hasData: false,
  isFetching: false,
  items: Map<string, List<IUserModel>>(),
});

export const reducer = handleActions<
  IArticleModeratorsStateRecord,
  void                | // loadArticleModeratorsStart
  Array<object>       | // loadArticleModeratorsComplete
  ISaveArticlePayload   // saveArticle, updateArticleModeratorsComplete
>({
  [loadArticleModeratorsStart.toString()]: (state) => (
    state
        .set('isFetching', true)
  ),

  [loadArticleModeratorsComplete.toString()]: (state, { payload }: { payload: Array<object> }) => (
    state
        .set('hasData', true)
        .set('isFetching', false)
        .set('items', fromJS(payload).reduce((sum: Map<string, List<IUserModel>>, s: Map<string, any>) => (
          sum.set(
            s.get('articleId').toString(),
            s.get('moderators').map((m: object) => convertItemFromJSONAPI<IUserModel>(m)),
          )
        ), Map<string, List<IUserModel>>()))
  ),

  [saveArticle.toString()]: (state, { payload: { article, moderators } }: { payload: ISaveArticlePayload }) => (
    state.setIn(['items', article.id.toString()], List(moderators))
  ),

  [updateArticleModeratorsComplete.toString()]: (state, { payload: { article, moderators } }: { payload: ISaveArticlePayload }) => (
    state.setIn(['items', article.id.toString()], List(moderators))
  ),

  [updateArticleModeratorsById.toString()]: (state, { payload: { articleId, moderators } }: { payload: any }) => (
    state.setIn(['items', articleId.toString()], List(moderators))
  ),
}, StateFactory());

export function getArticleModerators(state: IAppStateRecord): List<IUserModel> {
  return state.getIn(ARTICLE_MODERATORS_DATA);
}

export function loadArticleModerators(id: string): IThunkAction<void> {
  return async (dispatch) => {
    dispatch(loadArticleModeratorsStart());

    const result = await listRelationshipModels<IUserModel>('articles', id, 'assignedModerators', {
      page: { limit: -1 },
    });

    dispatch(loadArticleModeratorsComplete([{
      articleId: id,
      moderators: result.response.data,
    }]));
  };
}
