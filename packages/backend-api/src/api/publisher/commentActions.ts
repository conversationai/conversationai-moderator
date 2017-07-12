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
import { commentActionSchema } from '../services/commentActions';
import { dataSchema, validateRequest } from '../util/validation';

export const STATUS_ACCEPTED = 'accepted';
export const STATUS_REJECTED = 'rejected';

const validateCommentActionRequest = validateRequest(dataSchema(commentActionSchema));

/**
 * Queues an approval or rejected action. Accepts array of comment ids, or a single comment id.
 */
export function queueMainAction(name: IKnownTasks): express.RequestHandler {
  return async ({ body }, res, next) => {
    try {
      const dataArray = Array.isArray(body.data) ? body.data : [body.data];

      for (const data of dataArray) {
        const { userId, commentId } = data;

        const parsedUserId = parseInt(userId, 10);
        const parsedCommentId = parseInt(commentId, 10);

        const isBatchAction = (dataArray.length > 1) ? true : false;
        await enqueue<ICommentActionData>(name, {
          commentId: parsedCommentId,
          userId: parsedUserId,
          isBatchAction,
        }, body.runImmediately || false);
      }

      res.json({ status: 'success' });
      next();
    } catch (e) {
      console.log(e)
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
