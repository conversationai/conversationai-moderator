/*
Copyright 2019 Google Inc.

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
} from '@conversationai/moderator-backend-core';

import {
  denormalizeCommentCountsForArticle,
  denormalizeCountsForComment,
} from '../../domain';
import { logger } from '../../logger';
import { enqueue, registerTask } from '../util';

interface IAddTagData {
  commentId: number;
  tagId: number;
  userId: number;
  annotationStart?: number;
  annotationEnd?: number;
}

interface ICommentScoreData {
  commentScoreId: number;
}

interface IUserCommentScoreData {
  commentScoreId: number;
  userId: number;
}

async function executeAddTagTask(data: IAddTagData) {
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

async function executeRemoveTagTask(data: ICommentScoreData) {
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

export async function executeResetTagTask(data: ICommentScoreData) {
  const { commentScoreId } = data;

  // Confirm Comment Score Exists
  const cs = await CommentScore.findById(commentScoreId);

  if (!cs) { return; }

  logger.info(`Reset tag for comment_score id: ${cs.id}`);

  return cs.update({
    isConfirmed: null,
  });
}

export async function executeConfirmTagTask(data: IUserCommentScoreData) {
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

export async function executeRejectTagTask(data: IUserCommentScoreData) {
  const { commentScoreId, userId } = data;

  const cs = await CommentScore.findById(commentScoreId);

  if (!cs) { return; }

  logger.info(`Reject tag for comment_score id: ${cs.id}`);

  return cs.update({
    isConfirmed: false,
    confirmedUserId: userId,
  });
}

registerTask<IAddTagData>('addTag', executeAddTagTask);
registerTask<ICommentScoreData>('removeTag', executeRemoveTagTask);
registerTask<ICommentScoreData>('resetTag', executeResetTagTask);
registerTask<IUserCommentScoreData>('confirmTag', executeConfirmTagTask);
registerTask<IUserCommentScoreData>('rejectTag', executeRejectTagTask);

export async function enqueueAddTagTask(
  commentId: number,
  tagId: number,
  userId: number,
  annotationStart: number,
  annotationEnd: number,
  runImmediately: boolean,
) {
  await enqueue<IAddTagData>('addTag', {commentId, tagId, userId, annotationStart, annotationEnd}, runImmediately);
}

export async function enqueueRemoveTagTask(commentScoreId: number, runImmediately: boolean) {
  await enqueue<ICommentScoreData>('removeTag', {commentScoreId}, runImmediately);
}

export async function enqueueResetTagTask(commentScoreId: number, runImmediately: boolean) {
  await enqueue<ICommentScoreData>('resetTag', {commentScoreId}, runImmediately);
}

export async function enqueueConfirmTagTask(userId: number, commentScoreId: number, runImmediately: boolean) {
  await enqueue<IUserCommentScoreData>('confirmTag', {commentScoreId, userId}, runImmediately);
}

export async function enqueueRejectTagTask(userId: number, commentScoreId: number, runImmediately: boolean) {
  await enqueue<IUserCommentScoreData>('rejectTag', {commentScoreId, userId}, runImmediately);
}
