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
import {ArticleModel, IArticleModel, ModelId} from '../../models';
import {IAppState} from '../appstate';
import {getArticles} from '../platform/dataService';
import {store} from '../store';
import {articlesUpdated} from '../stores/articles';

const articleFetchQueue = new Set();

export interface IArticleCacheProps {
  article: IArticleModel;
  inCache: boolean;
}

async function fetchArticle(articleId: ModelId) {
  const articles = await getArticles([articleId]);
  store.dispatch(articlesUpdated(articles));
}

function ensureCache(articleId: ModelId) {
  if (!articleFetchQueue.has(articleId)) {
    articleFetchQueue.add(articleId);
    fetchArticle(articleId);
  }
}

export function getCachedArticle(state: IAppState, articleId: ModelId): IArticleCacheProps {
  const article: IArticleModel = state.global.articles.index.get(articleId);
  if (article) {
    articleFetchQueue.delete(articleId);
    return {article, inCache: true};
  }

  ensureCache(articleId);

  return {
    inCache: false,
    article: ArticleModel({
      id: articleId,
      sourceCreatedAt: '',
      updatedAt: '',
      title: '',
      text: '',
      url: '',
      categoryId: 'any',
      allCount: 0,
      unprocessedCount: 0,
      unmoderatedCount: 0,
      moderatedCount: 0,
      deferredCount: 0,
      approvedCount: 0,
      highlightedCount: 0,
      rejectedCount: 0,
      flaggedCount: 0,
      batchedCount: 0,
      automatedCount: 0,
      lastModeratedAt: '',
      assignedModerators: new Array<ModelId>(),
      isCommentingEnabled: true,
      isAutoModerated: true,
    }),
  };
}
