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
  addScore, approve,
  Article,
  Comment,
  CommentScore,
  CommentSummaryScore,
  defer,
  denormalizeCommentCountsForArticle,
  denormalizeCountsForComment,
  highlight,
  ICommentInstance,
  IResolution,
  reject,
  reset,
  Tag,
  User,
} from '@conversationai/moderator-backend-core';
import {
  handler,
  IJobLogger,
  IQueueHandler,
} from '../util';

export interface ICommentActionData {
  commentId: number;
  userId?: number | null;
  isBatchAction: boolean;
  autoConfirmDecision?: boolean;
}

export type IDeferCommentsData = ICommentActionData;
export type IHighlightCommentsData = ICommentActionData;
export type IResetCommentsData = ICommentActionData;
export type IAcceptCommentsData = ICommentActionData;
export type IRejectCommentsData = ICommentActionData;
export interface ITagCommentsData extends ICommentActionData {
  tagId: number;
}

export interface ICommentScore {
  commentScoreId: number;
  userId: number;
}

export interface IResetTagData {
  commentScoreId: number;
}

export interface ICommentSummaryScoreData {
  commentId: number;
  tagId: number;
}

export type IConfirmSummaryScoreData = {
  commentId: number;
  tagId: number;
  userId: number;
};
export type IRejectSummaryScoreData = {
  commentId: number;
  tagId: number;
  userId: number;
};

export type IConfirmTagData = ICommentScore;
export type IRejectTagData = ICommentScore;

export interface IGenericTagData {
  commentId: number;
  tagId?: number;
  userId?: number;
  commentScoreId?: number;
  annotationStart?: number;
  annotationEnd?: number;
}

export interface IAddTagData {
  commentId: number;
  tagId: number;
  userId: number;
  annotationStart?: number;
  annotationEnd?: number;
}

export interface IRemoveTagData {
  commentScoreId: number;
}

/**
 * Worker task wrapper for defering a comment. Fetches the comment by id and updates.
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('deferComments', {
 *        commentId: '43',
 *        userId: '1',
 *      })
 *      .save();
 *
 */
export const deferCommentsTask: IQueueHandler<IDeferCommentsData> = handler<IDeferCommentsData>(async (data, logger) => {
  const { commentId, userId, isBatchAction, autoConfirmDecision } = data;

  let user = null;

  if (typeof userId !== 'undefined' && userId !== null) {
    user = await User.findById(userId);

    if (!user) {
      throw new Error(`User not found, id: ${userId}`);
    }
  }

  const comment = await Comment.findOne({
    where: {
      id: commentId,
    },
    include: [
      { model: Article, required: true},
    ],
  });

  if (!comment) {
    throw new Error(`Comment not found, id: ${commentId}`);
  }

  // update batch action
  await comment.set('isBatchResolved', isBatchAction).save();

  logger.info('defer comment : ',  commentId );

  return defer(comment, user, !!autoConfirmDecision);
});

/**
 * Worker task wrapper for highlighting a comment. Fetches the comment by id and updates.
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('highlightComments', {
 *        commentId: 43
 *        userId: '1',
 *      })
 *      .save();
 *
 */
export const highlightCommentsTask = handler<IHighlightCommentsData>(async (data, logger) => {
  const { commentId, userId, isBatchAction, autoConfirmDecision } = data;

  let user = null;

  if (typeof userId !== 'undefined' && userId !== null) {
    user = await User.findById(userId);

    if (!user) {
      throw new Error(`User not found, id: ${userId}`);
    }
  }

  const comment = await Comment.findOne({
    where: {
      id: commentId,
    },
    include: [
      { model: Article, required: true},
    ],
  });

  if (!comment) {
    throw new Error(`Comment not found, id: ${commentId}`);
  }

  // update batch action
  await comment.set('isBatchResolved', isBatchAction).save();

  logger.info('highlight comment : ', commentId);

  return highlight(comment, user, !!autoConfirmDecision);
});

/**
 * Worker task wrapper for adding tagging a comment. Fetches the comment by id, fetches tag by ID and inserts.
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('tagComments', {
 *        commentId: 43,
 *        tagId: '1',
 *        userId: 2,
 *      })
 *      .save();
 *
 */
export const tagCommentsTask = handler<ITagCommentsData>(async (data, logger) => {
  const { commentId, tagId, userId } = data;

  logger.info(`Run tag comment process with comment id ${commentId} and tag id ${tagId}`);

  const comment = await Comment.findOne({
    where: {
      id: commentId,
    },
    include: [
      { model: Article, required: true},
    ],
  });

  if (!comment) {
    throw new Error(`Comment not found, id: ${commentId}`);
  }

  const tag = await Tag.findById(tagId);

  if (!tag) {
    throw new Error(`Tag not found, id: ${tagId}`);
  }

  let user = null;

  if (typeof userId !== 'undefined' && userId !== null) {
    user = await User.findById(userId);

    if (!user) {
      throw new Error(`User not found, id: ${userId}`);
    }
  }

  const commentScore = await addScore(comment, tag, user);

  logger.info('Comment Score added.');

  return commentScore;
});

