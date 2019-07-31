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
import { logger } from '@conversationai/moderator-backend-core';
import * as express from 'express';

import {
  enqueueCommentAction,
  CommentActions,
} from '../../processing';
import { REPLY_SUCCESS } from '../constants';
import { commentActionSchema } from '../services/commentActions';
import { dataSchema, validateRequest } from '../util/validation';

const validateCommentActionRequest = validateRequest(dataSchema(commentActionSchema));

/**
 * Queues an approval or rejected action. Accepts array of comment ids, or a single comment id.
 */
export function queueMainAction(name: CommentActions): express.RequestHandler {
  return async ({ body }, res, next) => {
    try {
      const dataArray = Array.isArray(body.data) ? body.data : [body.data];
      const isBatchAction = (dataArray.length > 1);

      for (const data of dataArray) {
        const { userId, commentId } = data;
        const parsedUserId = parseInt(userId, 10);
        const parsedCommentId = parseInt(commentId, 10);
        await enqueueCommentAction(name, parsedUserId, parsedCommentId, isBatchAction, body.runImmediately);
      }

      res.json(REPLY_SUCCESS);
      next();
    } catch (e) {
      logger.error(e);
    }
  };
}

export function createPublisherCommentActionsService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.post('/reset',
    validateCommentActionRequest,
    queueMainAction('resetComments'),
  );

  router.post('/approve',
    validateCommentActionRequest,
    queueMainAction('acceptComments'),
  );

  router.post('/highlight',
    validateCommentActionRequest,
    queueMainAction('highlightComments'),
  );

  router.post('/reject',
    validateCommentActionRequest,
    queueMainAction('rejectComments'),
  );

  router.post('/defer',
    validateCommentActionRequest,
    queueMainAction('deferComments'),
  );

  return router;
}
