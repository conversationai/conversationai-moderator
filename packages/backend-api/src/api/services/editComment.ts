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

import { logger } from '../../logger';
import { Comment } from '../../models';
import { enqueueSendCommentForScoringTask } from '../../processing';
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
    async ({ body }, res) => {
      try {
        const { commentId, text, authorName, authorLocation } = body.data;
        const parsedCommentId = parseInt(commentId, 10);
        const comment = await Comment.findByPk(parsedCommentId);

        if (!comment) {
          res.status(404).json({ status: 'error', errors: 'comment not found' });
          return;
        }

        const author = {
          ...comment.author,
          name: authorName ? authorName : comment.author.name,
          location: authorLocation ? authorLocation : comment.author.location,
        };

        // update text and author fields of a comment
        await comment.update({
          text,
          author,
        });

        enqueueSendCommentForScoringTask(commentId);
      } catch (err) {
        logger.error('Edit Comment error: ', err.name, err.message);
        return;
      }

      res.status(200).json(REPLY_SUCCESS);
    },
  );

  return router;
}
