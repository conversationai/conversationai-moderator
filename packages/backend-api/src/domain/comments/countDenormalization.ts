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
  Comment,
  CommentFlag,
  FLAGS_COUNT,
  RECOMMENDATIONS_COUNT,
  UNRESOLVED_FLAGS_COUNT,
} from '../../models';

export async function denormalizeCountsForComment(comment: Comment) {
  let unresolvedFlagsCount = 0;
  const flagsSummary: {[key: string]: Array<number>} = {};

  const flags = await CommentFlag.findAll({ where: { commentId: comment.id } });

  for (const flag of flags) {
    if (!flagsSummary[flag.label]) {
      flagsSummary[flag.label] = [0, 0, 0];
    }

    flagsSummary[flag.label][FLAGS_COUNT] += 1;

    if (!flag.isResolved) {
      unresolvedFlagsCount += 1;
      flagsSummary[flag.label][UNRESOLVED_FLAGS_COUNT] += 1;
    }
    if (flag.isRecommendation) {
      flagsSummary[flag.label][RECOMMENDATIONS_COUNT] += 1;
    }
  }

  return comment.update({
    unresolvedFlagsCount,
    flagsSummary,
  });
}
