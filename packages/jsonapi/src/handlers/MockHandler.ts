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

import { cloneDeep, merge, uniqBy } from 'lodash';

import { Serializer } from '../Serializer';

import {
  IModelHandler,
} from '../shared';

import {
  IFields,
  IFilters,
  IItemDetails,
  IListDetails,
  INewResource,
  IParams,
  IResourceComplete,
  IResourceID,
  IResourceIdentifier,
  IWithID,
} from '../types';

export class MockHandler implements IModelHandler {
  mockData: {
    [type: string]: Array<any>;
  } = {};
  mockDataById: {
    [type: string]: {
      [id: string]: any;
    };
  } = {};
  serializers: {
    [type: string]: Serializer;
  } = {};

  constructor(
    data: {
      [type: string]: Array<IWithID>,
    },

    serializers: {
      [type: string]: Serializer;
    },
  ) {
    this.mockData = data;
    this.serializers = serializers;

    this.mockDataById = Object.keys(this.mockData).reduce((sum, type) => {
      sum[type] = this.mockData[type].reduce((byId, d) => {
        byId[d.id.toString()] = d;

        return byId;
      }, sum[type] || {});

      return sum;
    }, this.mockDataById);
  }

  search(
    type: string,
    attribute: string,
    value: string,
    { page, include, fields }: IParams,
  ): Promise<IListDetails | void> {
    const filteredRecords = this.mockData[type].filter((r) => {
      return r[attribute].indexOf(value) !== -1;
    });

    const records = (typeof page.offset !== 'undefined') && (typeof page.limit !== 'undefined')
        ? filteredRecords.slice(page.offset, page.offset + page.limit)
        : filteredRecords;

    return Promise.resolve({
      totalItems: filteredRecords.length,
      pageItems: this.serializeItems(records, fields),
      includes: this.loadIncludes(records, include, fields),
    });
  }

  list(type: string, { page, include, filters, sort, fields }: IParams): Promise<IListDetails> {
    const filteredRecords = this.filterItems(this.mockData[type], filters);
    const sortedRecords = this.sortItems(filteredRecords, sort);

    const records = (typeof page.offset !== 'undefined') && (typeof page.limit !== 'undefined')
        ? sortedRecords.slice(page.offset, page.offset + page.limit)
        : sortedRecords;

    return Promise.resolve({
      totalItems: sortedRecords.length,
      pageItems: this.serializeItems(records, fields),
      includes: this.loadIncludes(records, include, fields),
    });
  }

  get(type: string, id: string, { include, fields }: IParams): Promise<IItemDetails | void> {
    const record = this.mockDataById[type][id.toString()];

    if (!record) {
      return Promise.reject({ error: 404 });
    }

    return Promise.resolve({
      item: this.serializers[type].serialize(record, fields),
      includes: this.loadIncludes([record], include, fields),
    });
  }

  listRelationships(
    type: string,
    id: string,
    relationship: string,
    { page, include, filters, sort, fields }: IParams,
  ): Promise<IItemDetails | IListDetails | void> {
    const record = this.mockDataById[type][id.toString()];

    if (!record) {
      return Promise.reject({ error: 404 });
    }

    const serializedRecord = this.serializers[record.type].serialize(record);

    if (!serializedRecord.relationships) {
      return Promise.reject({ error: 404 });
    }

    const rel = serializedRecord.relationships[relationship];

    if (!rel) {
      return Promise.reject({ error: 404 });
    }

    if (Array.isArray(rel.data)) {
      const filteredRecords = this.filterItems(
        (rel.data as Array<IResourceIdentifier>).map((d) => {
          return this.mockDataById[d.type][d.id.toString()];
        }),
        filters,
      );

      const sortedRecords = this.sortItems(filteredRecords, sort);

      const records = (typeof page.offset !== 'undefined') && (typeof page.limit !== 'undefined')
          ? sortedRecords.slice(page.offset, page.offset + page.limit)
          : sortedRecords;

      return Promise.resolve({
        totalItems: sortedRecords.length,
        pageItems: this.serializeItems(records, fields),
        includes: this.loadIncludes(records, include, fields),
      });
    } else {
      const d = (rel.data as IResourceIdentifier);
      const relationshipRecord = this.mockDataById[d.type][d.id.toString()];

      return Promise.resolve({
        item: relationshipRecord && this.serializers[d.type].serialize(relationshipRecord),
        includes: relationshipRecord && this.loadIncludes([relationshipRecord], include, fields),
      });
    }
  }

