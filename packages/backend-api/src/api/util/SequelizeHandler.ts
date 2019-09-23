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

import * as Bluebird from 'bluebird';
import { isObject, isString, uniq, uniqWith } from 'lodash';

import { byType } from '../../models';
import {
  IFilters,
  IItemDetails,
  IListDetails,
  INewResource,
  IParams,
  IResourceComplete,
  IResourceID,
  IResourceIdentifier,
  IStatusError,
  Serializer,
} from '../jsonapi';
import { byType as serializersClassesByType } from './serializers';

const EXCLUDED_ATTRIBUTES_WITHOUT_EXTRA: Array<string> = [];
const EXCLUDED_ATTRIBUTES = [...EXCLUDED_ATTRIBUTES_WITHOUT_EXTRA, 'extra'];

interface ISerializersByType {
  [key: string]: Serializer;
}

// Create a lookup of serializers by table/model name.
const serializerNames = Object.keys(serializersClassesByType);
const serializersByType: ISerializersByType = serializerNames
    .reduce((sum, key) => {
      sum[key] = new serializersClassesByType[key](`/rest/${key}`);

      return sum;
    }, {} as ISerializersByType);

export async function sort(
  type: string,
  ids: Array<number>,
  sort: Array<string>,
): Promise<Array<number>> {
  const model = byType[type];

  const filters = {
    id: {
      $in: ids,
    },
  } as IFilters;

  const { currentModelFilters, relationshipFilters } = splitFilters(filters, model);

  const order = buildOrder(sort || [], model);

  const items: any = await model.findAll({
    where: currentModelFilters,
    order,
    attributes: ['id'],
    include: includesForModel(model, [], relationshipFilters),
  });

  return items.map((item: any) => item.id);
}

export async function list<T extends any>(
  type: string,
  params: IParams,
  getter?: (params: any) => Promise<Array<T>>,
  counter?: (params: any) => Promise<number>,
): Promise<IListDetails> {
  const model = byType[type];
  const { page, include, filters, sort, fields } = params;
  const modelFields = (fields && fields[type]) || [];

  const { currentModelFilters, relationshipFilters } = splitFilters(filters, model);

  const order = buildOrder(sort || [], model);
  const { offset } = page;
  let { limit } = page;

  if (typeof limit !== 'undefined' && limit < 0) {
    limit = undefined;
  }

  let findPromise;
  if (limit === 0) {
    findPromise = Promise.resolve([]);
  } else {
    const getterMethod = getter || model.findAll.bind(model);

    let excludedFields = modelFields.indexOf('extra') !== -1 ? EXCLUDED_ATTRIBUTES_WITHOUT_EXTRA : EXCLUDED_ATTRIBUTES;
    const requestedExcluded = modelFields
        .filter((f) => f.substring(0, 1) === '-')
        .map((f) => f.substring(1, f.length));

    excludedFields = excludedFields.concat(requestedExcluded);

    const attrs = {
      exclude: excludedFields,
    };

    findPromise = getterMethod({
      where: currentModelFilters,
      order,
      limit,
      offset,
      attributes: attrs,
      include: includesForModel(model, include, relationshipFilters),
    });
  }

  let countPromise;
  if (typeof limit === 'undefined') {
    countPromise = Promise.resolve(undefined);
  } else {
    countPromise = counter
        ? counter({
          where: currentModelFilters,
        })
        : model.count({
          where: currentModelFilters,
          include: includesForCount(model, relationshipFilters),
        });
  }

  const [rows, itemCount] = await Promise.all([
    findPromise,
    countPromise,
  ]);

  const totalItems = ('undefined' === typeof itemCount) ? rows.length : itemCount;

  const pageItems = await Bluebird.mapSeries(rows, (m) => {
    return serializeRow(m, model['associations'], fields, include);
  });

  const includes = pullOutIncludes(rows, model['associations'], include);

  return {
    totalItems,
    pageItems,
    includes: serializeIncludes(includes, fields),
  };
}