/**
 * Worker task wrapper for adding tagging a comment. Fetches the comment by id, fetches tag by ID and inserts.
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('tagCommentSummaryScores', {
 *        commentId: 43,
 *        tagId: '1',
 *        userId: 2,
 *      })
 *      .save();
 *
 */
export const tagCommentSummaryScoresTask = handler<ITagCommentsData>(async (data, logger) => {
  const { commentId, tagId, userId } = data;

  logger.info(`Run tag comment process with comment id ${commentId} and tag id ${tagId}`);

  const comment = await Comment.findOne({
    where: {
      id: commentId,
    },
    include: [
      { model: Article, required: true},
    ],
  });

  if (!comment) {
    throw new Error(`Comment not found, id: ${commentId}`);
  }

  const tag = await Tag.findById(tagId);

  if (!tag) {
    throw new Error(`Tag not found, id: ${tagId}`);
  }

  let user = null;

  if (typeof userId !== 'undefined' && userId !== null) {
    user = await User.findById(userId);

    if (!user) {
      throw new Error(`User not found, id: ${userId}`);
    }
  }

  await CommentSummaryScore.insertOrUpdate({
    commentId: comment.id,
    tagId,
    score: 1,
    isConfirmed: true,
    confirmedUserId: userId,
  });

  logger.info('Comment Summary Score added.');

});

/**
 *
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('confirmCommentSummaryScoreTask', {
 *        commentId: '1',
 *        tagId: '1',
 *      })
 *      .save();
 *
 */
export const confirmCommentSummaryScoreTask = handler<IConfirmSummaryScoreData>(async (data, logger) => {
  const { commentId, tagId, userId } = data;

  let user = null;

  if (typeof userId !== 'undefined' && userId !== null) {
    user = await User.findById(userId);

    if (!user) {
      throw new Error(`User not found, id: ${userId}`);
    }
  }

  // Confirm Comment Score Exists
  const cs = await CommentSummaryScore.findOne({
    where: {
      commentId,
      tagId,
    },
  });

  // debugger

  if (!cs) { return; }

  logger.info(`Confirm tag for comment_score commentId: ${cs.get('commentId')}`);

  return cs.update({
    isConfirmed: true,
    confirmedUserId: userId,
  });
});

/**
 *
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('rejectCommentSummaryScoreTask', {
 *        commentId: '1',
 *        tagId: '1',
 *      })
 *      .save();
 *
 */
export const rejectCommentSummaryScoreTask = handler<IRejectSummaryScoreData>(async (data, logger) => {
  const { commentId, tagId, userId } = data;

  let user = null;

  if (typeof userId !== 'undefined' && userId !== null) {
    user = await User.findById(userId);

    if (!user) {
      throw new Error(`User not found, id: ${userId}`);
    }
  }

  // Confirm Comment Score Exists
  const cs = await CommentSummaryScore.findOne({
    where: {
      commentId,
      tagId,
    },
  });

  if (!cs) { return; }

  logger.info(`Confirm tag for comment_score commentId: ${cs.get('commentId')}`);

  return cs.update({
    isConfirmed: false,
    confirmedUserId: userId,
  });
});

/**
 * Worker task wrapper for resetting a comment.
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('resetComments', {
 *        commentId: 43,
 *        userId: '1',
 *      })
 *      .save();
 *
 */
export const resetCommentsTask = handler<IResetCommentsData>(async (data, logger) => {
  const { commentId, userId } = data;

  let user = null;

  if (typeof userId !== 'undefined' && userId !== null) {
    user = await User.findById(userId);

    if (!user) {
      throw new Error(`User not found, id: ${userId}`);
    }
  }

  const comment = await Comment.findOne({
    where: {
      id: commentId,
    },
    include: [
      { model: Article, required: true},
    ],
  });

  if (!comment) {
    throw new Error(`Comment not found, id: ${commentId}`);
  }

  logger.info(`reset comment: ${commentId}`);

  return reset(comment, user);
});

async function resolveComment(
  commentId: number,
  userId: number | null,
  logger: IJobLogger,
  isBatchAction: boolean,
  status: IResolution,
  domainFn: (comment: ICommentInstance, source: any, autoConfirm: boolean) => Promise<ICommentInstance>,
  autoConfirm: boolean,
): Promise<void> {

  let user = null;

  if (typeof userId !== 'undefined' && userId !== null) {
    user = await User.findById(userId);

    if (!user) {
      throw new Error(`User not found, id: ${userId}`);
    }
  }

  const comment = await Comment.findOne({
    where: {
      id: commentId,
    },
    include: [
      { model: Article, required: true},
    ],
  });

  if (!comment) {
    throw new Error(`Comment not found, id: ${commentId}`);
  }

  // update batch action
  await comment.set('isBatchResolved', isBatchAction).save();

  logger.info(`${status} comment: ${commentId}`);

  await domainFn(comment, user, autoConfirm);
}

