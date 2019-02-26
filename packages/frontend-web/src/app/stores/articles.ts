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
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';

import { IArticleModel, ModelId } from '../../models';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'articles'];
const DATA = [...STATE_ROOT, 'items'];

export const articlesLoaded = createAction<List<IArticleModel>>('global/ARTICLES_LOADED');

export function getArticles(state: IAppStateRecord): List<IArticleModel> {
  return state.getIn(DATA);
}

export function getArticleFromId(state: IAppStateRecord, articleId: ModelId): IArticleModel {
  return state.getIn(DATA).find((article: IArticleModel) => article.id === articleId);
}

export interface IArticlesState {
  items: List<IArticleModel>;
}

export interface IArticlesStateRecord extends TypedRecord<IArticlesStateRecord>, IArticlesState {}

const StateFactory = makeTypedFactory<IArticlesState, IArticlesStateRecord>({
  items: List<IArticleModel>(),
});

const reducer = handleActions<IArticlesStateRecord, List<IArticleModel>>( {
  [articlesLoaded.toString()]: (state: IArticlesStateRecord, { payload }: Action<List<IArticleModel>>) => {
    return state.set('items', payload);
  },
}, StateFactory());

export { reducer };
