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

import { groupBy, omit } from 'lodash';

import { denormalizeCommentCountsForArticle, denormalizeCountsForComment } from '../domain';
import {
  Comment,
  CommentScore,
  CommentScoreRequest,
  IResolution,
  isUser,
  MODERATION_ACTION_ACCEPT,
  MODERATION_ACTION_DEFER,
  MODERATION_ACTION_REJECT,
  ModerationRule,
  Tag,
  User,
} from '../models';
import { recordDecision } from './pipeline';

export interface IDecision {
  resolution: IResolution;
  resolver: User | ModerationRule | null;
}

/**
 * Take an array of CommentScoreRequest instances for a Comment and return true or false
 * indicating whether scoring is complete or not
 */
export function scoresComplete(commentScoreRequests: Array<CommentScoreRequest>): boolean {

  // If there are no requests existing at all, assume it's not done scoring

  if (commentScoreRequests.length < 1) {
    return false;
  } else {

    // Group requests by comment scorer to make sure we're handling cases where multiple
    // requests have been sent out for the same scorer

    const grouped = groupBy(commentScoreRequests, 'userId');

    return Object
      .keys(grouped)
      .map((key) => {

        // Condense down into an array of booleans, returning true for each scorer if any
        // score requests have `doneAt` set

        return grouped[key].some((item: CommentScoreRequest) => {
          return !!item.doneAt;
        });
      })
      .every((item: boolean) => {
        // If every scorer has one `doneAt` (true), return true
        return item;
      });
  }
}

/**
 * Whether a comment is done being scored or not. If not `CommentScoreRequest` rows
 * exist, it will resolve to false. If there are any `CommentScoreRequest` rows that have
 * an empty `doneAt` field, it will resolve to false. Otherwise if they're all filled in
 * it will resolve to true
 */
export async function getIsDoneScoring(commentId: number) {
  // Find and count all comment score requests
  const commentScoreRequests = await CommentScoreRequest.findAll({
    where: { commentId: commentId },
    order: [['sentAt', 'DESC']],
  });

  return scoresComplete(commentScoreRequests);
}

export type ICommentStateParams = Pick<
  Comment,
  'isAccepted' | 'isModerated' | 'isDeferred' | 'isHighlighted' | 'isBatchResolved' | 'isAutoResolved'
>;

/**
 * Get object of a clean state data to set on a Comment model instance
 */
export function getDefaultStateData(): ICommentStateParams {
  return {
    isAccepted: null,
    isModerated: false,
    isDeferred: false,
    isHighlighted: false,
    isBatchResolved: false,
    isAutoResolved: false,
  };
}

/**
 * Get object of approved state data to set on a Comment model instance
 * @return {object}
 */
export function getApproveStateData(): Partial<ICommentStateParams> {
  return {
    isAccepted: true,
    isModerated: true,
    isDeferred: false,
  };
}

/**
 * Get object of rejected state data to set on a Comment model instance
 */
export function getRejectStateData(): Partial<ICommentStateParams> {
  return {
    isAccepted: false,
    isModerated: true,
    isDeferred: false,
  };
}

/**
 * Get object of deferred state data to set on a Comment model instance
 */
export function getDeferStateData(): Partial<ICommentStateParams> {
  return {
    isAccepted: null,
    isModerated: true,
    isDeferred: true,
  };
}

/**
 * Get object of highlighted state data to set on a Comment model instance
 */
export function getHighlightStateData(): Partial<ICommentStateParams> {
  return {
    isHighlighted: true,
  };
}

/**
 * Get object of unhighlighted state data to set on a Comment model instance
 */
export function getUnHighlightStateData(): Partial<ICommentStateParams> {
  return {
    isHighlighted: false,
  };
}

/**
 * Set comment state and save it to the database. Passing an optional data object will add extra data,
 * but keys that conflict with `state` will be omitted
 */
export async function setCommentState(
  comment: Comment,
  source: User | ModerationRule | null,
  state: Partial<ICommentStateParams>,
  data?: Partial<ICommentStateParams>): Promise<Comment> {

  // Create an object of data to save and accept an optional `data` object for additional
  // data, omitting any keys that conflict with `state`

  const updated = await comment.update({
    ...state,
    ...(data ? omit(data, Object.keys(state)) : {}),
  });

  await denormalizeCountsForComment(comment);

  // denormalize the comment counts
  const article = await comment.getArticle();
  if (article) {
    await denormalizeCommentCountsForArticle(article, isUser(source));
  }

  return updated;
}

/**
 * Mark a comment approved in the database, accepts an optional data object to
 * tack on to the comment
 */
export async function approve(
  comment: Comment,
  source: User | ModerationRule | null,
  data?: object,
): Promise<Comment> {
  const updated = await setCommentState(comment, source, getApproveStateData(), data);

  await recordDecision(updated, MODERATION_ACTION_ACCEPT, source);

  return updated;
}

/**
 * Mark a comment rejected in the database, accepts an optional data object to
 * tack on to the comment
 */
export async function reject(
  comment: Comment,
  source: User | ModerationRule | null,
  data?: object,
): Promise<Comment> {
  const updated = await setCommentState(comment, source, getRejectStateData(), data);

  await recordDecision(updated, MODERATION_ACTION_REJECT, source);

  return updated;
}

/**
 * Mark a comment deferred in the database, accepts an optional data object to
 * tack on to the comment
 */
export async function defer(
  comment: Comment,
  source: User | ModerationRule | null,
  data?: object,
): Promise<Comment> {
  const updated = await setCommentState(comment, source, getDeferStateData(), data);

  await recordDecision(updated, MODERATION_ACTION_DEFER, source);

  return updated;
}

/**
 * Toggle a comment's highlighted state in the database, accepts an optional data object to
 * tack on to the comment
 */
export async function highlight(
  comment: Comment,
  source: User | ModerationRule | null,
): Promise<Comment> {
  let updated = comment;
  if (comment.isHighlighted) {
    updated = await setCommentState(comment, source, {
      ...getApproveStateData(),
      ...getUnHighlightStateData(),
    });
  } else {
    updated = await setCommentState(comment, source, {
      ...getApproveStateData(),
      ...getHighlightStateData(),
    });
  }

  return updated;
}

/**
 * Reset a comment in the database.
 */
export function reset(comment: Comment, source: User | ModerationRule | null ): Promise<Comment> {
  return setCommentState(comment, source, getDefaultStateData());
}

/**
 * Add a score directly to a comment. Used to store highlight and flag 100% tags.
 *
 * @param {object} comment   Comment model instance
 * @param {object} tag       Tag model instance
 * @param {object} user      User model instance
 */
export async function addScore(comment: Comment, tag: Tag, user?: User | null): Promise<CommentScore> {
  const score = await CommentScore.create({
    tagId: tag.id,
    commentId: comment.id,
    userId: user ? user.id : undefined,
    sourceType: 'Moderator',
    score: 1,
  });

  await denormalizeCountsForComment(comment);

  // denormalize the comment counts
  const article = await comment.getArticle();
  if (article) {
    await denormalizeCommentCountsForArticle(article, user !== null);
  }

  return score;
}
