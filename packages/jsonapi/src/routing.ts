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

import * as express from 'express';
import { cloneDeep, isObject, isString, mapValues, merge } from 'lodash';
import * as qs from 'qs';
import { IPagingMeta } from './rendering';
const { encode } = require('he');

import {
  IRendererFunction,
  renderDocument,
  renderItemResult,
  renderListResults,
  renderRelationshipResult,
} from './rendering';

import {
  IDeleteHandlerFunction,
  IGetHandlerFunction,
  IModelHandler,
  IPostHandlerFunction,
} from './shared';

import {
  IListDetails,
  IPagingParams,
} from './types';

export class NotFoundError extends Error {

}

const defaultPaging = {
  limit: 5,
  offset: 0,
};

function safelyEncodeStructure(structure: any): any {
  if (Array.isArray(structure)) {
    return structure.map(safelyEncodeStructure);
  } else if (isObject(structure)) {
    return Object.keys(structure).reduce((sum, key) => {
      const value = structure[key];
      sum[encode(key)] = safelyEncodeStructure(value);

      return sum;
    }, {} as any);
  } else if (isString(structure)) {
    return encode(structure);
  } else {
    return structure;
  }
}

function destringifyBooleans(filters: any): any {
  return mapValues(filters, (val) => {
    if (isObject(val) && !Array.isArray(val)) {
      return destringifyBooleans(val);
    }

    if (val === 'true') {
      return true;
    }

    if (val === 'false') {
      return false;
    }

    if (val === 'null') {
      return null;
    }

    return val;
  });
}

export function handleGet(
  handler: IGetHandlerFunction,
  renderer: IRendererFunction,
  prefixGetter: (req: any) => string,
): express.RequestHandler {
  return async (req, res, next) => {
    const { query: { page, include, filter, sort, fields } } = req;

    const paging = {
      ...defaultPaging,
      ...(page && page.limit
          ? { limit: parseInt(page.limit, 10) }
          : {}),
      ...(page && page.offset
          ? { offset: parseInt(page.offset, 10) }
          : {}),
    } as IPagingParams;

    const includes = include
        ? Array.isArray(include) ? include : include.split(',')
        : [];

    const filters = destringifyBooleans(filter || {});

    const sortData = sort ? sort.split(',') : null;

    const fieldData = Object.keys(fields || {}).reduce((sum, modelName) => {
      sum[modelName] = sum[modelName]
          ? Array.isArray(sum[modelName]) ? sum[modelName] : sum[modelName].split(',')
          : [];

      return sum;
    }, fields || {});

    try {
      const data = await handler(req, paging, includes, filters, sortData, fieldData);

      const contents = renderer(data);

      const listData = (data as IListDetails);

      if (typeof listData.totalItems !== 'undefined') {
        const cleanedQuery = safelyEncodeStructure(req.query);
        // Don't forward token.
        delete cleanedQuery.token;

        const apiPrefix = prefixGetter(req);

        contents.extra = merge(
          contents.extra,
          generatePagingInformation(listData, apiPrefix, cleanedQuery, paging),
        );
      }

      const document = renderDocument(contents);

      res.status(200).json(document);
      next();
    } catch (e) {
      if (e instanceof NotFoundError) {
        res.status(404).send(e.message);
      } else if (e.error) {
        res.status(e.error).send(e.message || '');
      } else {
        next(e);
      }
    }
  };
}

function generatePagingInformation(listData: any, apiPrefix: string, cleanedQuery: any, paging: any): any {
  let firstPath = null;
  let lastPath = null;
  let nextPath = null;
  let prevPath = null;

  if (paging.limit !== 0) {
    const firstQuery = cloneDeep(cleanedQuery);
    firstQuery.page = firstQuery.page || {};
    firstQuery.page.offset = 0;
    firstPath = qs.stringify(firstQuery, { encode: false });

    const lastQuery = cloneDeep(cleanedQuery);
    lastQuery.page = firstQuery.page || {};
    const lastPageOffset = Math.floor(listData.totalItems / paging.limit) * paging.limit;
    lastQuery.page.offset = lastPageOffset;
    lastPath = (paging.limit < 0)
        ? firstPath
        : qs.stringify(lastQuery, { encode: false });

    const nextQuery = cloneDeep(cleanedQuery);
    nextQuery.page = firstQuery.page || {};
    nextQuery.page.offset = paging.offset + paging.limit;
    nextPath = (paging.limit < 0) || (nextQuery.page.offset > lastPageOffset)
        ? null
        : qs.stringify(nextQuery, { encode: false });

    const prevQuery = cloneDeep(cleanedQuery);
    prevQuery.page = firstQuery.page || {};
    prevQuery.page.offset = paging.offset - paging.limit;
    prevPath = (paging.limit < 0) || (prevQuery.page.offset < 0)
        ? null
        : qs.stringify(prevQuery, { encode: false });
  }

  const pagingMeta = {
    offset: paging.offset,
    limit: paging.limit,
    total: listData.totalItems,
    links: {
      first: firstPath && `${apiPrefix}?${firstPath}`,
      last: lastPath && `${apiPrefix}?${lastPath}`,
      prev: prevPath && `${apiPrefix}?${prevPath}`,
      next: nextPath && `${apiPrefix}?${nextPath}`,
    },
  } as IPagingMeta;

  return {
    meta: {
      page: pagingMeta,
    },
  };
}

