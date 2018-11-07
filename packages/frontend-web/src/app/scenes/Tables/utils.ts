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

export function newFilterString(filterList: Array<IFilterItem>, newKey?: string, newValue?: string): string {
  if (newKey) {
    filterList = filterList.filter((item: IFilterItem) => item.key !== newKey);
    if (newValue) {
      filterList.push({key: newKey, value: newValue});
    }
  }

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

export function executeFilter(filterList: Array<IFilterItem>) {
  return (article: IArticleModel) => {
    for (const i of filterList){
      switch (i.key) {
        case 'user':
          if (i.value === 'unassigned') {
            if (article.assignedModerators && article.assignedModerators.length > 0) {
              return false;
            }
          }
          else {
            if (!article.assignedModerators) {
              return false;
            }
            let found = false;
            for (const m of article.assignedModerators) {
              if (m.id === i.value) {
                found = true;
                break;
              }
            }
            if (!found) {
              return false;
            }
          }
          break;

        case 'category':
          if (i.value === 'none') {
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
      }
    }

    return true;
  };
}

export function parseSort(sort: string | undefined) {
  if (!sort || sort.length === 0 || sort === '~') {
    return [];
  }
  return sort.split(',');
}

export function newSortString(sortList: Array<string>, newSort?: string): string {
  function sortString(sl: Array<string>) {
    if (sl.length === 0) {
      return '~';
    }
    return sl.join(',');
  }

  function removeItem(sl: Array<string>, item: string) {
    return sl.filter((sortitem) => !sortitem.endsWith(item));
  }

  if (!newSort) {
    return sortString(sortList);
  }

  if (!newSort.startsWith('+') && !newSort.startsWith('-')) {
    return sortString(removeItem(sortList, newSort));
  }

  sortList = removeItem(sortList, newSort.substr(1));
  sortList.unshift(newSort);
  return sortString(sortList);
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
