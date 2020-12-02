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
import { Op } from 'sequelize';

import {
  Category,
  Comment,
  partialUpdateHappened,
} from '../../models';
import { Article } from '../../models';
import {
  denormalizeCommentCountsForCategory,
} from '../categories';

export async function denormalizeCommentCountsForArticle(article: Article | null, isModeratorAction: boolean): Promise<void> {
  if (!article) {
    return;
  }

  const allCount = await Comment.count({ where: { articleId: article.id } });
  const unprocessedCount = await Comment.count({ where: { articleId: article.id, isScored: false } });
  const unmoderatedCount = await Comment.count({ where: { articleId: article.id,
      isScored: true, isModerated: false, isDeferred: false } });
  const moderatedCount = await Comment.count({ where: { articleId: article.id,
      isScored: true, [Op.or]: { isModerated: true, isDeferred: true } } });
  const highlightedCount = await Comment.count({ where: { articleId: article.id, isHighlighted: true } });
  const approvedCount = await Comment.count({ where: { articleId: article.id, isAccepted: true } });
  const rejectedCount = await Comment.count({ where: { articleId: article.id,
      isAccepted: false, isHighlighted: false } });
  const deferredCount = await Comment.count({ where: { articleId: article.id, isDeferred: true } });
  const flaggedCount = await Comment.count({ where: { articleId: article.id,
      [Op.or]: [{ isModerated: false }, { isAccepted: true }],
      unresolvedFlagsCount: { [Op.gt]: 0 } } });
  const batchedCount = await Comment.count({ where: { articleId: article.id, isModerated: true, isBatchResolved: true } });

  const update: Partial<Article> = {
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

  if (article.categoryId) {
    const category = (await Category.findByPk(article.categoryId))!;
    await denormalizeCommentCountsForCategory(category);
  }

  partialUpdateHappened(article.id);
}