/**
 * Worker task wrapper for approving a comment. Fetches the comment by id and updates.
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('acceptComments', {
 *        commentId: 43,
 *        userId: '1',
 *      })
 *      .save();
 *
 */
export const acceptCommentsTask = handler<IAcceptCommentsData>((data, logger) => {
  const { commentId, userId, isBatchAction, autoConfirmDecision } = data;

  return resolveComment(
    commentId,
    userId || null,
    logger,
    isBatchAction,
    'Accept',
    approve,
    !!autoConfirmDecision,
  );
});

/**
 * Worker task wrapper for rejecting a comment. Fetches the comment by id and updates.
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('rejectComments', {
 *        commentId: 43,
 *        userId: '1',
 *      })
 *      .save();
 *
 */
export const rejectCommentsTask = handler<IRejectCommentsData>((data, logger) => {
  const { commentId, userId, isBatchAction, autoConfirmDecision } = data;

  return resolveComment(
    commentId,
    userId || null,
    logger,
    isBatchAction,
    'Reject',
    reject,
    !!autoConfirmDecision,
  );
});

/**
 *
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('resetTag', {
 *        commentScoreId: '1',
 *      })
 *      .save();
 *
 */
export const resetTagTask = handler<IResetTagData>(async (data, logger) => {
  const { commentScoreId } = data;

  // Confirm Comment Score Exists
  const cs = await CommentScore.findById(commentScoreId);

  if (!cs) { return; }

  logger.info(`Reset tag for comment_score id: ${cs.id}`);

  return cs.update({
    isConfirmed: null,
  });
});

/**
 *
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('confirmTag', {
 *        commentScoreId: '1',
 *        userId: '1',
 *      })
 *      .save();
 *
 */
export const confirmTagTask = handler<IConfirmTagData>(async (data, logger) => {
  const { commentScoreId, userId } = data;

  // Confirm Comment Score Exists
  const cs = await CommentScore.findById(commentScoreId);

  if (!cs) { return; }

  logger.info(`Confirm tag for comment_score id: ${cs.id}`);

  return cs.update({
    isConfirmed: true,
    confirmedUserId: userId,
  });
});

/**
 *
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('rejectTag', {
 *        commentScoreId: '1',
 *        userId: '1',
 *      })
 *      .save();
 *
 */
export const rejectTagTask = handler<IRejectTagData>(async (data, logger) => {
  const { commentScoreId, userId } = data;

  const cs = await CommentScore.findById(commentScoreId);

  if (!cs) { return; }

  logger.info(`Reject tag for comment_score id: ${cs.id}`);

  return cs.update({
    isConfirmed: false,
    confirmedUserId: userId,
  });
});

/**
 *
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('addTag', {
 *        commentId: '1',
 *        tagId: '1',
 *        userId: '1',
 *        annotationStart: '120',
 *        annotationEnd: '130'
 *      })
 *      .save();
 *
 */
export const addTagTask = handler<IAddTagData>(async (data) => {
  const {
    commentId,
    tagId,
    userId,
    annotationStart,
    annotationEnd,
  } = data;

  const cs = await CommentScore.create({
    commentId,
    tagId,
    isConfirmed: true,
    confirmedUserId: userId,
    userId,
    annotationStart,
    annotationEnd,
    sourceType: 'Moderator',
    score: 1,
  });

  const comment = await (cs as any)['getComment']();
  const article = await (comment as any)['getArticle']();

  await denormalizeCountsForComment(comment);
  await denormalizeCommentCountsForArticle(article);

  return cs;
});

/**
 *
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('removeTag', {
 *        commentScoreId: '1'
 *      })
 *      .save();
 *
 */
export const removeTagTask = handler<IRemoveTagData>(async (data, logger) => {
  const { commentScoreId } = data;

  const cs = await CommentScore.findById(commentScoreId);

  if (!cs) {
    throw new Error(`Comment Score Not found, id: ${commentScoreId}`);
  }

  const comment = await (cs as any)['getComment']();
  const article = await (comment as any)['getArticle']();

  // Remove
  await CommentScore.destroy({
    where: {
      id: commentScoreId,
    },
  });

  await denormalizeCountsForComment(comment);
  await denormalizeCommentCountsForArticle(article);

  logger.info(`Remove comment score ${commentScoreId}`);

  return cs;
});
