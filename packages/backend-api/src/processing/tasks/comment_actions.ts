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
import { logger } from '../../logger';
import { MODERATION_ACTION_ACCEPT, MODERATION_ACTION_REJECT } from '../../models';
import { approve, defer, highlight, reject, reset } from '../../pipeline/state';
import { enqueue, registerTask } from '../util';
import { getComment, getUser, resolveComment, resolveCommentAndFlags, resolveFlagsAndDenormalize } from './db_operations';

export type CommentActions =
  'acceptComments' |
  'acceptCommentsAndFlags' |
  'rejectComments' |
  'rejectCommentsAndFlags' |
  'highlightComments' |
  'deferComments' |
  'resetComments' |
  'resolveFlags';

interface ICommentActionData {
  commentId: number;
  userId?: number | null;
  isBatchAction: boolean;
}

async function executeAcceptCommentsTask(data: ICommentActionData) {
  const { commentId, userId, isBatchAction } = data;

  return resolveComment(
    commentId,
    userId || null,
    isBatchAction,
    MODERATION_ACTION_ACCEPT,
    approve,
  );
}

async function executeAcceptCommentsAndFlagsTask(data: ICommentActionData) {
  const { commentId, userId, isBatchAction } = data;

  return resolveCommentAndFlags(
    commentId,
    userId || null,
    isBatchAction,
    MODERATION_ACTION_ACCEPT,
    approve,
  );
}

async function executeRejectCommentsTask(data: ICommentActionData) {
  const { commentId, userId, isBatchAction } = data;

  return resolveComment(
    commentId,
    userId || null,
    isBatchAction,
    MODERATION_ACTION_REJECT,
    reject,
  );
}

async function executeRejectCommentsAndFlagsTask(data: ICommentActionData) {
  const { commentId, userId, isBatchAction } = data;

  return resolveCommentAndFlags(
    commentId,
    userId || null,
    isBatchAction,
    MODERATION_ACTION_REJECT,
    reject,
  );
}

async function executeDeferCommentsTask(data: ICommentActionData) {
  const user = await getUser(data.userId);
  const comment = await getComment(data.commentId);

  // update batch action
  logger.info('defer comment : ',  comment.id );
  comment.isBatchResolved = data.isBatchAction;
  await comment.save();
  return defer(comment, user);
}

async function executeHighlightCommentsTask(data: ICommentActionData)  {
  const user = await getUser(data.userId);
  const comment = await getComment(data.commentId);

  logger.info('highlight comment : ', comment.id);
  comment.isBatchResolved = data.isBatchAction;
  await comment.save();
  return highlight(comment, user);
}

async function executeResetCommentsTask(data: ICommentActionData) {
  const user = await getUser(data.userId);
  const comment = await getComment(data.commentId);
  logger.info(`reset comment: ${comment.id}`);
  return reset(comment, user);
}

async function executeResolveFlagsTask(data: ICommentActionData) {
  const { commentId, userId } = data;

  return resolveFlagsAndDenormalize(
    commentId,
    userId ? userId : undefined,
  );
}

registerTask<ICommentActionData>('acceptComments', executeAcceptCommentsTask);
registerTask<ICommentActionData>('acceptCommentsAndFlags', executeAcceptCommentsAndFlagsTask);
registerTask<ICommentActionData>('rejectComments', executeRejectCommentsTask);
registerTask<ICommentActionData>('rejectCommentsAndFlags', executeRejectCommentsAndFlagsTask);
registerTask<ICommentActionData>('deferComments', executeDeferCommentsTask);
registerTask<ICommentActionData>('highlightComments', executeHighlightCommentsTask);
registerTask<ICommentActionData>('resolveFlags', executeResolveFlagsTask);
registerTask<ICommentActionData>('resetComments', executeResetCommentsTask);

export async function enqueueCommentAction(
  action: CommentActions,
  userId: number,
  commentId: number,
  isBatchAction: boolean,
  runImmediately: boolean,
) {
  await enqueue<ICommentActionData>(action, {commentId, userId, isBatchAction}, runImmediately);
}
