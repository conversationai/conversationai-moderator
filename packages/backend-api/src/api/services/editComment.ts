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
    Comment,
    logger,
    trigger,
} from '@conversationai/moderator-backend-core';
import * as express from 'express';
import * as Joi from 'joi';

import { enqueue, ISendCommentForScoringTaskData } from '../../processing';
import { REPLY_SUCCESS } from '../constants';
import { validateRequest } from '../util/validation';

const validateEditCommentRequest = validateRequest(Joi.object({
  data: Joi.object({
    commentId: Joi.string().required(),
    text: Joi.string(),
    authorName: Joi.string(),
    authorLocation: Joi.string(),
  }),
}));

/**
 * Service route for editing comment text.
 */
export function createEditCommentTextService(): express.Router {
  const router = express.Router({
      caseSensitive: true,
      mergeParams: true,
  });

  router.patch(
    '/',
    validateEditCommentRequest,
    async ({ body }, res, next) => {
      try {
        const { commentId, text, authorName, authorLocation } = body.data;
        const parsedCommentId = parseInt(commentId, 10);
        const comment = await Comment.findById(parsedCommentId);

        if (!comment) {
          res.status(404).json({ status: 'error', errors: 'comment not found' });

          return;
        }

        const author = JSON.parse(comment.get('author'));
        author.name =  authorName ? authorName : author.name;
        author.location = authorLocation ? authorLocation : author.location;

        // update text and author fields of a comment
        await comment.update({
          text,
          author,
        });

        // update comment scores
        await enqueue<ISendCommentForScoringTaskData>('sendCommentForScoring', {
          commentId: comment.id,
        }, false);

        // send edit event to publisher
        await trigger('api.publisher.editComment', {
          comment,
        });

      } catch (err) {
        logger.error('Edit Comment error: ', err.name, err.message);
        next(err);

        return;
      }

      res.status(200).json(REPLY_SUCCESS);
    },
  );

  return router;
}
