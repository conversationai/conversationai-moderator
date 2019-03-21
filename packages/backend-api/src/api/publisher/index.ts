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

import {
  Article,
  Decision,
  logger,
  sequelize,
} from '@conversationai/moderator-backend-core';
import {
  enqueue,
  IProcessTagAdditionData,
  IProcessTagRevocationData,
} from '@conversationai/moderator-backend-queue';
import * as JSONAPI from '@conversationai/moderator-jsonapi';
import * as express from 'express';
import * as Joi from 'joi';

import { REPLY_SUCCESS } from '../constants';
import { list } from '../util/SequelizeHandler';
import {
  articleSchema,
  articleUpdateSchema,
  commentSchema,
  revokeTagSchema,
  tagSchema,
} from './schema';

import { onlyServices } from '../util/permissions';
import { dataSchema, validateAndSendResponse, validateRequest } from '../util/validation';
import { mapArticles } from './articles';
import { createPublisherCommentActionsService } from './commentActions';
import { createComments, sendCommentsToScoringQueue } from './comments';

const validateDataSchema = (schema: Joi.Schema) => validateRequest(dataSchema(schema));

interface IIDMap {
  [key: string]: string;
}

const validateIDMapAndSendResponse = validateAndSendResponse<IIDMap>(
  Joi.object({
    arg: Joi.string(),
    value: Joi.string(),
  }).unknown().required(),
);

export function createPublisherService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  // Create new articles in OSMOD
  router.post('/articles',
    validateDataSchema(articleSchema),
    async (req, res, next) => {

      // Process posted article data
      const items = Array.isArray(req.body.data) ? req.body.data : [req.body.data];
      logger.info('Article(s) posted to publisher/articles: ', JSON.stringify(items));

      const results = await mapArticles(items);

      const data = results.reduce((sum, { article }) => {
        sum[article.get('sourceId')] = article.id.toString();

        return sum;
      }, {} as IIDMap);

      validateIDMapAndSendResponse(data, res, next);
    },
  );

  // Update existing articles in OSMOD
  router.patch('/articles/:sourceId',
    validateDataSchema(articleUpdateSchema),
    async ({ body, params: { sourceId } }, res, next) => {
      const article = await Article.findOne({
        where: {
          sourceId,
        },
      });

      if (article) {
        await article.update(body.data.attributes);

        res.json(REPLY_SUCCESS);
        next();
      } else {
        res.status(400).json({
          status: 'error',
          errors: [`Article not found by sourceId provided: ${sourceId}`],
        });
      }
    },
  );

  // Create new comments in OSMOD, if they don't already exist.
  router.post('/comments',
    validateDataSchema(commentSchema),
    async (req, res, next) => {
      try {
        // Process posted comment data
        const items = Array.isArray(req.body.data) ? req.body.data : [req.body.data];
        logger.info('Comment(s) posted to comments: ', JSON.stringify(items));

        // Create comments in database.
        const results = await createComments(items);

        // `null` for already existing, number for new.
        const newComments = results.filter((c) => !!c);

        // Send to scoring queue.
        await sendCommentsToScoringQueue(newComments);

        const data = results.reduce((sum, c) => {
          sum[c.get('sourceId')] = c.id.toString();

          return sum;
        }, {} as IIDMap);

        validateIDMapAndSendResponse(data, res, next);
      } catch (err) {
        res.status(400).json({
          status: 'error',
          errors: [err.message],
        });

        logger.error(`Error with comment posted to publisher/comments: ${err.message}`);

        return;
      }
    },
  );

  // Add tags, which are meta about comments such as a flag or recommendation.
  router.post('/comments/tags',
    validateDataSchema(tagSchema),
    async (req, res, next) => {
      const items: Array<IProcessTagAdditionData> = Array.isArray(req.body.data) ? req.body.data : [req.body.data];
      logger.info('Comment Tag(s) posted to comments/tags: ', JSON.stringify(items));

      for (const data of items) {
        await enqueue<IProcessTagAdditionData>('processTagAddition', data, req.body.runImmediately || false);
      }

      res.json(REPLY_SUCCESS);
      next();
    },
  );

  // Remove tags from comments.
  router.post('/comments/tags/revoke',
    validateDataSchema(revokeTagSchema),
    async (req, res, next) => {
      const items: Array<IProcessTagRevocationData> = Array.isArray(req.body.data) ? req.body.data : [req.body.data];
      logger.info('Comment Tag(s) revoked to comments/tags/revoke: ', JSON.stringify(items));

      for (const data of items) {
        await enqueue<IProcessTagRevocationData>('processTagRevocation', data, req.body.runImmediately || false);
      }

      res.json(REPLY_SUCCESS);
      next();
    },
  );

  router.get('/decisions',
    JSONAPI.handleGet(
      async (_, page, include, filters, sort, fields) => {
        const filtersSince = {
          ...filters,
          sentBackToPublisher: null,
          isCurrentDecision: true,
        };

        if (include.indexOf('comment') === -1) {
          include.push('comment');
        }

        return await list(
          'decisions',
          {
            page,
            include,
            filters: filtersSince,
            sort,
            fields,
          },
        );
      },
      JSONAPI.renderListResults,
      () => `/publisher/decisions`,
    ),
  );

  router.post('/decisions/confirm',
    validateDataSchema(Joi.string()),
    async (req, res, next) => {
      try {
        const { body } = req;
        const decisionIds = body.data.map((s: any) => parseInt(s, 10));

        await Decision.update({
          sentBackToPublisher: sequelize.fn('now'),
        }, {
          where: {
            id: {
              $in: decisionIds,
            },
          },
        });

        res.json(REPLY_SUCCESS);
        next();
      } catch (e) {
        if (e instanceof JSONAPI.NotFoundError) {
          res.status(404).send(e.message);
          next();
        } else {
          next(e);
        }
      }
    },
  );

  router.use('/commentActions', createPublisherCommentActionsService());

  return router;
}

export function createPublisherRouter(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.use('*', onlyServices);

  router.use('/', createPublisherService());

  return router;
}
