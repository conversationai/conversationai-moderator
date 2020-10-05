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

import { isObject, isString, uniq } from 'lodash';
import { Op } from 'sequelize';

import { byType } from '../../models';
import {
  IFilters,
} from '../jsonapi';

const EXCLUDED_ATTRIBUTES_WITHOUT_EXTRA: Array<string> = [];
const EXCLUDED_ATTRIBUTES = [...EXCLUDED_ATTRIBUTES_WITHOUT_EXTRA, 'extra'];

// TODO still used
export async function sort(
  type: string,
  ids: Array<number>,
  sort: Array<string>,
): Promise<Array<number>> {
  const model = byType[type];

  const filters = {
    id: {
      [Op.in]: ids,
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

function includesForModel(model: any, include?: Array<string>, relationshipFilters?: any) {
  const allKeys = uniq([
    ...(include || []),
    ...(relationshipFilters ? Object.keys(relationshipFilters) : []),
  ]);

  return includesForKeys(model, allKeys, relationshipFilters);
}