export async function get(
  type: string,
  id: IResourceID, { include, fields }: IParams,
): Promise<IItemDetails | IStatusError | void> {
  const model = byType[type];

  let row;
  try {
    row = await model.findById(id, {
      include: includesForModel(model, include),
      attributes: { exclude: fields['extra'] ? EXCLUDED_ATTRIBUTES_WITHOUT_EXTRA : EXCLUDED_ATTRIBUTES },
    });
  } catch (e) {
    return Promise.reject({ error: 404 });
  }

  if (!row) { return Promise.reject({ error: 404 }); }

  const serializedRow = await serializeRow(row, model['associations'], fields, include);

  const includes = pullOutIncludes([row], model['associations'], include);

  return {
    item: serializedRow,
    includes: serializeIncludes(includes, fields),
  };
}

export async function listRelationships(
  type: string,
  id: IResourceID,
  relationship: string,
  { page, include, filters, sort, fields }: IParams,
): Promise<IItemDetails | IListDetails | void> {
  const model = byType[type];
  const relConfig = model['associations'][relationship];
  const modelFields = (fields && fields[relationship]) || [];

  if (!relConfig) {
    return Promise.reject({ error: 404 });
  }

  const accessors = relConfig['accessors'];
  const targetModel = relConfig.target;

  let modelInstance;
  try {
    modelInstance = await model.findById(id, {
      attributes: { exclude: fields['extra'] ? EXCLUDED_ATTRIBUTES_WITHOUT_EXTRA : EXCLUDED_ATTRIBUTES },
    });
  } catch (e) {
    return Promise.reject({ error: 404 });
  }

  const { currentModelFilters, relationshipFilters } = splitFilters(filters, model);

  const where = currentModelFilters;
  const order = buildOrder(sort || [], model);

  const getMethod = accessors['get'];
  const countMethod = accessors['count'];

  let excludedFields = modelFields.indexOf('extra') !== -1
      ? EXCLUDED_ATTRIBUTES_WITHOUT_EXTRA
      : EXCLUDED_ATTRIBUTES;

  const requestedExcluded = modelFields
      .filter((f) => f.substring(0, 1) === '-')
      .map((f) => f.substring(1, f.length));

  excludedFields = excludedFields.concat(requestedExcluded);

  const attrs = {
    exclude: excludedFields,
  };

  if (relConfig.isMultiAssociation) {
    const { offset } = page;
    let { limit } = page;

    if (typeof limit !== 'undefined' && limit < 0) {
      limit = undefined;
    }

    let findPromise;
    if (limit === 0) {
      findPromise = Promise.resolve([]);
    } else {
      findPromise = modelInstance[getMethod].call(modelInstance, {
        where,
        order,
        limit,
        offset,
        include: includesForModel(targetModel, include, relationshipFilters),
        attributes: attrs,
      });
    }

    let countPromise;
    if (typeof limit === 'undefined') {
      countPromise = Promise.resolve(undefined);
    } else {
      countPromise = modelInstance[countMethod].call(modelInstance, { where });
    }

    const [rows, itemCount] = await Promise.all([
      findPromise,
      countPromise,
    ]);

    const totalItems = ('undefined' === typeof itemCount) ? rows.length : itemCount;

    const pageItems = await Bluebird.mapSeries(rows, (m) => {
      return serializeRow(m, targetModel.associations, fields, include);
    });

    const includes = pullOutIncludes(rows, targetModel.associations, include);

    return {
      totalItems,
      pageItems,
      includes: serializeIncludes(includes, fields),
    };
  } else {
    const row = await modelInstance[getMethod].call(modelInstance, {
      include: includesForModel(targetModel, include),
      attributes: attrs,
    });

    const serializedRow = await serializeRow(row, targetModel.associations, fields, include);

    const includes = pullOutIncludes([serializedRow], targetModel.associations, include);

    return {
      item: serializedRow,
      includes: serializeIncludes(includes, fields),
    };
  }
}

export async function create(
  type: string,
  data: INewResource,
): Promise<IItemDetails> {
  const model = byType[type];
  const modelInstance = await model.create(data.attributes);
  const serializedModel = await serializeRow(modelInstance, model['associations'], null, null);

  return {
    item: serializedModel,
  };
}

