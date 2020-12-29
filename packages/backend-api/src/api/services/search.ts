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
import * as Joi from 'joi';
import { QueryTypes } from 'sequelize';

import { logger } from '../../logger';
import { sequelize } from '../../sequelize';
import { sortCommentIds } from '../util/sortCommentIds';
import { validateAndSendResponse } from '../util/validation';

const MINIMUM_QUERY_LENGTH = 3;

type ISearchResponse = Array<string>;

const validateSearchAndSendResponse = validateAndSendResponse<ISearchResponse>(
  Joi.array().items(Joi.string()),
);

export function createSearchService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.get('/', async (req, res, next) => {
    try {
      const term = req.query.term as string;
      const articleId = req.query.articleId as string;
      const searchByAuthor = req.query.searchByAuthor as string;

      let ids: Array<number> = [];
      let results;

      if (term.length >= MINIMUM_QUERY_LENGTH) {
        if (searchByAuthor === 'true') {
          const iffyTerm = `%${term}%`;
          results = await sequelize.query(
            `SELECT id ` +
            `FROM comments ` +
            'WHERE comments.authorSourceId=:term ' +
            'OR JSON_SEARCH(LOWER(comments.author), "all", LOWER(:iffyTerm), NULL, "$.name") IS NOT NULL ' +
            'LIMIT 100',
            {
              replacements: {
                iffyTerm,
                term,
              },
              type: QueryTypes.SELECT,
            },
          );
        } else if (articleId) {
          results = await sequelize.query(
            `SELECT id, MATCH(text) AGAINST (:term) as relevance ` +
            `FROM comments ` +
            'WHERE comments.articleId = :articleId ' +
            `AND MATCH(text) AGAINST (:term) ` +
            'ORDER BY relevance DESC ' +
            'LIMIT 100',
            {
              replacements: {
                term,
                articleId,
              },
              type: QueryTypes.SELECT,
            },
          );
        } else {
          results = await sequelize.query(
            `SELECT id, MATCH(text) AGAINST (:term) as relevance ` +
            `FROM comments WHERE MATCH(text) AGAINST (:term) ` +
            'ORDER BY relevance DESC ' +
            'LIMIT 100',
            {
              replacements: {
                term,
              },
              type: QueryTypes.SELECT,
            },
          );
        }
      }

      ids = results ? results.map((r: any) => r.id) : [];

      const sortQuery = req.query.sort as string;
      const sortOrder = sortQuery ? sortQuery.split(',') : null;

      // No sort order is specified, defaults to relevance
      if (sortOrder == null) {
        validateSearchAndSendResponse(
          ids.map((i) => i.toString()),
          res,
          next,
        );
      } else {
        const sortedIds = await sortCommentIds(
          ids,
          sortOrder,
        );

        validateSearchAndSendResponse(
          sortedIds.map((i) => i.toString()),
          res,
          next,
        );
      }
    } catch (e) {
      logger.error(`Error with request posted to /services/search: ${e.message}`);
      res.status(400).json({ status: 'error', errors: 'Search request not completed'});

      return;
    }
  });

  return router;
}