  create(type: string, data: INewResource): Promise<IItemDetails> {
    const serializedResource = cloneDeep(data) as IResourceComplete;
    serializedResource.id = `created-${Math.floor(Math.random() * 1000)}`;

    const r = this.serializers[type].deserialize(serializedResource);

    this.mockData[type].push(r);
    this.mockDataById[type][r.id.toString()] = r;

    return Promise.resolve({
      item: this.serializers[type].serialize(r),
    });
  }

  addRelationships(
    type: string,
    id: string,
    relationship: string,
    items: Array<IResourceIdentifier>,
  ): Promise<void> {
    const record = this.mockDataById[type][id.toString()];

    if (!record) {
      return Promise.reject({ error: 404 });
    }

    const serializedRecord = this.serializers[record.type].serialize(record);

    if (!serializedRecord.relationships) {
      return Promise.reject({ error: 404 });
    }

    const rel = serializedRecord.relationships[relationship];

    if (!rel) {
      return Promise.reject({ error: 404 });
    }

    if (!Array.isArray(serializedRecord.relationships[relationship].data)) {
      return Promise.resolve();
    }

    const currentData = (
      serializedRecord.relationships[relationship].data as Array<IResourceIdentifier>
    );
    serializedRecord.relationships[relationship].data = currentData.concat(items);

    const r = this.serializers[type].deserialize(serializedRecord);

    const idx = this.mockData[type].indexOf(record);

    if (idx !== -1) {
      this.mockData[type].splice(idx, 1, r);
    }

    this.mockDataById[type][r.id.toString()] = r;

    return Promise.resolve();
  }

  update(type: string, id: string, data: IResourceComplete): Promise<IItemDetails | void> {
    const record = this.mockDataById[type][id.toString()];

    if (!record) {
      return Promise.reject({ error: 404 });
    }

    const serializedResource = this.serializers[type].deserialize(record);
    const serializedResourceRelationships = serializedResource.relationships;

    const serializedUpdate = cloneDeep(data) as IResourceComplete;
    const serializedUpdateRelationships = serializedResource.relationships;

    const mergedRelationships = merge(serializedResourceRelationships, serializedUpdateRelationships);
    const mergedModel = merge(serializedResource, serializedUpdate);
    mergedModel.relationships = mergedRelationships;

    const r = this.serializers[type].deserialize(mergedModel);

    const idx = this.mockData[type].indexOf(record);

    if (idx !== -1) {
      this.mockData[type].splice(idx, 1, r);
    }

    this.mockDataById[type][r.id.toString()] = r;

    return Promise.resolve({
      item: this.serializers[type].serialize(r),
    });
  }

  updateRelationships(
    type: string,
    id: IResourceID,
    relationship: string,
    data: IResourceIdentifier | Array<IResourceIdentifier>,
  ): Promise<void> {
    const record = this.mockDataById[type][id.toString()];

    if (!record) {
      return Promise.reject({ error: 404 });
    }

    const serializedRecord = this.serializers[record.type].serialize(record);

    if (!serializedRecord.relationships) {
      return Promise.reject({ error: 404 });
    }

    const rel = serializedRecord.relationships[relationship];

    if (!rel) {
      return Promise.reject({ error: 404 });
    }

    serializedRecord.relationships[relationship].data = data;

    const r = this.serializers[type].deserialize(serializedRecord);

    const idx = this.mockData[type].indexOf(record);

    if (idx !== -1) {
      this.mockData[type].splice(idx, 1, r);
    }

    this.mockDataById[type][r.id.toString()] = r;

    return Promise.resolve();
  }

