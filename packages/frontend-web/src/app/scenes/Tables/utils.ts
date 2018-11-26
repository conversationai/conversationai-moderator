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

import {IArticleModel} from '../../../models';

export interface IFilterItem {
  key: string;
  value: string;
}

export function parseFilter(filter: string | undefined): Array<IFilterItem> {
  if (!filter || filter.length === 0 || filter === '~') {
    return [];
  }

  const items = filter.split('+');
  const filterList: Array<IFilterItem> = [];
  for (const i of items) {
    const fields = i.split('=');
    if (fields.length !== 2) {
      continue;
    }
    filterList.push({key: fields[0], value: fields[1]});
  }
  return filterList;
}

export function updateFilter(filterList: Array<IFilterItem>, newKey: string, newValue?: string): Array<IFilterItem> {
  filterList = filterList.filter((item: IFilterItem) => item.key !== newKey);
  if (newValue) {
    filterList.push({key: newKey, value: newValue});
  }
  return filterList;
}

export function filterString(filterList: Array<IFilterItem>): string {
  if (filterList.length === 0) {
    return '~';
  }

  return filterList.reduce<string>((r: string, i: IFilterItem) => (r ? `${r}+` : '') +  `${i.key}=${i.value}`, undefined);
}

export function getFilterValue(filterList: Array<IFilterItem>, key: string) {
  const item = filterList.find((i) => i.key === key);
  if (item) {
    return item.value;
  }
  return '';
}

export interface IFilterContext {
  myId: string;
}

export const FILTER_TITLE = 'title';
export const FILTER_CATEGORY = 'category';
export const FILTER_CATEGORY_NONE = 'none';
export const FILTER_MODERATORS = 'moderators';
export const FILTER_MODERATORS_ME = 'me';
export const FILTER_MODERATORS_UNASSIGNED = 'unassigned';
export const FILTER_TOGGLE_isCommentingEnabled = 'isCommentingEnabled';
export const FILTER_TOGGLE_isAutoModerated = 'isAutoModerated';
export const FILTER_TOGGLE_ON = 'yes';
export const FILTER_TOGGLE_OFF = 'no';
export const FILTER_DATE_sourceCreatedAt = 'sourceCreatedAt';
export const FILTER_DATE_updatedAt = 'updatedAt';
export const FILTER_DATE_lastModeratedAt = 'lastModeratedAt';
export const FILTER_DATE_SINCE = 'since-';
export const FILTER_DATE_PRIOR = 'prior-';

export function executeFilter(filterList: Array<IFilterItem>, context: IFilterContext) {
  return (article: IArticleModel) => {
    for (const i of filterList) {
      switch (i.key) {
        case FILTER_TITLE:
          if (article.title.toLocaleLowerCase().indexOf(i.value.toLocaleLowerCase()) < 0) {
            return false;
          }
          break;

        case FILTER_MODERATORS:
          let found = false;
          if (i.value === FILTER_MODERATORS_UNASSIGNED) {
            if (!article.assignedModerators || article.assignedModerators.length === 0) {
              // TODO: Need to also handle category moderators
              found = true;
            }
          }
          else if (article.assignedModerators && article.assignedModerators.length > 0) {
            if (i.value === FILTER_MODERATORS_ME) {
              for (const m of article.assignedModerators) {
                if (context.myId === m.id) {
                  found = true;
                  break;
                }
              }
            }
            else {
              const moderatorIds = new Set<string>(i.value.split(','));
              for (const m of article.assignedModerators) {
                if (moderatorIds.has(m.id)) {
                  found = true;
                  break;
                }
              }
              // TODO: Need to also search category moderators.
            }
          }
          if (!found) {
            return false;
          }
          break;

        case FILTER_CATEGORY:
          if (i.value === FILTER_CATEGORY_NONE) {
            if (article.category) {
              return false;
            }
          }
          else {
            if (!article.category || article.category.id !== i.value) {
              return false;
            }
          }
          break;

        case FILTER_DATE_sourceCreatedAt:
        case FILTER_DATE_updatedAt:
        case FILTER_DATE_lastModeratedAt:
          if (i.value.startsWith(FILTER_DATE_SINCE)) {
            const hours = Number(i.value.substr(FILTER_DATE_SINCE.length));
            const cutoff = new Date(Date.now() - 1000 * 60 * 60 * hours);
            if (new Date(article[i.key]) < cutoff) {
              return false;
            }
          }
          else if (i.value.startsWith(FILTER_DATE_PRIOR)) {
            const hours = Number(i.value.substr(FILTER_DATE_PRIOR.length));
            const cutoff = new Date(Date.now() - 1000 * 60 * 60 * hours);
            if (new Date(article[i.key]) > cutoff) {
              return false;
            }
          }
          break;

        case FILTER_TOGGLE_isCommentingEnabled:
        case FILTER_TOGGLE_isAutoModerated:
          if (i.value === FILTER_TOGGLE_ON) {
            if (!article[i.key]) {
              return false;
            }
          }
          else if (i.value === FILTER_TOGGLE_OFF) {
            if (article[i.key]) {
              return false;
            }
          }
          break;

        case 'commentsToReview':
          if (i.value === 'yes') {
            if ((article.unmoderatedCount + article.deferredCount) === 0) {
              return false;
            }
          }
          else if (i.value === 'new') {
            if (article.unmoderatedCount === 0) {
              return false;
            }
          }
          else if (i.value === 'deferred') {
            if (article.deferredCount === 0) {
              return false;
            }
          }
          break;
      }
    }

    return true;
  };
}

