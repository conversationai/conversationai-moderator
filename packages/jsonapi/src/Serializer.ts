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

import { isNumber, isString, mapValues, omit } from 'lodash';
import { toIdentifier } from './shared';
import {
  IAttributes,
  IFields,
  IRelationships,
  IResourceComplete,
} from './types';

function isSourceIdReference(key: string): boolean {
  // Matches sourceId or SourceId... seemed more readable than
  // the regex version.
  return key.endsWith('ourceId');
}

function isInternalIdReference(key: string): boolean {
  return key.endsWith('Id') && !isSourceIdReference(key);
}

export class Serializer {
  name: string;
  prefix: string;
  attributes: Array<string>;
  relationships: Array<string>;
  ignoredKeys: Array<string>;

  constructor(
    name: string,
    prefix: string,
    attributes?: Array<string> | null,
    relationships?: Array<string> | null,
    ignoredKeys?: Array<string> | null,
  ) {
    this.name = name;
    this.prefix = prefix;
    this.attributes = attributes || [];
    this.relationships = relationships || [];
    this.ignoredKeys = ['extra', 'createdAt'].concat(ignoredKeys || []);
  }

  deserialize(resource: IResourceComplete): any {
    const modelAttributesWithStringIds = resource.attributes;
    const modelAttributes = mapValues(modelAttributesWithStringIds, (value, key) => {
      return key && isInternalIdReference(key) && isString(value)
        ? parseInt(value, 10)
        : value;
    });

    return {
      ...omit(resource, ['relationships', 'attributes', 'links']),
      ...modelAttributes,
      ...(resource.relationships
          ? Object.keys(resource.relationships).reduce((sum, key) => {
              sum[key] = (resource.relationships as IRelationships)[key].data;

              return sum;
            }, {} as any)
          : {}),
    };
  }

  serialize(model: any, _?: IFields): IResourceComplete {
    const removeKeys = ['id', 'type'].concat(this.relationships);
    const modelAttributesWithIntIds = omit(model, removeKeys, this.ignoredKeys) as IAttributes;
    const modelAttributes = mapValues(modelAttributesWithIntIds, (value, key) => {
      return key && isInternalIdReference(key) && isNumber(value)
        ? value.toString()
        : value;
    });

    const relationships = this.relationships.map((name) => {
      const data = model[name];

      if (typeof data === 'number') {
        return { name, data };
      }

      const asIdentifiers = data &&
          (Array.isArray(data) ? data.map(toIdentifier) : toIdentifier(data));

      return { name, data: asIdentifiers };
    });

    const selfLink = `${this.prefix}/${model.id}`;

    let resource = {
      id: model.id && model.id.toString(),
      type: this.name,
      // attributes: fields && fields[this.name] ? pick(modelAttributes, fields[this.name]) : modelAttributes,
      attributes: modelAttributes,
      links: {
        self: selfLink,
      },
    };

    if (relationships.length) {
      const rels = relationships.reduce((sum, r) => {
        const relationshipData = {
          links: {
            self: `${selfLink}/relationships/${r.name}`,
            related: `${selfLink}/${r.name}`,
          },
          ...(typeof r.data !== 'number')
              ? (r.data ? { data: r.data || null } : undefined)
              : { meta: { total: r.data } },
        };

        sum[r.name] = relationshipData;

        return sum;
      }, {} as any);

      resource = {
        ...resource,
        // relationships: fields && fields[this.name] ? pick(rels, fields[this.name]) : rels,
        relationships: rels,
      };
    }

    return resource;
  }
}
