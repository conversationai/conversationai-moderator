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
  CommentScore,
  CommentSummaryScore,
  denormalizeCommentCountsForArticle,
  denormalizeCountsForComment,
  logger,
  MODERATION_ACTION_ACCEPT,
  MODERATION_ACTION_REJECT,
} from '@conversationai/moderator-backend-core';

import { addScore, approve, defer, highlight, reject, reset } from '../../pipeline/state';
import {
  getComment,
  getTag,
  getUser,
  resolveComment,
  resolveCommentAndFlags,
  resolveFlagsAndDenormalize,
} from './utils';

export interface ICommentActionData {
  commentId: number;
  userId?: number | null;
  isBatchAction: boolean;
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
export async function deferCommentsTask(data: IDeferCommentsData) {
  const user = await getUser(data.userId);
  const comment = await getComment(data.commentId);

  // update batch action
  logger.info('defer comment : ',  comment.id );
  await comment.set('isBatchResolved', data.isBatchAction).save();
  return defer(comment, user);
}

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
export async function highlightCommentsTask(data: IHighlightCommentsData)  {
  const user = await getUser(data.userId);
  const comment = await getComment(data.commentId);

  logger.info('highlight comment : ', comment.id);
  await comment.set('isBatchResolved', data.isBatchAction).save();
  return highlight(comment, user);
}

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
export async function tagCommentsTask(data: ITagCommentsData) {
  const user = await getUser(data.userId);
  const comment = await getComment(data.commentId);
  const tag = await getTag(data.tagId);

  logger.info(`Run tag comment process with comment id ${comment.id} and tag id ${tag.id}`);
  const commentScore = await addScore(comment, tag, user);
  logger.info('Comment Score added.');
  return commentScore;
}

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
export async function tagCommentSummaryScoresTask(data: ITagCommentsData) {
  const user = await getUser(data.userId);
  const comment = await getComment(data.commentId);
  const tag = await getTag(data.tagId);

  logger.info(`Run tag comment process with comment id ${comment.id} and tag id ${tag.id}`);

  await CommentSummaryScore.insertOrUpdate({
    commentId: comment.id,
    tagId: tag.id,
    score: 1,
    isConfirmed: true,
    confirmedUserId: user && user.id,
  });

  logger.info('Comment Summary Score added.');
}

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
export async function confirmCommentSummaryScoreTask(data: IConfirmSummaryScoreData) {
  const user = await getUser(data.userId);
  const { commentId, tagId } = data;

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
    isConfirmed: true,
    confirmedUserId: user && user.id,
  });
}

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
export async function rejectCommentSummaryScoreTask(data: IRejectSummaryScoreData) {
  await getUser(data.userId);
  const { commentId, tagId, userId } = data;

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
}

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
export async function resetCommentsTask(data: IResetCommentsData) {
  const user = await getUser(data.userId);
  const comment = await getComment(data.commentId);
  logger.info(`reset comment: ${comment.id}`);
  return reset(comment, user);
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
export async function acceptCommentsTask(data: IAcceptCommentsData) {
  const { commentId, userId, isBatchAction } = data;

  return resolveComment(
    commentId,
    userId || null,
    isBatchAction,
    MODERATION_ACTION_ACCEPT,
    approve,
  );
}

export async function acceptCommentsAndFlagsTask(data: ICommentActionData) {
  const { commentId, userId, isBatchAction } = data;

  return resolveCommentAndFlags(
    commentId,
    userId || null,
    isBatchAction,
    MODERATION_ACTION_ACCEPT,
    approve,
  );
}

export async function resolveFlagsTask(data: ICommentActionData) {
  const { commentId, userId } = data;

  return resolveFlagsAndDenormalize(
    commentId,
    userId ? userId : undefined,
  );
}

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
export async function rejectCommentsTask(data: IRejectCommentsData) {
  const { commentId, userId, isBatchAction } = data;

  return resolveComment(
    commentId,
    userId || null,
    isBatchAction,
    MODERATION_ACTION_REJECT,
    reject,
  );
}

export async function rejectCommentsAndFlagsTask(data: ICommentActionData) {
  const { commentId, userId, isBatchAction } = data;

  return resolveCommentAndFlags(
    commentId,
    userId || null,
    isBatchAction,
    MODERATION_ACTION_REJECT,
    reject,
  );
}

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
export async function resetTagTask(data: IResetTagData) {
  const { commentScoreId } = data;

  // Confirm Comment Score Exists
  const cs = await CommentScore.findById(commentScoreId);

  if (!cs) { return; }

  logger.info(`Reset tag for comment_score id: ${cs.id}`);

  return cs.update({
    isConfirmed: null,
  });
}

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
export async function confirmTagTask(data: IConfirmTagData) {
  const { commentScoreId, userId } = data;

  // Confirm Comment Score Exists
  const cs = await CommentScore.findById(commentScoreId);

  if (!cs) { return; }

  logger.info(`Confirm tag for comment_score id: ${cs.id}`);

  return cs.update({
    isConfirmed: true,
    confirmedUserId: userId,
  });
}

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
export async function rejectTagTask(data: IRejectTagData) {
  const { commentScoreId, userId } = data;

  const cs = await CommentScore.findById(commentScoreId);

  if (!cs) { return; }

  logger.info(`Reject tag for comment_score id: ${cs.id}`);

  return cs.update({
    isConfirmed: false,
    confirmedUserId: userId,
  });
}

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
export async function addTagTask(data: IAddTagData) {
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

  const comment = await cs.getComment();
  const article = await comment.getArticle();

  await denormalizeCountsForComment(comment);
  await denormalizeCommentCountsForArticle(article, false);

  return cs;
}

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
export async function removeTagTask(data: IRemoveTagData) {
  const { commentScoreId } = data;

  const cs = await CommentScore.findById(commentScoreId);

  if (!cs) {
    throw new Error(`Comment Score Not found, id: ${commentScoreId}`);
  }

  const comment = await cs.getComment();
  const article = await comment.getArticle();

  // Remove
  await CommentScore.destroy({
    where: {
      id: commentScoreId,
    },
  });

  await denormalizeCountsForComment(comment);
  await denormalizeCommentCountsForArticle(article, false);

  logger.info(`Remove comment score ${commentScoreId}`);

  return cs;
}