export async function addRelationships(
  type: string,
  id: IResourceID,
  relationship: string,
  data: Array<IResourceIdentifier>,
): Promise<void> {
  const model = byType[type];
  const relConfig = model['associations'][relationship];

  if (!relConfig) {
    return Promise.reject({ error: 404 });
  }

  const accessors = relConfig['accessors'];
  const adder = accessors['addMultiple'];

  let modelInstance;
  try {
    modelInstance = await model.findById(id, {
      attributes: { exclude: EXCLUDED_ATTRIBUTES },
    });
  } catch (e) {
    return Promise.reject({ error: 404 });
  }

  const addAssociations = (data as Array<IResourceIdentifier>).map((d) => d.id);

  return modelInstance[adder].call(modelInstance, addAssociations);
}

export async function update(
  type: string,
  id: IResourceID,
  data: IResourceComplete,
): Promise<IItemDetails | void> {
  const model = byType[type];

  let modelInstance;
  try {
    modelInstance = await model.findById(id, {
      attributes: { EXCLUDED_ATTRIBUTES },
    });
  } catch (e) {
    return Promise.reject({ error: 404 });
  }

  const updatedInstance = await modelInstance.update(data.attributes);
  const serializedModel = await serializeRow(updatedInstance, model['associations'], null, null);

  return {
    item: serializedModel,
  };
}

export async function updateRelationships(
  type: string,
  id: IResourceID,
  relationship: string,
  data: IResourceIdentifier | Array<IResourceIdentifier>,
): Promise<void> {
  const model = byType[type];
  const relConfig = model['associations'][relationship];

  if (!relConfig) {
    return Promise.reject({ error: 404 });
  }

  const accessors = relConfig['accessors'];
  const setter = accessors['set'];

  let modelInstance;
  try {
    modelInstance = await model.findById(id, {
      attributes: { EXCLUDED_ATTRIBUTES },
    });
  } catch (e) {
    return Promise.reject({ error: 404 });
  }

  let newAssociation;

  if (relConfig.isMultiAssociation) {
    newAssociation = (data as Array<IResourceIdentifier>).map((d) => d.id);
  } else {
    newAssociation = (data as IResourceIdentifier).id;
  }

  return modelInstance[setter].call(modelInstance, newAssociation);
}

export async function destroy(type: string, id: string): Promise<void> {
  const model = byType[type];

  let modelInstance;
  try {
    modelInstance = await model.findById(id, {
      attributes: { EXCLUDED_ATTRIBUTES },
    });
  } catch (e) {
    return Promise.reject({ error: 404 });
  }

  return modelInstance.destroy();
}

export async function destroyRelationships(
  type: string,
  id: IResourceID,
  relationship: string,
  data: Array<IResourceIdentifier>,
): Promise<void> {
  const model = byType[type];
  const relConfig = model['associations'][relationship];

  if (!relConfig) {
    return Promise.reject({ error: 404 });
  }

  const accessors = relConfig['accessors'];
  const remover = accessors['removeMultiple'];

  let modelInstance;
  try {
    modelInstance = await model.findById(id, {
      attributes: { EXCLUDED_ATTRIBUTES },
    });
  } catch (e) {
    return Promise.reject({ error: 404 });
  }

  const removeAssociations = (data as Array<IResourceIdentifier>).map((d) => d.id);

  return modelInstance[remover].call(modelInstance, removeAssociations);
}

function buildOrder(sort: Array<string>, parentModel: any) {
  return sort.reduce((sum, sortBy) => {
    const direction = sortBy.substring(0, 1) === '-' ? 'DESC' : 'ASC';
    const key = (direction === 'DESC')
        ? sortBy.substring(1, sortBy.length)
        : sortBy;

    if (key.indexOf('.') === -1) {
      sum.push([key, direction]);
    } else {
      const [modelName, columnName] = key.split('.');
      const model = parentModel['associations'][modelName].target;

      sum.push([{ model, as: modelName }, columnName, direction]);
    }

    return sum;
  }, [] as Array<any>);
}

