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

import { List, Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';

import { IArticleModel, ModelId } from '../../models';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'articles'];
const INDEX = [...STATE_ROOT, 'index'];

export const articlesLoaded = createAction<List<IArticleModel>>('global/ARTICLES_LOADED');
export const articleUpdated = createAction<IArticleModel>('global/ARTICLE_UPDATED');

export function getArticles(state: IAppStateRecord): Map<ModelId, IArticleModel> {
  return state.getIn(INDEX);
}

export function getArticle(state: IAppStateRecord, articleId: ModelId): IArticleModel {
  return getArticles(state).get(articleId);
}

export interface IArticlesState {
  index: Map<ModelId, IArticleModel>;
}

export interface IArticlesStateRecord extends TypedRecord<IArticlesStateRecord>, IArticlesState {}

const StateFactory = makeTypedFactory<IArticlesState, IArticlesStateRecord>({
  index: Map<ModelId, IArticleModel>(),
});

const reducer = handleActions<IArticlesStateRecord, List<IArticleModel>| IArticleModel>( {
  [articlesLoaded.toString()]: (state: IArticlesStateRecord, { payload }: Action<List<IArticleModel>>) => {
    const index = Map<ModelId, IArticleModel>(payload.map((v) => ([v.id, v])));
    return state.set('index', index);
  },
  [articleUpdated.toString()]: (state: IArticlesStateRecord, { payload }: Action<IArticleModel>) => {
    return state.set('index', state.get('index').set(payload.id, payload));
  },
}, StateFactory());

export { reducer };
