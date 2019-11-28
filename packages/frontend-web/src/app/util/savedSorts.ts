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
import { ModelId } from '../../models';
import { getStoreItem, saveStoreItem } from '../platform/localStore';

const LOCAL_STORAGE_KEY = 'comment-sorts';

function loadSorts(): Map<string, string> {
  const raw = getStoreItem(LOCAL_STORAGE_KEY, 1);
  if (!raw) {
    return new Map();
  }
  return new Map(JSON.parse(raw));
}

const defaultSorts = loadSorts();

export function getDefaultSort(categoryId: ModelId, page: string, tag: string) {
  const key = `${categoryId}:${page}:${tag}`;
  let sort = defaultSorts.get(key);
  if (!sort) {
    if (tag === 'DATE') {
      sort = 'newest';
    }
    else {
      sort = 'highest';
    }
  }
  return sort;
}

export function putDefaultSort(categoryId: ModelId, page: string, tag: string, sort: string) {
  const key = `${categoryId}:${page}:${tag}`;
  defaultSorts.set(key, sort);
  saveStoreItem(LOCAL_STORAGE_KEY, 1, JSON.stringify([...defaultSorts]));
}
