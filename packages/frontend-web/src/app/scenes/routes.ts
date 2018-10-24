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

export const dashboardBase = 'dashboard';
export function dashboardLink(filter?: string, sort?: string) {
  let ret = `/${dashboardBase}`;
  if (filter) {
    ret = `${ret}/${filter}`;
  }
  if (sort) {
    ret = `${ret}/${sort}`;
  }
  return ret;
}

export const settingsBase = 'settings';
export function settingsLink() {
  return `/${settingsBase}`;
}

export const searchBase = 'search';
export function searchLink() {
  return `/${searchBase}`;
}

export const articlesBase = 'articles';
export const categoriesBase = 'categories';
export function _commentLink(base: string, id: string, type: string) {
  let suffix;
  if (type === 'new') {
    suffix = 'new';
  }
  else {
    suffix = 'moderated/' + type;
  }
  return `${base}/${id}/${suffix}`;
}
export function articlesLink(id: string, type: string) {
  return _commentLink(articlesBase, id, type);
}
export function categoriesLink(id: string, type: string) {
  return _commentLink(categoriesBase, id, type);
}

export const oldDashboardBase = 'dashboard-old';
export function oldDashboardLink(slug?: string) {
  let ret = `/${oldDashboardBase}`;
  if (slug) {
    ret = `${ret}/${slug}`;
  }
  return ret;
}
