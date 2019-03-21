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

export interface IColumnSortDefinition {
  label: string;
  sortInfo: Array<string>;
  sortName?: string;
}

export const commentSortDefinitions: {
  [key: string]: IColumnSortDefinition;
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
    sortInfo: ['-unresolvedFlagsCount'],
    sortName: 'unresolvedFlagsCount',
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
    default:
      return 'updated';
  }
}
