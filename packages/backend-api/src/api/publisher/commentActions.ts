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
  enqueue,
  ICommentActionData,
  IKnownTasks,
} from '@conversationai/moderator-backend-queue';
import * as express from 'express';
import * as Joi from 'joi';
import { dataSchema, validateRequest } from '../util/validation';

export const STATUS_ACCEPTED = 'accepted';
export const STATUS_REJECTED = 'rejected';

const validateNumberSchema = validateRequest(dataSchema(Joi.number()));

/**
 * Queues an approval or rejected action. Accepts array of comment ids, or a single comment id.
 */
export function queueMainAction(name: IKnownTasks): express.RequestHandler {
  return async (req, res, next) => {
    const dataArray = Array.isArray(req.body.data) ? req.body.data : [req.body.data];

    for (const commentId of dataArray) {
      const parsedCommentId = parseInt(commentId, 10);

      await enqueue<ICommentActionData>(name, {
        commentId: parsedCommentId,
        userId: req.user ? req.user.get('id') : null,
        isBatchAction: false,
        autoConfirmDecision: true,
      }, req.body.runImmediately || false);
    }

    res.json({ status: 'success' });
    next();
  };
}

export function createPublisherCommentActionsService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.post('/reset',
    validateNumberSchema,
    queueMainAction('resetComments'),
  );

  router.post('/approve',
    validateNumberSchema,
    queueMainAction('acceptComments'),
  );

  router.post('/highlight',
    validateNumberSchema,
    queueMainAction('highlightComments'),
  );

  router.post('/reject',
    validateNumberSchema,
    queueMainAction('rejectComments'),
  );

  router.post('/defer',
    validateNumberSchema,
    queueMainAction('deferComments'),
  );

  return router;
}
