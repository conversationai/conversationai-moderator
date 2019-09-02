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
  partialUpdateHappened,
} from '@conversationai/moderator-backend-core';
import { IArticleAttributes, IArticleInstance } from '@conversationai/moderator-backend-core';

import {
  denormalizeCommentCountsForCategory,
} from '../categories';

export async function denormalizeCommentCountsForArticle(article: IArticleInstance | null, isModeratorAction: boolean): Promise<void> {
  if (!article) {
    return;
  }

  const [
    allCount,
    unprocessedCount,
    unmoderatedCount,
    moderatedCount,
    highlightedCount,
    approvedCount,
    rejectedCount,
    deferredCount,
    flaggedCount,
    batchedCount,
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
    Comment.count({ where: { articleId: article.id,
        $or: [{ isModerated: false }, { isAccepted: true }],
        unresolvedFlagsCount: { $gt: 0 } } }),
    Comment.count({ where: { articleId: article.id, isModerated: true, isBatchResolved: true } }),
  ]);

  const update: Partial<IArticleAttributes> = {
    allCount,
    unprocessedCount,
    unmoderatedCount,
    moderatedCount,
    highlightedCount,
    approvedCount,
    rejectedCount,
    deferredCount,
    flaggedCount,
    batchedCount,
  };

  if (isModeratorAction) {
    update.lastModeratedAt = new Date();
  }

  await article.update(update);

  if (article.get('categoryId')) {
    const category = (await Category.findById(article.get('categoryId')))!;
    await denormalizeCommentCountsForCategory(category);
  }

  partialUpdateHappened(article.id);
}
