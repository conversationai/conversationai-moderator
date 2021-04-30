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
} from '../../models';
import { Category } from '../../models';

export async function denormalizeCommentCountsForCategory(category: Category) {
  const query = { where: { categoryId: category.id } };

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
    Article.sum('allCount', query),
    Article.sum('unprocessedCount', query),
    Article.sum('unmoderatedCount', query),
    Article.sum('moderatedCount', query),
    Article.sum('highlightedCount', query),
    Article.sum('approvedCount', query),
    Article.sum('rejectedCount', query),
    Article.sum('deferredCount', query),
    Article.sum('flaggedCount', query),
    Article.sum('batchedCount', query),
  ]);

  return category.update({
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
  });
}
