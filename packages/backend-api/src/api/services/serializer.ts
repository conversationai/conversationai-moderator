/*
Copyright 2019 Google Inc.

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

import { pick } from 'lodash';
import * as Sequelize from 'sequelize';

export const TAG_FIELDS = ['id', 'color', 'description', 'key', 'label', 'isInBatchView', 'inSummaryScore', 'isTaggable'];
export const RANGE_FIELDS = ['id', 'categoryId', 'lowerThreshold', 'upperThreshold', 'tagId'];
export const TAGGING_SENSITIVITY_FIELDS = RANGE_FIELDS;
export const RULE_FIELDS = ['action', 'createdBy', ...RANGE_FIELDS];
export const PRESELECT_FIELDS = RANGE_FIELDS;
export const USER_FIELDS = ['id', 'name', 'email', 'avatarURL', 'group', 'isActive'];

const COMMENTSET_FIELDS = ['id', 'updatedAt', 'allCount', 'unprocessedCount', 'unmoderatedCount', 'moderatedCount',
  'approvedCount', 'highlightedCount', 'rejectedCount', 'deferredCount', 'flaggedCount',
  'batchedCount', 'recommendedCount', 'assignedModerators', ];
export const CATEGORY_FIELDS = [...COMMENTSET_FIELDS, 'label', 'ownerId', 'isActive', 'sourceId'];
export const ARTICLE_FIELDS = [...COMMENTSET_FIELDS, 'title', 'url', 'categoryId', 'sourceCreatedAt', 'lastModeratedAt',
  'isCommentingEnabled', 'isAutoModerated'];

export const COMMENT_FIELDS = ['id', 'sourceId', 'replyToSourceId', 'replyId', 'authorSourceId', 'text', 'author',
  'isScored', 'isModerated', 'isAccepted', 'isDeferred', 'isHighlighted', 'isBatchResolved', 'isAutoResolved',
  'sourceCreatedAt', 'updatedAt', 'unresolvedFlagsCount', 'flagsSummary', 'sentForScoring', 'articleId',
  'maxSummaryScore', 'maxSummaryScoreTagId',
];
export const SCORE_FIELDS = ['id', 'commentId', 'confirmedUserId', 'tagId', 'score',
  'annotationStart', 'annotationEnd', 'sourceType', 'isConfirmed'];
export const FLAG_FIELDS = ['id', 'label', 'detail', 'isRecommendation', 'commentId', 'sourceId', 'authorSourceId',
  'isResolved', 'resolvedById', 'resolvedAt'];

const ID_FIELDS = new Set(['categoryId', 'articleId', 'tagId', 'ownerId', 'commentId',
  'confirmedUserId', 'resolvedById', 'replyId']);

// Convert IDs to strings, and assignedModerators to arrays of strings.
export function serialiseObject(
  o: Sequelize.Instance<any>,
  fields: Array<string>,
): {[key: string]: {} | Array<string> | string | number} {
  const serialised = pick(o.toJSON(), fields);

  serialised.id = serialised.id.toString();

  for (const k in serialised) {
    const v = serialised[k];

    if (ID_FIELDS.has(k) && v) {
      serialised[k] = v.toString();
    }
  }

  if (serialised.assignedModerators) {
    serialised.assignedModerators = serialised.assignedModerators.map(
      (i: any) => (i.user_category_assignment ?  i.user_category_assignment.userId.toString() :
        i.moderator_assignment.userId.toString()));
  }
  return serialised;
}