export function resetFilterToRoot(filter: Array<IFilterItem>): Array<IFilterItem> {
  return filter.filter((item: IFilterItem) => {
    if (item.key === FILTER_CATEGORY) {
      return true;
    }
    return (item.key === FILTER_MODERATORS && item.value === FILTER_MODERATORS_ME);
  });
}

export function isFilterActive(filter: Array<IFilterItem>): boolean {
  for (const i of filter) {
    if (i.key === FILTER_CATEGORY) {
      continue;
    }
    if (i.key === FILTER_MODERATORS && i.value === FILTER_MODERATORS_ME) {
      continue;
    }
    return true;
  }
  return false;
}

export function filterDateSince(hours: number) {
  return `${FILTER_DATE_SINCE}${hours}`;
}

export function filterDatePrior(hours: number) {
  return `${FILTER_DATE_PRIOR}${hours}`;
}

export function filterDateIsRange(value: string) {
  return !(value.startsWith(FILTER_DATE_SINCE) || value.startsWith(FILTER_DATE_PRIOR));
}

export function parseSort(sort: string | undefined) {
  if (!sort || sort.length === 0 || sort === '~') {
    return [];
  }
  return sort.split(',');
}

export function updateSort(sortList: Array<string>, newSort: string): Array<string> {
  function removeItem(sl: Array<string>, item: string) {
    return sl.filter((sortitem) => !sortitem.endsWith(item));
  }

  if (!newSort.startsWith('+') && !newSort.startsWith('-')) {
    return removeItem(sortList, newSort);
  }

  sortList = removeItem(sortList, newSort.substr(1));
  sortList.unshift(newSort);
  return sortList;
}

export function sortString(sl: Array<string>) {
  if (sl.length === 0) {
    return '~';
  }
  return sl.join(',');
}

export function executeSort(sortList: Array<string>) {
  function compareItem(a: IArticleModel, b: IArticleModel, comparator: string) {
    switch (comparator) {
      case 'title':
        return ('' + a.title).localeCompare(b.title);
      case 'category':
        return ('' + a.category.label).localeCompare(b.category.label);
      case 'new':
        return b.unmoderatedCount - a.unmoderatedCount;
      case 'approved':
        return b.approvedCount - a.approvedCount;
      case 'rejected':
        return b.rejectedCount - a.rejectedCount;
      case 'deferred':
        return b.deferredCount - a.deferredCount;
      case 'flagged':
        return b.flaggedCount - a.flaggedCount;
      case 'lastModeratedAt':
      case 'sourceCreatedAt':
      case 'updatedAt':
        const lma = a[comparator];
        const lmb = b[comparator];
        if (!lma && !lmb) {
          return 0;
        }
        if (!lma) {
          return 1;
        }
        if (!lmb) {
          return -1;
        }
        return (new Date(lmb)).getTime() - (new Date(lma)).getTime();
    }
  }
  return (a: IArticleModel, b: IArticleModel) => {
    for (const sortItem of sortList) {
      const direction = sortItem[0];
      const comparison = compareItem(a, b, sortItem.substr(1));
      if (comparison === 0) {
        continue;
      }
      if (direction === '-') {
        return -comparison;
      }
      return comparison;
    }
    return 0;
  };
}
