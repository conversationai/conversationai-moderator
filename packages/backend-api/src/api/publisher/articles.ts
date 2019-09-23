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

import {
  Article,
  Category,
  IArticleInstance,
  ModeratorAssignment,
  updateHappened,
  UserCategoryAssignment,
} from '../../models';

export interface IArticleOptionallyCreated {
  article: IArticleInstance;
  wasCreated: boolean;
}

export interface IArticleData {
  sourceId: string;
  categoryId: string;
  title: string;
  text: string;
  url?: string;
  createdAt: string;
  extra?: any;
}

export async function createArticleIfNonExistant(item: IArticleData): Promise<IArticleOptionallyCreated> {
  const categoryId = await obtainCategoryIdByLabel(item.categoryId);

  const [article, wasCreated] = await Article.findOrCreate({
    where: {
      categoryId,
      sourceId: item.sourceId,
    },
    defaults: {
      categoryId,
      sourceId: item.sourceId,
      title: item.title,
      text: item.text,
      sourceCreatedAt: item.createdAt,
      url: (item.url) ? item.url : '',
      extra: (item.extra) ? item.extra : null,
      isCommentingEnabled: true,
      isAutoModerated: true,
      unprocessedCount: 0,
      unmoderatedCount: 0,
      moderatedCount: 0,
      highlightedCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      deferredCount: 0,
      flaggedCount: 0,
      batchedCount: 0,
    },
  });

  // Add category subscribers to the per-article subscription
  if (wasCreated) {
    const subscribedUsers = await UserCategoryAssignment.findAll({
      where: {
        categoryId,
      },
    });

    for (const assignment of subscribedUsers) {
      await ModeratorAssignment.create({
        articleId: article.id,
        userId: assignment.get('userId'),
      });
    }
    updateHappened();
  }

  return { article, wasCreated };
}

// Map article object
export async function mapArticles(items: Array<IArticleData>): Promise<Array<IArticleOptionallyCreated>> {
  const results = [];

  for (const item of items) {
    const a = await createArticleIfNonExistant(item);
    results.push(a);
  }

  return results;
}

async function obtainCategoryIdByLabel(categoryLabel: string): Promise<number> {
  const category = await Category.findOne({
    where: {
      label: categoryLabel,
    },
  });

  if (!category) {
    return createCategory(categoryLabel);
  }

  return category.id;
}

async function createCategory(categoryLabel: string): Promise<number> {
  const [category, wasCreated] = await Category.findOrCreate({
    where: {
      label: categoryLabel,
    },
    defaults: {
      label: categoryLabel,
      isActive: true,
      unprocessedCount: 0,
      moderatedCount: 0,
      unmoderatedCount: 0,
      highlightedCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      deferredCount: 0,
      flaggedCount: 0,
      batchedCount: 0,
      extra: {},
    },
  });

  if (wasCreated) {
    updateHappened();
  }

  return category.id;
}
