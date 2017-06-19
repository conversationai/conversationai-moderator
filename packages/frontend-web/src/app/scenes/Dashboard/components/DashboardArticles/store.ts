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

import { Map } from 'immutable';
import { createAction } from 'redux-actions';
import { combineReducers } from 'redux-immutable';
import { IArticleModel } from '../../../../../models';
import { getUser } from '../../../../auth';
import { IAppDispatch, IAppStateRecord, IThunkAction } from '../../../../stores';
import {
  convertArrayFromJSONAPI,
  listAssignedArticles,
  listDeferredArticles,
  listModels,
  listRelationshipModels,
  makePagedRecordStore,
} from '../../../../util';

import { saveArticle } from '../../../../stores/articleModerators';

export const PER_PAGE = 8;

const DATA_PREFIX = ['scenes', 'dashboard', 'articles'];
const ARTICLES_DATA = [...DATA_PREFIX, 'articles', 'pages'];

const loadArticlesPageStart = createAction<void>('dashboard-articles/LOAD_ARTICLES_PAGE_START');
const loadArticlesPageComplete = createAction<object>('dashboard-articles/LOAD_ARTICLES_PAGE_COMPLETE');

function sideLoadModerators(payload: any): IThunkAction<Promise<void>> {
  return async (dispatch) => {
    const articles = convertArrayFromJSONAPI<IArticleModel>(payload);

    await Promise.all(
      articles.map((a) => dispatch(saveArticle({
        article: a,
        moderators: a.assignedModerators || [],
      }))).toArray(),
    );

    await dispatch(loadArticlesPageComplete(payload));
  };
}

export function getArticlePages(state: IAppStateRecord): Map<number, Map<string, Array<IArticleModel>>> {
  return state.getIn(ARTICLES_DATA);
}

export function getLoadedArticles(state: IAppStateRecord): Array<IArticleModel> {
  const articlePages = getArticlePages(state);

  return articlePages.reduce(
    (prev: Array<IArticleModel>, current: any) => (
      prev.concat(...current.get('items').map((article: IArticleModel) => article)), []
    ),
  );
}

export function getLoadedArticleIds(state: IAppStateRecord): Array<string> {
  const articlePages = getArticlePages(state);

  return articlePages.reduce(
    (prev: Array<string>, current: any) => (
      prev.concat(...current.get('items').map((article: IArticleModel) => article.id)), []
    ),
  );
}

const {
  reducer,
  loadIndex,
  loadPage,
  changeScope,
  getTotalItems,
  getIsFetching,
  getScope,
} = makePagedRecordStore<IArticleModel, Map<string, any>>(
  [...DATA_PREFIX, 'articles'],
  PER_PAGE,
  (scope, page, getState) => {
    let getter;
    if (scope.get('mode') === 'assignments') {
      getter = listAssignedArticles.bind(null, getUser(getState()).id);
    } else if (scope.get('mode') === 'deferred') {
      getter = listDeferredArticles.bind(null);
    } else {
      if (!scope.get('categoryId')) {
        getter = listModels.bind(null, 'articles');
      } else {
        getter = listRelationshipModels.bind(null, 'categories', scope.get('categoryId'), 'articles');
      }
    }

    return getter({
      sort: scope.get('sort').toArray(),
      include: ['category', 'assignedModerators'],
      fields: {
        articles: ['-text', '-url'],
      },
      page: {
        offset: page * PER_PAGE,
        limit: PER_PAGE,
      },
    });
  },
  (dispatch: IAppDispatch) => dispatch(loadArticlesPageStart()),
  (dispatch: IAppDispatch, payload: any) => dispatch(sideLoadModerators(payload)),
);

export const loadArticleIndex = loadIndex;
export const loadArticlePage = loadPage;
export const changeArticleScope = changeScope;
export const getArticleScope = getScope;
export { getTotalItems, getIsFetching };

export const reducers: any = combineReducers({
  articles: reducer,
});
