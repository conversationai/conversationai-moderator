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
  CommentSummaryScore,
  logger,
} from '@conversationai/moderator-backend-core';

import { addScore } from '../../pipeline/state';
import { enqueue, registerTask} from '../util';
import {
  getComment,
  getTag,
  getUser,
} from './db_operations';

export type ScoreActions =
  'tagComments' |
  'tagCommentSummaryScores' |
  'confirmCommentSummaryScore' |
  'rejectCommentSummaryScore';

interface ITagCommentsData {
  commentId: number;
  userId: number;
  tagId: number;
}

async function executeTagCommentsTask(data: ITagCommentsData) {
  const user = await getUser(data.userId);
  const comment = await getComment(data.commentId);
  const tag = await getTag(data.tagId);

  logger.info(`Run tag comment process with comment id ${comment.id} and tag id ${tag.id}`);
  const commentScore = await addScore(comment, tag, user);
  logger.info('Comment Score added.');
  return commentScore;
}

async function executeTagCommentSummaryScoresTask(data: ITagCommentsData) {
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

async function executeConfirmCommentSummaryScoreTask(data: ITagCommentsData) {
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

async function executeRejectCommentSummaryScoreTask(data: ITagCommentsData) {
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

registerTask<ITagCommentsData>('tagComments', executeTagCommentsTask);
registerTask<ITagCommentsData>('tagCommentSummaryScores', executeTagCommentSummaryScoresTask);
registerTask<ITagCommentsData>('confirmCommentSummaryScore', executeConfirmCommentSummaryScoreTask);
registerTask<ITagCommentsData>('rejectCommentSummaryScore', executeRejectCommentSummaryScoreTask);

export async function enqueueScoreAction(
  action: ScoreActions,
  userId: number,
  commentId: number,
  tagId: number,
  runImmediately: boolean,
) {
  await enqueue<ITagCommentsData>(action, {commentId, tagId, userId}, runImmediately);
}