function handlePost(handler: IPostHandlerFunction, successStatus: number, renderer?: IRendererFunction): express.RequestHandler {
  return async (req, res, next) => {
    try {
      const data = await handler(req);

      res.status(successStatus);

      if (renderer) {
        const contents = renderer(data);
        const document = renderDocument(contents);
        res.json(document);
      }

      res.end();

      next();
    } catch (e) {
      if (e.error) {
        res.status(e.error).send(e.message || '');
      } else {
        next(e);
      }
    }
  };
}

function handleDelete(handler: IDeleteHandlerFunction, successStatus: number): express.RequestHandler {
  return async (req, res, next) => {
    try {
      await handler(req);

      res.status(successStatus).end();
      next();
    } catch (e) {
      if (e.error) {
        res.status(e.error).send(e.message || '');
      } else {
        next(e);
      }
    }
  };
}

function handlePatch(handler: IPostHandlerFunction, successStatus: number, renderer?: IRendererFunction): express.RequestHandler {
  return async (req, res, next) => {
    try {
      const data = await handler(req);

      res.status(successStatus);

      if (renderer) {
        const contents = renderer(data);
        const document = renderDocument(contents);
        res.json(document);
      }

      res.end();

      next();
    } catch (e) {
      if (e.error) {
        res.status(e.error).send(e.message || '');
        next();
      } else {
        next(e);
      }
    }
  };
}

export function createModelRouter(type: string, handler: IModelHandler, prefix: string): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  // List
  router.get(
    '/',
    handleGet(
      (_, paging, include, filters, sort, fields) => (
        handler.list(type, {
          page: paging,
          include,
          filters,
          sort,
          fields,
        })
      ),
      renderListResults,
      () => `${prefix}/${type}`,
    ),
  );

  // Get Single
  router.get(
    '/:id',
    handleGet(
      ({ params: { id } }, _, include, __, ___, fields) => (
        handler.get(type, id, {
          include,
          fields,
        })
      ),
      renderItemResult,
      () => `${prefix}/${type}`,
    ),
  );

  // Get Related List
  router.get(
    '/:id/:relationship',
    handleGet(
      (
        {
          params: { id, relationship },
        },
        paging,
        include,
        filters,
        sort,
        fields,
      ) => (
        handler.listRelationships(type, id, relationship, {
          page: paging,
          include,
          filters,
          sort,
          fields,
        })
      ),
      renderRelationshipResult,
      ({ params: { id, relationship }}) => (
        `${prefix}/${type}/${id}/${relationship}`
      ),
    ),
  );

  // Get Relationships List
  router.get(
    '/:id/relationships/:relationship',
    handleGet(
      (
        {
          params: { id, relationship },
        },
        paging,
        include,
        filters,
        sort,
        fields,
      ) => (
        handler.listRelationships(type, id, relationship, {
          page: paging,
          include,
          filters,
          sort,
          fields,
        })
      ),
      renderRelationshipResult,
      ({ params: { id, relationship }}) => (
        `${prefix}/${type}/${id}/relationships/${relationship}`
      ),
    ),
  );

  // Create
  router.post('/', handlePost(({ body: { data } }) => (
    handler.create(type, data)
  ), 201, renderItemResult));

  // Create Relationships
  router.post('/:id/relationships/:relationship', handlePost(({ body: { data }, params: { id, relationship } }) => (
    handler.addRelationships(type, id, relationship, data)
  ), 204));

  // Update
  router.patch('/:id', handlePatch(({ body: { data }, params: { id } }) => (
    handler.update(type, id, data)
  ), 200, renderItemResult));

  // Update Relationships
  router.patch('/:id/relationships/:relationship', handlePatch(({ body: { data }, params: { id, relationship } }) => (
    handler.updateRelationships(type, id, relationship, data)
  ), 204));

  // Delete
  router.delete('/:id', handleDelete(({ params: { id } }) => (
    handler.destroy(type, id)
  ), 204));

  // Delete Relationships
  router.delete('/:id/relationships/:relationship', handleDelete(({ body: { data }, params: { id, relationship } }) => (
    handler.destroyRelationships(type, id, relationship, data)
  ), 204));

  return router;
}
