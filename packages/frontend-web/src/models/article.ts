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

import { Record } from 'immutable';
import { TypedRecord } from 'typed-immutable-record';

import { CategoryModel, ICategoryModel } from './category';
import { ModelId } from './common';

export interface IArticleAttributes {
  id: ModelId;
  sourceCreatedAt: string;
  updatedAt: string;
  title: string;
  text: string;
  url: string;
  category: ICategoryModel;
  allCount: number;
  unprocessedCount: number;
  unmoderatedCount: number;
  moderatedCount: number;
  deferredCount: number;
  approvedCount: number;
  highlightedCount: number;
  rejectedCount: number;
  flaggedCount: number;
  recommendedCount: number;
  batchedCount: number;
  automatedCount: number;
  lastModeratedAt: string;
  assignedModerators: Array<ModelId>;
  isCommentingEnabled: boolean;
  isAutoModerated: boolean;
}

export interface IArticleModel extends TypedRecord<IArticleModel>, IArticleAttributes {}

const ArticleModelRecord = Record({
  id: null,
  sourceCreatedAt: null,
  updatedAt: null,
  text: null,
  title: null,
  url: null,
  category: null,
  allCount: null,
  unprocessedCount: null,
  unmoderatedCount: null,
  moderatedCount: null,
  highlightedCount: null,
  approvedCount: null,
  rejectedCount: null,
  deferredCount: null,
  flaggedCount: null,
  batchedCount: null,
  recommendedCount: null,
  lastModeratedAt: null,
  assignedModerators: null,
  isCommentingEnabled: null,
  isAutoModerated: null,
});

export function ArticleModel(keyValuePairs?: IArticleAttributes): IArticleModel {
  let article = ArticleModelRecord(keyValuePairs) as IArticleModel;

  if (article.category) {
    article = article.update('category', CategoryModel);
  }

  // Sanitize URLs for security.
  if (article.url) {
    article = article.update('url', (url) => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }

      // Invalid URL, might be an XSS attempt.
      return null;
    });
  }

  return article;
}