function splitFilters(filters: any, model: any) {
  const modelKeys = Object.keys(model.attributes);

  return Object.keys(filters || {}).reduce((sum, key) => {
    let value = filters[key];

    if (isObject(value) && !Array.isArray(value) && (modelKeys.indexOf(key) === -1)) {
      sum.relationshipFilters[key] = value;
    } else {
      /**
       * There is no way to ask Sequelize what an attribute's type is, except via
       * this incredibly suspicious "private" variable.
       *
       * If filtering by dates suddenly fails after a Sequelize update, this is
       * where you want to look :(
       *
       * -TR
       */
      if (model._dateAttributes.indexOf(key) !== -1) {
        function coerceStringToDate(str: string): Date {
          if (str.match(/[0-9\.]+/)) {
            const ts = parseFloat(str);

            return new Date(ts);
          }

          try {
            return new Date(str);
          } catch (e) {
            throw new Error(`Could not coerce ${str} to a Date`);
          }
        }

        if (isString(value)) {
          value = coerceStringToDate(value);
        } else if (isObject(value) && !Array.isArray(value)) {
          // aka, an object with keys

          value = Object.keys(value).reduce((acc, k) => {
            acc[k] = isString(value[k]) ? coerceStringToDate(value[k]) : value[k];

            return acc;
          }, {} as any);
        }
      }

      sum.currentModelFilters[key] = value;
    }

    return sum;
  }, {
    currentModelFilters: {},
    relationshipFilters: {},
  } as any);
}

function pullOutIncludes(rows: Array<any>, relationships: any, include?: Array<any>): Array<any> {
  const allIncludes = rows.reduce((includes, row) => {
    Object.keys(relationships).forEach((key) => {
      if (row[key] && include && (include.indexOf(key) !== -1)) {
        if (Array.isArray(row[key])) {
          includes = includes.concat(row[key]);
        } else {
          includes.push(row[key]);
        }
      }
    });

    return includes;
  }, []);

  // Only return 1 of each appearance of a included model
  return uniqWith(allIncludes, (a: any, b: any) => (a.id === b.id) && (a.Model === b.Model));
}

function serializeIncludes(includes: Array<any>, fields: any) {
  return includes.map((modelInstance) => {
    const data = modelInstance.toJSON();
    data['type'] = nameOfModel(modelInstance.Model);

    return serializersByType[data['type']].serialize(data, fields);
  });
}

async function serializeRow(row: any, relationships: any, fields: any, include?: any): Promise<IResourceComplete> {
  const type = nameOfModel(row.Model);

  if (!type) {
    throw new Error('Could not find a name for model');
  }

  const data = row.toJSON();

  if (data['extra']) {
    data['extra'] = JSON.parse(data['extra']);
  }

  if (data['flagsSummary']) {
    data['flagsSummary'] = JSON.parse(data['flagsSummary']);
  }

  const rels = Object.keys(relationships).map((key) => {
    if (relationships[key].isMultiAssociation) {
      const isRequested = include && include.indexOf(key) !== -1;

      if (isRequested) {
        return { key, value: row[key] && row[key].map(toIdentifier) };
      } else {
        return { key, value: undefined };
      }
    } else {
      return { key, value: row[key] && toIdentifier(row[key]) };
    }
  });

  rels.forEach(({ key, value }) => {
    if (typeof value !== 'undefined') {
      data[key] = value;
    } else {
      delete data[key];
    }
  });

  return serializersByType[type].serialize(data, fields);
}

function nameOfModel(modelClass: any) {
  return Object.keys(byType)
      .find((name) => byType[name] === modelClass);
}

function toIdentifier(modelInstance: any) {
  return {
    id: modelInstance.id,
    type: nameOfModel(modelInstance.Model),
  };
}

function includesForKeys(model: any, allKeys?: Array<string>, relationshipFilters?: any) {
  return (allKeys || []).reduce((sum, name) => {
    sum.push({
      model: model['associations'][name].target,
      as: name,
      where: relationshipFilters && relationshipFilters[name] ? relationshipFilters[name] : undefined,
      attributes: { exclude: EXCLUDED_ATTRIBUTES },
    });

    return sum;
  }, [] as Array<any>);
}

function includesForCount(model: any, relationshipFilters?: any) {
  const allKeys = relationshipFilters ? Object.keys(relationshipFilters) : [];

  return includesForKeys(model, allKeys, relationshipFilters);
}

function includesForModel(model: any, include?: Array<string>, relationshipFilters?: any) {
  const allKeys = uniq([
    ...(include || []),
    ...(relationshipFilters ? Object.keys(relationshipFilters) : []),
  ]);

  return includesForKeys(model, allKeys, relationshipFilters);
}