  destroy(type: string, id: string): Promise<void> {
    const record = this.mockDataById[type][id.toString()];

    if (!record) {
      return Promise.reject({ error: 404 });
    }

    const idx = this.mockData[type].indexOf(record);

    if (idx !== -1) {
      this.mockData[type].splice(idx, 1);
    }

    delete this.mockDataById[type][id.toString()];

    return Promise.resolve();
  }

  destroyRelationships(
    type: string,
    id: string,
    relationship: string,
    items: Array<IResourceIdentifier>,
  ): Promise<void> {
    const record = this.mockDataById[type][id.toString()];

    if (!record) {
      return Promise.reject({ error: 404 });
    }

    const serializedRecord = this.serializers[record.type].serialize(record);

    if (!serializedRecord.relationships) {
      return Promise.reject({ error: 404 });
    }

    const rel = serializedRecord.relationships[relationship];

    if (!rel) {
      return Promise.reject({ error: 404 });
    }

    if (!Array.isArray(serializedRecord.relationships[relationship].data)) {
      return Promise.resolve();
    }

    const relData = (
      serializedRecord.relationships[relationship].data as Array<IResourceIdentifier>
    );
    serializedRecord.relationships[relationship].data = relData
        .filter((item) => !items.some((i) => i.id === item.id));

    const r = this.serializers[type].deserialize(serializedRecord);

    const idx = this.mockData[type].indexOf(record);

    if (idx !== -1) {
      this.mockData[type].splice(idx, 1, r);
    }

    this.mockDataById[type][r.id.toString()] = r;

    return Promise.resolve();
  }

  private serializeItems(items: Array<IResourceComplete>, fields: IFields) {
    const serializedItems = [];

    for (let i = 0; i < items.length; i++) {
      const r = items[i];
      const serialized = this.serializers[r.type].serialize(r, fields);
      serializedItems.push(serialized);
    }

    return serializedItems;
  }

  private sortItems(items: Array<IResourceComplete>, sort: Array<string>) {
    if (!sort) { return items; }

    return items.sort((a, b) => {
      const results = sort
          .map((s) => this.sortCompare(a, b, s))
          .filter((r) => r !== 0);

      return results[0] || 0;
    });
  }

  private sortCompare(a: IResourceComplete, b: IResourceComplete, sort: string): number {
    const flipped = sort.substring(0, 1) === '-';
    const key = flipped ? sort.substring(1, sort.length) : sort;

    let result;
    if ('string' === typeof a[key]) {
      result = a[key].localeCompare(b[key]);
    } else {
      result = a[key] - b[key];
    }

    if (flipped) {
      result *= -1;
    }

    return result;
  }

  private filterItems(items: Array<IResourceComplete>, filters: IFilters): Array<IResourceComplete> {
    let totalItems = items;

    Object.keys(filters).forEach((f) => {
      let v = filters[f];

      if (v === 'null') {
        v = null;
      }

      totalItems = totalItems.filter((r) => {
        if (typeof r[f] === 'string') {
          return r[f] === v;
        }

        if (typeof r[f] === 'object') {
          return v ? r[f].id === v : !r[f];
        }

        try {
          const parsed = parseInt(v as string, 10);

          if (typeof r[f] === 'object') {
            return r[f].id === parsed;
          }

          return r[f] === parsed;
        } catch (e) {
          // Not a number
        }

        // No idea, throw it out.
        return false;
      });

    });

    return totalItems;
  }

  private loadIncludes(records: Array<any>, include: Array<string>, fields: IFields) {
    let includes: Array<IResourceComplete> = [];

    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const serialized = this.serializers[r.type].serialize(r);

      for (let k = 0; k < include.length; k++) {
        const includeKey = include[k];
        if (serialized.relationships && serialized.relationships[includeKey]) {
          const relationship = serialized.relationships[includeKey].data;
          const relationships = !Array.isArray(relationship)
              ? [relationship]
              : relationship;

          const completeRelationships = relationships.map((rel) => {
            return this.serializers[rel.type].serialize(
              this.mockDataById[rel.type][rel.id.toString()],
              fields,
            );
          }) as Array<IResourceComplete>;

          // Get full model
          includes = includes.concat(completeRelationships);
        }
      }
    }

    return uniqBy(includes, (r) => `${r.type}_${r.id}`);
  }
}
