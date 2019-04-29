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
  Comment,
  sendForScoring,
} from '@conversationai/moderator-backend-core';
import { handler, IQueueHandler } from '../util';

export interface ISendCommentForScoringTaskData {
  commentId: number;
}

/**
 * Worker task wrapper for sending a comment for scoring. Fetches the comment by id and
 * sends it off.
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('sendCommentForScoring', {
 *        commentId: 43
 *      })
 *      .save();
 *
 */
export const sendCommentForScoringTask: IQueueHandler<ISendCommentForScoringTaskData> = handler<ISendCommentForScoringTaskData>(
  async (data, logger) => {
    const { commentId } = data;

    logger.info(`sendCommentForScoringTask: Looking for ${commentId}`);

    const comment = await Comment.findById(commentId, {
      include: [
        Article,
        {
          model: Comment,
          as: 'replyTo',
        },
      ],
    });

    if (comment) {
      logger.info(`sendCommentForScoringTask: Found ${commentId}`);
    } else {
      throw new Error(`sendCommentForScoringTask: Comment not found, id: ${commentId}`);
    }

    return sendForScoring(comment);
  },
);
