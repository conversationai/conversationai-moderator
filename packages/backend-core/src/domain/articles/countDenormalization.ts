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
  Category,
  Comment,
  updateHappened,
} from '../../models';
import { IArticleInstance } from '../../models';
import {
  denormalizeCommentCountsForCategory,
} from '../categories';

export async function denormalizeCommentCountsForArticle(article: IArticleInstance | null, isModeratorAction: boolean): Promise<void> {
  if (!article) {
    return;
  }

  const [
    count,
    unprocessedCount,
    unmoderatedCount,
    moderatedCount,
    highlightedCount,
    approvedCount,
    rejectedCount,
    deferredCount,
    flaggedCount,
    batchedCount,
    recommendedCount,
  ] = await Promise.all([
    Comment.count({ where: { articleId: article.id } }),
    Comment.count({ where: { articleId: article.id, isScored: false } }),
    Comment.count({ where: { articleId: article.id, isScored: true, isModerated: false, isDeferred: false } }),
    Comment.count({ where: { articleId: article.id, isScored: true,
                             $or: { isModerated: true, isDeferred: true } } }),
    Comment.count({ where: { articleId: article.id, isHighlighted: true } }),
    Comment.count({ where: { articleId: article.id, isAccepted: true } }),
    Comment.count({ where: { articleId: article.id, isAccepted: false, isHighlighted: false } }),
    Comment.count({ where: { articleId: article.id, isDeferred: true } }),
    Comment.count({ where: { articleId: article.id, flaggedCount: { $gt: 0 } } }),
    Comment.count({ where: { articleId: article.id, isModerated: true, isBatchResolved: true } }),
    Comment.count({ where: { articleId: article.id, recommendedCount: { $gt: 0 } } }),
  ]);

  const update: any = {
    count,
    unprocessedCount,
    unmoderatedCount,
    moderatedCount,
    highlightedCount,
    approvedCount,
    rejectedCount,
    deferredCount,
    flaggedCount,
    batchedCount,
    recommendedCount,
  };

  if (isModeratorAction) {
    update.lastModeratedAt = new Date();
  }

  await article.update(update);

  if (article.get('categoryId')) {
    const category = (await Category.findById(article.get('categoryId')))!;
    await denormalizeCommentCountsForCategory(category);
  }
  else {
    updateHappened();
  }
}
