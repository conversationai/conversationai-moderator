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

import {User} from '../../models';
import {
  CommentActions,
  enqueueAddTagTask,
  enqueueCommentAction,
  enqueueConfirmTagTask,
  enqueueRejectTagTask,
  enqueueRemoveTagTask,
  enqueueResetTagTask,
  enqueueScoreAction,
  ScoreActions,
} from '../../processing';
import { REPLY_SUCCESS } from '../constants';
import { dataSchema, validateRequest } from '../util/validation';

export const detailAddTagSchema = Joi.object({
  tagId: Joi.string().required(),
  annotationStart: Joi.number().required(),
  annotationEnd: Joi.number().greater(Joi.ref('annotationStart')).required(),
});

export const commentActionSchema = Joi.object({
  commentId: Joi.string().required(),
});

const validateCommentActionRequest = validateRequest(dataSchema(commentActionSchema));
const validateDetailRequest = (schema: Joi.Schema) => validateRequest(dataSchema(schema));

/**
 * Queues an accept, reject, defer or highlight action. Accepts array of comment ids, or a single comment id.
 */
export function queueMainAction(action: CommentActions): express.RequestHandler {
  return async ({ body, user }, res) => {
    const dataArray = Array.isArray(body.data) ? body.data : [body.data];
    const isBatchAction = (dataArray.length > 1);

    for (const data of dataArray) {
      const { commentId } = data;
      const parsedCommentId = parseInt(commentId, 10);
      await enqueueCommentAction(action, (user as User).id, parsedCommentId, isBatchAction, body.runImmediately);
    }

    res.json(REPLY_SUCCESS);
  };
}

/**
 * Queues an tag action. Accepts array of comment ids, or a single comment id.
 */
export function queueScoreCommentSummaryAction(action: ScoreActions): express.RequestHandler {
  return async ({ body, params, user }, res) => {
    const dataArray = Array.isArray(body.data) ? body.data : [body.data];
    const parsedTagId = parseInt(params.tagid, 10);

    for (const { commentId } of dataArray) {
      const parsedCommentId = parseInt(commentId, 10);
      await enqueueScoreAction(action, (user as User).id, parsedCommentId, parsedTagId, body.runImmediately);
    }

    res.json(REPLY_SUCCESS);
  };
}

/**
 * Queues an tag action. Accepts array of comment ids, or a single comment id.
 */
export function queueSingleScoreAction(action: ScoreActions): express.RequestHandler {
  return async ({ body, params, user }, res) => {
    const parsedCommentId = parseInt(params.commentid, 10);
    const parsedTagId = parseInt(params.tagid, 10);
    await enqueueScoreAction(action, (user as User).id, parsedCommentId, parsedTagId, body.runImmediately);
    res.json(REPLY_SUCCESS);
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
    queueScoreCommentSummaryAction('tagComments'),
  );

  router.post('/tagCommentSummaryScores/:tagid',
    validateCommentActionRequest,
    queueScoreCommentSummaryAction('tagCommentSummaryScores'),
  );

  router.post('/:commentid/tagCommentSummaryScores/:tagid/confirm',
    queueSingleScoreAction('confirmCommentSummaryScore'),
  );

  router.post('/:commentid/tagCommentSummaryScores/:tagid/reject',
    queueSingleScoreAction('rejectCommentSummaryScore'),
  );

  router.post('/:commentid/scores',
    validateDetailRequest(detailAddTagSchema),
    async ({ body, params, user }, res) => {
      await enqueueAddTagTask(
        parseInt(params.commentid, 10),
        parseInt(body.data.tagId, 10),
        (user as User).id,
        body.data.annotationStart,
        body.data.annotationEnd,
        body.runImmediately);

      res.json(REPLY_SUCCESS);
    },
  );

  router.post('/:commentid/scores/:commentscoreid/reset',
    async ({ body, params}, res) => {
      await enqueueResetTagTask(parseInt(params.commentscoreid, 10), body.runImmediately);
      res.json(REPLY_SUCCESS);
    },
  );

  router.post('/:commentid/scores/:commentscoreid/confirm',
    async ({ body, params, user}, res) => {
      await enqueueConfirmTagTask((user as User).id, parseInt(params.commentscoreid, 10), body.runImmediately);
      res.json(REPLY_SUCCESS);
    },
  );

  router.post('/:commentid/scores/:commentscoreid/reject',
    async ({ body, params, user}, res) => {
      await enqueueRejectTagTask((user as User).id, parseInt(params.commentscoreid, 10), body.runImmediately);
      res.json(REPLY_SUCCESS);
    },
  );

  router.delete('/:commentid/scores/:commentscoreid',
    async ({ body, params}, res) => {
      await enqueueRemoveTagTask(parseInt(params.commentscoreid, 10), body.runImmediately);
      res.json(REPLY_SUCCESS);
    },
  );

  return router;
}
