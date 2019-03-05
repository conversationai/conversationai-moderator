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
  logger,
} from '@conversationai/moderator-backend-core';
import {
  enqueue,
  ICommentActionData,
  ICommentSummaryScoreData,
  IGenericTagData,
  IKnownTasks,
  ITagCommentsData,
} from '@conversationai/moderator-backend-queue';
import * as express from 'express';
import * as Joi from 'joi';
import { dataSchema, validateRequest } from '../util/validation';

export const detailAddTagSchema = Joi.object({
  tagId: Joi.string().required(),
  annotationStart: Joi.number().required(),
  annotationEnd: Joi.number().greater(Joi.ref('annotationStart')).required(),
});

export const commentActionSchema = Joi.object({
  userId: Joi.string().required(),
  commentId: Joi.string().required(),
});

const validateCommentActionRequest = validateRequest(dataSchema(commentActionSchema));
const validateDetailRequest = (schema: Joi.Schema) => validateRequest(dataSchema(schema));

/**
 * Queues an accept, reject, defer or highlight action. Accepts array of comment ids, or a single comment id.
 */
export function queueMainAction(name: IKnownTasks): express.RequestHandler {
  return async ({ body }, res, next) => {
    const dataArray = Array.isArray(body.data) ? body.data : [body.data];

    for (const data of dataArray) {
      const { userId, commentId } = data;

      const parsedUserId = parseInt(userId, 10);
      const parsedCommentId = parseInt(commentId, 10);

      const isBatchAction = (dataArray.length > 1);
      await enqueue<ICommentActionData>(name, {
        commentId: parsedCommentId,
        userId: parsedUserId,
        isBatchAction,
      }, body.runImmediately || false);
    }

    res.json({ status: 'success' });
    next();
  };
}

/**
 * Queues an tag action. Accepts array of comment ids, or a single comment id.
 */
export function queueTagAction(): express.RequestHandler {
  return async ({ body, params }, res, next) => {
    const dataArray = Array.isArray(body.data) ? body.data : [body.data];

    for (const { commentId, userId } of dataArray) {
      const parsedUserId = parseInt(userId, 10);
      const parsedCommentId = parseInt(commentId, 10);
      const parsedTagId = parseInt(params.tagid, 10);

      logger.info('start queue for comment id %s and tag id %s', commentId, params.tagid);

      await enqueue<ITagCommentsData>('tagComments', {
        commentId: parsedCommentId,
        tagId: parsedTagId,
        userId: parsedUserId,
        isBatchAction: false,
      }, body.runImmediately || false);
    }

    res.json({ status: 'success' });
    next();
  };
}

/**
 * Queues an tag action. Accepts array of comment ids, or a single comment id.
 */
export function queueTagCommentSummaryAction(): express.RequestHandler {
  return async ({ body, params }, res, next) => {
    const parsedTagId = parseInt(params.tagid, 10);
    const dataArray = Array.isArray(body.data) ? body.data : [body.data];

    for (const { commentId } of dataArray) {
      const parsedCommentId = parseInt(commentId, 10);
      logger.info('start queue for comment id %s and tag id %s', commentId, parsedTagId);

      await enqueue<ICommentSummaryScoreData>('tagCommentSummaryScores', {
        commentId: parsedCommentId,
        tagId: parsedTagId,
      }, body.runImmediately || false);
    }

    res.json({ status: 'success' });
    next();
  };
}

/**
 * Queues an tag action. Accepts array of comment ids, or a single comment id.
 */
export function queueScoreCommentSummaryAction(name: IKnownTasks): express.RequestHandler {
  return async ({ body, params }, res, next) => {
    logger.info('start queue for detail action for', name);

    await enqueue<ICommentSummaryScoreData>(name, {
      commentId: params.commentid,
      tagId: params.tagid,
    }, body.runImmediately || false);

    res.json({ status: 'success' });
    next();
  };
}

/**
 * Queues an tag action. Accepts array of comment ids, or a single comment id.
 */
export function queueScoreAction(name: IKnownTasks): express.RequestHandler {
  return async ({ body, params, user }, res, next) => {
    logger.info('start queue for detail action for', name);

    await enqueue<IGenericTagData>(name, {
      commentId: parseInt(params.commentid, 10),
      tagId: body.data ? parseInt(body.data.tagId, 10) : undefined,
      commentScoreId: params.commentscoreid ? params.commentscoreid : undefined,
      // TODO(ldixon): explore if user is actually always defined.
      userId: user!.id,
      annotationStart: body.data ? body.data.annotationStart : undefined,
      annotationEnd: body.data ? body.data.annotationEnd : undefined,
    }, body.runImmediately || false);

    res.json({ status: 'success' });
    next();
  };
}

export function createCommentActionsService(): express.Router {
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

  router.post('/approve-flags',
    validateCommentActionRequest,
    queueMainAction('acceptCommentsAndFlags'),
  );

  router.post('/resolve-flags',
    validateCommentActionRequest,
    queueMainAction('resolveFlags'),
  );


  router.post('/highlight',
    validateCommentActionRequest,
    queueMainAction('highlightComments'),
  );

  router.post('/reject',
    validateCommentActionRequest,
    queueMainAction('rejectComments'),
  );

  router.post('/reject-flags',
    validateCommentActionRequest,
    queueMainAction('rejectCommentsAndFlags'),
  );

  router.post('/defer',
    validateCommentActionRequest,
    queueMainAction('deferComments'),
  );

  router.post('/tag/:tagid',
    validateCommentActionRequest,
    queueTagAction(),
  );

  router.post('/tagCommentSummaryScores/:tagid',
    validateCommentActionRequest,
    queueTagCommentSummaryAction(),
  );

  router.post('/:commentid/tagCommentSummaryScores/:tagid/confirm',
    queueScoreCommentSummaryAction('confirmCommentSummaryScore'),
  );

  router.post('/:commentid/tagCommentSummaryScores/:tagid/reject',
    queueScoreCommentSummaryAction('rejectCommentSummaryScore'),
  );

  router.post('/:commentid/scores',
    validateDetailRequest(detailAddTagSchema),
    queueScoreAction('addTag'),
  );

  router.post('/:commentid/scores/:commentscoreid/reset',
    queueScoreAction('resetTag'),
  );

  router.post('/:commentid/scores/:commentscoreid/confirm',
    queueScoreAction('confirmTag'),
  );

  router.post('/:commentid/scores/:commentscoreid/reject',
    queueScoreAction('rejectTag'),
  );

  router.delete('/:commentid/scores/:commentscoreid',
    queueScoreAction('removeTag'),
  );

  return router;
}
