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
  CommentFlag,
  denormalizeCommentCountsForArticle,
  denormalizeCountsForComment,
} from '@conversationai/moderator-backend-core';
import { handler, IQueueHandler } from '../util';

export interface ICoreTagData {
  type: 'recommendation' | 'flag';
  sourceUserId: string;
  sourceCommentId: string;
}

export interface IProcessTagAdditionData extends ICoreTagData {
  extra?: any;
}

export interface IProcessTagRevocationData extends ICoreTagData {
}

function lookUpCommentBySourceId(sid: string ) {
  return Comment.findOne({
    where: { sourceId: sid },
    include: [Article],
  });
}

/**
 * Worker wrapper for tag addition processing
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('processTagAddition', {
 *        type: 'recommendation',
 *        sourceUserId: '1',
 *        sourceCommentId: '950',
 *        extra: {},
 *      })
 *      .save();
 *
 */
export const processTagAdditionTask: IQueueHandler<IProcessTagAdditionData> = handler<IProcessTagAdditionData>(async (data, logger) => {
  const { type, sourceCommentId, sourceUserId, extra } = data;

  logger.info('Process Tag Addition', JSON.stringify(data));

  try {
    const comment = await lookUpCommentBySourceId(sourceCommentId);

    if (!comment) {
      throw new Error(`Comment not found: sourceId = ${sourceCommentId}`);
    }

    const options = {
      where: {
        commentId: comment.id,
        sourceId: sourceUserId,
      },
      defaults: {
        label: type,
        commentId: comment.id,
        sourceId: sourceUserId,
        isResolved: false,
        extra: extra || null,
      },
    };

    const [instance, created] = await CommentFlag.findOrCreate(options);

    if (!created) {
      instance.set('extra', extra).save();
    }

    await denormalizeCountsForComment(comment);
    await denormalizeCommentCountsForArticle(await comment.getArticle(), false);
  } catch (err) { // Catching just for logging purposes
    logger.error('Catch Tag Addition', err);
    throw err;
  }
});

/**
 * Worker wrapper for tag addition processing
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('processTagRevocation', {
 *        type: 'recommendation',
 *        sourceUserId: '1',
 *        sourceCommentId: '950',
 *      })
 *      .save();
 *
 */
export const processTagRevocationTask = handler<IProcessTagRevocationData>(async (data, logger) => {
  const { sourceCommentId, sourceUserId } = data;

  logger.info('Process Tag Revocation', JSON.stringify(data));

  try {
    const comment = await lookUpCommentBySourceId(sourceCommentId);

    if (!comment) {
      throw new Error(`Comment not found: sourceId = ${sourceCommentId}`);
    }

    await CommentFlag.destroy({
      where: {
        commentId: comment.id,
        sourceId: sourceUserId,
      },
    });

    await denormalizeCountsForComment(comment);
    await denormalizeCommentCountsForArticle(await comment.getArticle(), false);
  }
  catch (err) { // Catching just for logging purposes
    logger.error('Catch Tag Revocation', err);
    throw err;
  }
});
