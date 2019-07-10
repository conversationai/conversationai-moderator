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

import { IArticleModel, ICategoryModel, ModelId } from '../../../models';

export interface IFilterItem {
  key: string;
  value: string;
}

export const NOT_SET = '~';

export function parseFilter(filter: string | undefined): Array<IFilterItem> {
  if (!filter || filter.length === 0 || filter === NOT_SET) {
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

export function getFilterString(filterList: Array<IFilterItem>): string {
  if (filterList.length === 0) {
    return NOT_SET;
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
  categories: Map<ModelId, ICategoryModel>;
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
export const FILTER_TO_REVIEW = 'commentsToReview';
export const FILTER_TO_REVIEW_ANY = 'any';
export const FILTER_TO_REVIEW_NEW = 'new';
export const FILTER_TO_REVIEW_DEFERRED = 'deferred';
export const FILTER_DATE_sourceCreatedAt = 'sourceCreatedAt';
export const FILTER_DATE_updatedAt = 'updatedAt';
export const FILTER_DATE_lastModeratedAt = 'lastModeratedAt';
export const FILTER_DATE_SINCE = 'since-';
export const FILTER_DATE_PRIOR = 'prior-';
export const FILTER_MODERATOR_ISME = `${FILTER_MODERATORS}=${FILTER_MODERATORS_ME}`;

function articleHasModerator(context: IFilterContext, article: IArticleModel, moderatorId: string) {
  for (const mId of article.assignedModerators) {
    if (moderatorId === mId) {
      return true;
    }
  }
  if (article.categoryId) {
    const category = context.categories.get(article.categoryId);
    for (const mId of category.assignedModerators) {
      if (moderatorId === mId) {
        return true;
      }
    }
  }
  return false;
}

function articleMatchesModerators(context: IFilterContext, article: IArticleModel, moderatorIds: Set<string>) {
  const category = context.categories.get(article.categoryId);
  for (const mId of article.assignedModerators) {
    if (moderatorIds.has(mId)) {
      return true;
    }
  }
  if (category) {
    for (const mId of category.assignedModerators) {
      if (moderatorIds.has(mId)) {
        return true;
      }
    }
  }
}

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
          if (i.value === FILTER_MODERATORS_UNASSIGNED) {
            if (article.assignedModerators.length !== 0) {
              return false;
            }
            const category = context.categories.get(article.categoryId);
            if (category && category.assignedModerators.length !== 0) {
              return false;
            }
          }
          else {
            let found = false;
            if (i.value === FILTER_MODERATORS_ME) {
              found = articleHasModerator(context, article, context.myId);
            }
            else {
              const moderatorIds = new Set<string>(i.value.split(','));
              found = articleMatchesModerators(context, article, moderatorIds);
            }
            if (!found) {
              return false;
            }
          }
          break;

        case FILTER_CATEGORY:
          if (i.value === FILTER_CATEGORY_NONE) {
            if (article.categoryId) {
              return false;
            }
          }
          else {
            if (article.categoryId !== i.value) {
              return false;
            }
          }
          break;

        case FILTER_DATE_sourceCreatedAt:
        case FILTER_DATE_updatedAt:
        case FILTER_DATE_lastModeratedAt:
          const dateValue = new Date(article[i.key]);
          if (i.value.startsWith(FILTER_DATE_SINCE)) {
            const hours = Number(i.value.substr(FILTER_DATE_SINCE.length));
            const cutoff = new Date(Date.now() - 1000 * 60 * 60 * hours);
            if (dateValue < cutoff) {
              return false;
            }
          }
          else if (i.value.startsWith(FILTER_DATE_PRIOR)) {
            const hours = Number(i.value.substr(FILTER_DATE_PRIOR.length));
            const cutoff = new Date(Date.now() - 1000 * 60 * 60 * hours);
            if (dateValue > cutoff) {
              return false;
            }
          }
          else {
            const values = filterDateRangeValues(i.value);
            if (values) {
              if (values[0] && values[0].length > 0) {
                const fromDate = new Date(values[0]);
                if (dateValue < fromDate) {
                  return false;
                }
              }
              if (values[1] && values[1].length > 0) {
                const toDate = new Date(values[1]);
                toDate.setDate(toDate.getDate() + 1);
                if (dateValue > toDate) {
                  return false;
                }
              }
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

        case FILTER_TO_REVIEW:
          if (i.value === FILTER_TO_REVIEW_ANY) {
            if ((article.unmoderatedCount + article.deferredCount) === 0) {
              return false;
            }
          }
          else if (i.value === FILTER_TO_REVIEW_NEW) {
            if (article.unmoderatedCount === 0) {
              return false;
            }
          }
          else if (i.value === FILTER_TO_REVIEW_DEFERRED) {
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

export function filterDateRangeValues(value: string) {
  const values = value.split(':');
  if (values.length !== 2) {
    return null;
  }
  return values;
}

export function filterDateRange(from: string, to: string) {
  from = from || '';
  to = to || '';
  return `${from}:${to}`;
}

export function parseSort(sort: string | undefined) {
  if (!sort || sort.length === 0 || sort === NOT_SET) {
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

export function getSortString(sl: Array<string>) {
  if (sl.length === 0) {
    return NOT_SET;
  }
  return sl.join(',');
}

export const SORT_TITLE = 'title';
export const SORT_NEW = 'new';
export const SORT_APPROVED = 'approved';
export const SORT_REJECTED = 'rejected';
export const SORT_DEFERRED = 'deferred';
export const SORT_HIGHLIGHTED = 'highlighted';
export const SORT_FLAGGED = 'flagged';
export const SORT_SOURCE_CREATED = 'sourceCreatedAt';
export const SORT_UPDATED = 'updatedAt';
export const SORT_LAST_MODERATED = 'lastModeratedAt';

export function executeSort(sortList: Array<string>) {
  function compareItem(a: IArticleModel, b: IArticleModel, comparator: string) {
    switch (comparator) {
      case SORT_TITLE:
        return ('' + a.title).localeCompare(b.title);
      case SORT_NEW:
        return b.unmoderatedCount - a.unmoderatedCount;
      case SORT_APPROVED:
        return b.approvedCount - a.approvedCount;
      case SORT_REJECTED:
        return b.rejectedCount - a.rejectedCount;
      case SORT_DEFERRED:
        return b.deferredCount - a.deferredCount;
      case SORT_HIGHLIGHTED:
        return b.flaggedCount - a.flaggedCount;
      case SORT_FLAGGED:
        return b.flaggedCount - a.flaggedCount;
      case SORT_LAST_MODERATED:
      case SORT_SOURCE_CREATED:
      case SORT_UPDATED:
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
