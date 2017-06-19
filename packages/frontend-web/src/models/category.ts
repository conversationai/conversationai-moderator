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

import { Record } from 'immutable';
import { TypedRecord } from 'typed-immutable-record';

export interface ICategoryAttributes {
  id: string | 'all' | 'deferred' | 'assignments';
  label: string;
  unprocessedCount: number;
  unmoderatedCount: number;
  moderatedCount: number;
}

export interface ICategoryModel extends TypedRecord<ICategoryModel>, ICategoryAttributes {}

const CategoryModelRecord = Record({
  id: null,
  label: null,
  unprocessedCount: null,
  unmoderatedCount: null,
  moderatedCount: null,
});

export function CategoryModel(keyValuePairs?: Partial<ICategoryAttributes>): ICategoryModel {
  return new CategoryModelRecord(keyValuePairs) as ICategoryModel;
}
