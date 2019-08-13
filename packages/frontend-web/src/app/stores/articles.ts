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

import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';

import {IArticleModel, ModelId} from '../../models';
import { IAppStateRecord } from './appstate';

const STATE_ROOT = ['global', 'articles'];
const INDEX = [...STATE_ROOT, 'index'];
const ARRAY = [...STATE_ROOT, 'array'];

export const articlesLoaded = createAction<Array<IArticleModel>>('global/ARTICLES_LOADED');
export const articlesUpdated = createAction<Array<IArticleModel>>('global/ARTICLES_UPDATED');

export function getArticleMap(state: IAppStateRecord): Map<ModelId, IArticleModel> {
  return state.getIn(INDEX);
}

export function getArticles(state: IAppStateRecord): Array<IArticleModel> {
  return state.getIn(ARRAY);
}

export function getArticle(state: IAppStateRecord, articleId: ModelId): IArticleModel {
  return getArticleMap(state).get(articleId);
}

export interface IArticlesState {
  index: Map<ModelId, IArticleModel>;
  array: Array<IArticleModel>;
}

export interface IArticlesStateRecord extends TypedRecord<IArticlesStateRecord>, IArticlesState {}

const StateFactory = makeTypedFactory<IArticlesState, IArticlesStateRecord>({
  index: new Map<ModelId, IArticleModel>(),
  array: [],
});

const reducer = handleActions<IArticlesStateRecord, Array<IArticleModel>>( {
  [articlesLoaded.toString()]: (state: IArticlesStateRecord, { payload }: Action<Array<IArticleModel>>) => {
    const index = new Map<ModelId, IArticleModel>(payload.map((v) => ([v.id, v])));
    return state.set('index', index).set('array', Array.from(index.values()));
  },
  [articlesUpdated.toString()]: (state: IArticlesStateRecord, { payload }: Action<Array<IArticleModel>>) => {
    const index: Map<ModelId, IArticleModel> = state.get('index');
    for (const article of payload) {
      index.set(article.id, article);
    }
    return state.set('index', index).set('array', Array.from(index.values()));
  },
}, StateFactory());

export { reducer };
