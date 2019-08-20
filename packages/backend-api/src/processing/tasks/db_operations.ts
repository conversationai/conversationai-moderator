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
  Article,
  Comment,
  CommentFlag,
  Tag,
  User,
} from '@conversationai/moderator-backend-core';
import {
  ICommentInstance,
  IResolution,
} from '@conversationai/moderator-backend-core';
import {
  denormalizeCommentCountsForArticle,
  denormalizeCountsForComment,
  logger,
} from '@conversationai/moderator-backend-core';

export async function getUser(userId?: number | null | undefined) {
  if (!userId) {
    return null;
  }
  const user = await User.findById(userId);

  if (!user) {
    throw new Error(`User not found, id: ${userId}`);
  }

  return user;
}

export async function getComment(commentId: number) {
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

  return comment;
}

export async function getTag(tagId: number) {
  const tag = await Tag.findById(tagId);

  if (!tag) {
    throw new Error(`Tag not found, id: ${tagId}`);
  }

  return tag;
}

export async function resolveComment(
  commentId: number,
  userId: number | null,
  isBatchAction: boolean,
  status: IResolution,
  domainFn: (comment: ICommentInstance, source: any) => Promise<ICommentInstance>,
): Promise<void> {
  const user = await getUser(userId);
  const comment = await getComment(commentId);
  logger.info(`${status} comment: ${commentId}`);
  await comment.set('isBatchResolved', isBatchAction).save();
  await domainFn(comment, user);
}

async function resolveFlags(
  commentId: number,
  userId?: number,
): Promise<void> {
  await CommentFlag.update({
      isResolved: true,
      resolvedById: userId,
      resolvedAt: new Date(),
    } as any,
    { where: {
        commentId: commentId,
        isResolved: false,
      }},
  );
}

export async function resolveFlagsAndDenormalize(
  commentId: number,
  userId?: number,
): Promise<void> {
  await resolveFlags(commentId, userId);
  const comment = await Comment.findById(commentId);
  const article = await comment.getArticle();
  await denormalizeCountsForComment(comment);
  await denormalizeCommentCountsForArticle(article, true);
}

export async function resolveCommentAndFlags(
  commentId: number,
  userId: number | null,
  isBatchAction: boolean,
  status: IResolution,
  domainFn: (comment: ICommentInstance, source: any) => Promise<ICommentInstance>,
): Promise<void> {
  // We update flags first as we do the denormalization in the resolveComment action.
  await resolveFlags(commentId, userId ? userId : undefined);
  await resolveComment(commentId, userId, isBatchAction, status, domainFn);
}
