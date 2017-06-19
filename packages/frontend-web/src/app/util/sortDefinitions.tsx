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

import formatDate from 'date-fns/format';
import { ICommentModel } from '../../models';
import { DATE_FORMAT_LONG } from '../config';

export interface IColumnStortDefinition {
  label: string;
  sortInfo: Array<string>;
  sortName?: string;
}

export const articleSortDefinitions: {
  [key: string]: IColumnStortDefinition;
} = {
  newCount: {
    label: 'New Count',
    sortInfo: ['-unmoderatedCount'],
    sortName: 'unmoderatedCount',
  },
  newCountReversed: {
    label: 'New Count Reversed',
    sortInfo: ['unmoderatedCount'],
    sortName: 'unmoderatedCountReversed',
  },
  moderated: {
    label: 'Moderated Count',
    sortInfo: ['-moderatedCount'],
    sortName: 'moderatedCount',
  },
  unmoderated: {
    label: 'Unmoderated Count',
    sortInfo: ['-unmoderatedCount'],
  },
  approved: {
    label: 'Approved Count',
    sortInfo: ['-approvedCount'],
    sortName: 'approvedCount',
  },
  highlighted: {
    label: 'Highlighted Count',
    sortInfo: ['-highlightedCount'],
    sortName: 'highlightedCount',
  },
  rejected: {
    label: 'Rejected Count',
    sortInfo: ['-rejectedCount'],
    sortName: 'rejectedCount',
  },
  deferred: {
    label: 'Deferred Count',
    sortInfo: ['-deferedCount'],
    sortName: 'deferedCount',
  },
  flagged: {
    label: 'Flagged Count',
    sortInfo: ['-flaggedCount'],
    sortName: 'flaggedCount',
  },
  recommended: {
    label: 'Recommended Count',
    sortInfo: ['-recommendedCount'],
    sortName: 'recommendedCount',
  },
  batched: {
    label: 'Batched Count',
    sortInfo: ['-batchedCount'],
    sortName: 'batchedCount',
  },
  automated: {
    label: 'Automated',
    sortInfo: ['-isAutoModerated'],
    sortName: 'isAutoModerated',
  },
  updated: {
    label: 'Last Updated',
    sortInfo: ['-updatedAt'],
    sortName: 'updatedAt',
  },
  oldest: {
    label: 'Least Recently Published',
    sortInfo: ['sourceCreatedAt'],
    sortName: 'sourceCreatedAt',
  },
  newest: {
    label: 'Most Recently Published',
    sortInfo: ['-sourceCreatedAt'],
    sortName: 'sourceCreatedAt',
  },
  tag: {
    label: 'Tag',
    sortInfo: ['-sourceCreatedAt'],
    sortName: 'sourceCreatedAt',
  },
};

export const commentSortDefinitions: {
  [key: string]: IColumnStortDefinition;
}  = {
  approved: {
    label: 'Approved',
    sortInfo: ['-updatedAt'],
    sortName: 'updatedAt',
  },
  highlighted: {
    label: 'Highlighted Count',
    sortInfo: ['-updatedAt'],
    sortName: 'updatedAt',
  },
  rejected: {
    label: 'Rejected Count',
    sortInfo: ['-updatedAt'],
    sortName: 'updatedAt',
  },
  deferred: {
    label: 'Deferred Count',
    sortInfo: ['-updatedAt'],
    sortName: 'updatedAt',
  },
  flagged: {
    label: 'Flagged Count',
    sortInfo: ['-flaggedCount'],
    sortName: 'flaggedCount',
  },
  recommended: {
    label: 'Recommended',
    sortInfo: ['-recommendedCount'],
    sortName: 'recommendedCount',
  },
  batched: {
    label: 'Batched',
    sortInfo: ['-updatedAt'],
    sortName: 'updatedAt',
  },
  automated: {
    label: 'Automated',
    sortInfo: ['-updatedAt'],
    sortName: 'updatedAt',
  },
  updated: {
    label: 'Last Updated',
    sortInfo: ['-updatedAt'],
    sortName: 'updatedAt',
  },
  oldest: {
    label: 'Oldest',
    sortInfo: ['sourceCreatedAt'],
    sortName: 'sourceCreatedAt',
  },
  newest: {
    label: 'Newest',
    sortInfo: ['-sourceCreatedAt'],
    sortName: 'sourceCreatedAt',
  },
  highest: {
    label: 'Highest',
    sortInfo: ['-score'],
    sortName: 'highest',
  },
  lowest: {
    label: 'Lowest',
    sortInfo: ['score'],
    sortName: 'lowest',
  },
  tag: {
    label: 'Tag',
    sortInfo: ['-score'],
    sortName: 'score',
  },
};

export function getSortDefault(actionLabel: string): string {
  switch (actionLabel) {
    case 'flagged':
      return 'flagged';
    case 'recommended':
      return 'recommended';
    default:
      return 'updated';
  }
}

export function getSortContentByType(commentSortType: string, comment: ICommentModel) {
  switch (commentSortType) {
    case 'updated':
      return formatDate(comment.updatedAt, DATE_FORMAT_LONG);
    case 'recommended':
      return comment.recommendedCount.toString();
    case 'flagged':
      return comment.flaggedCount.toString();
    default:
      return formatDate(comment.sourceCreatedAt, DATE_FORMAT_LONG);
  }
}
