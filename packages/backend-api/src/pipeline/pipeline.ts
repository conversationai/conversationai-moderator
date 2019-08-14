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

import * as Bluebird from 'bluebird';
import { groupBy, maxBy } from 'lodash';
import * as moment from 'moment';
import { FindOrInitializeOptions } from 'sequelize';
import { humanize, titleize, trim } from 'underscore.string';

import { config } from '@conversationai/moderator-config';

import { logger } from '@conversationai/moderator-backend-core';
import {
  Article,
  Comment,
  CommentScore,
  CommentScoreRequest,
  CommentSummaryScore,
  Decision,
  ENDPOINT_TYPE_API,
  ENDPOINT_TYPE_PROXY,
  ICommentInstance,
  ICommentScoreAttributes,
  ICommentSummaryScoreAttributes,
  IDecisionInstance,
  IModerationRuleInstance,
  IResolution,
  isModerationRule,
  isUser,
  ITagAttributes,
  ITagInstance,
  IUserInstance,
  Tag,
  User,
  USER_GROUP_MODERATOR,
} from '@conversationai/moderator-backend-core';
import { sequelize } from '@conversationai/moderator-backend-core';
import { denormalizeCommentCountsForArticle } from '@conversationai/moderator-backend-core';
import { cacheCommentTopScores } from '@conversationai/moderator-backend-core';
import { denormalizeCountsForComment } from '@conversationai/moderator-backend-core';
import { cacheTextSize } from '@conversationai/moderator-backend-core';

import { processRulesForComment } from './rules';
import { IScoreData, IScores, IShim, ISummaryScores } from './shim';
import { getIsDoneScoring } from './state';

import { createShim as createApiShim } from './apiShim';
import { createShim as createProxyShim } from './proxyShim';

const shims = new Map<number, IShim>();

export async function sendToScorer(comment: ICommentInstance, scorer: IUserInstance) {
  try {
    // Destroy existing comment score request for user.
    await CommentScoreRequest.destroy({
      where: {
        commentId: comment.id,
        userId: scorer.id,
      },
    });

    let shim = shims.get(scorer.id);
    if (!shim) {
      const extra: any = JSON.parse(scorer.get('extra'));

      if (!extra) {
        logger.error(`Missing endpoint config for scorer ${scorer.id}`);
        return;
      }

      if (extra.endpointType === ENDPOINT_TYPE_API) {
        shim = await createApiShim(scorer, processMachineScore);
      }
      else if (extra.endpointType === ENDPOINT_TYPE_PROXY) {
        shim = await createProxyShim(scorer, processMachineScore);
      }
      else {
        logger.error(`Unknown moderator endpoint type: ${extra['endpoint']} for scorer ${scorer.id}`);
        return;
      }
      shims.set(scorer.id, shim);
    }

    // Create score request
    const csr = await CommentScoreRequest.create({
      commentId: comment.id,
      userId: scorer.id,
      sentAt: sequelize.fn('now'),
    });

    await shim.sendToScorer(comment, csr.id);
  }
  catch (err) {
    logger.error('Error posting comment id %d for scoring: ', comment.id, err);
  }
}

export async function checkScoringDone(comment: ICommentInstance): Promise<void> {
  // Mark timestamp for when comment was last sent for scoring
  await comment
    .set('sentForScoring', sequelize.fn('now'))
    .save();

  const isDoneScoring = await getIsDoneScoring(comment.id);
  if (isDoneScoring) {
    await completeMachineScoring(comment.id);
  }
}

/**
 * Send passed in comment for scoring against all active service Users.
 */
export async function sendForScoring(comment: ICommentInstance): Promise<void> {
  const serviceUsers = await User.findAll({
    where: {
      group: USER_GROUP_MODERATOR,
      isActive: true,
    },
  } as any);

  let foundServiceUser = false;
  for (const scorer of serviceUsers) {
    await sendToScorer(comment, scorer);
    foundServiceUser = true;
  }

  if (foundServiceUser) {
    await checkScoringDone(comment);
  }
  else {
    logger.info('No active Comment Scorers found');
  }
}

/**
 * Return a cutoff date object for re-sending score requests. Every CommentScoreRequest
 * whose `sentAt` date is before this should be re-sent for scoring.
 */
export function resendCutoff() {
  return moment().subtract(5, 'minutes').toDate();
}

/**
 * Get all comment instances that were sent for scoring before the `resendCutoff`
 * who have not been marked `isScored` or resolved
 */
export async function getCommentsToResendForScoring(
  processCommentLimit?: number,
): Promise<Array<ICommentInstance>> {
  const findOpts = {
    where: {
      isAccepted: null,
      isScored: false,
      sentForScoring: { $lt: resendCutoff() },
    },
    include: [Article],
  } as any;

  if ('undefined' !== typeof processCommentLimit) {
    findOpts.limit = processCommentLimit;
  }

  return await Comment.findAll(findOpts);
}

/**
 * Resend a comment to be scored again.
 */
export async function resendForScoring(comment: ICommentInstance): Promise<void> {
  logger.info('Re-sending comment id %s for scoring', comment.id);
  await sendForScoring(comment);
}

/**
 * Receive a single score. Data object should have: commentId, serviceUserId, sourceType,
 * score, and optionally annotationStart and annotationEnde
 */
export async function processMachineScore(
  commentId: number,
  serviceUserId: number,
  scoreData: IScoreData,
): Promise<void> {
  logger.info('PROCESS MACHINE SCORE ::', commentId, serviceUserId, JSON.stringify(scoreData));
  const comment = (await Comment.findById(commentId))!;

  // Find matching comment score request
  const commentScoreRequest = await CommentScoreRequest.findOne({
    where: {
      commentId,
      userId: serviceUserId,
    },
    order: 'sentAt DESC',
  });

  if (!commentScoreRequest) {
    throw new Error('Comment score request not found');
  }

  // Find/create all tags present in scores
  const scoresTags = await findOrCreateTagsByKey(Object.keys(scoreData.scores));

  const commentScoresData = compileScoresData(
    'Machine',
    serviceUserId,
    scoreData.scores,
    {
      comment,
      commentScoreRequest,
      tags: scoresTags,
    },
  );

  // Find/create all tags present in summary scores
  const summaryScoresTags = await findOrCreateTagsByKey(Object.keys(scoreData.summaryScores));

  // Clear old comment scores and create new comment scores
  await CommentScore.destroy({
    where: {
      commentId,
      userId: serviceUserId,
    },
  });
  await CommentScore.bulkCreate(commentScoresData);

  const commentSummaryScoresData = compileSummaryScoresData(
    scoreData.summaryScores,
    comment,
    summaryScoresTags,
  );

  await sequelize.transaction(async (t) => {
    await Promise.all(
      commentSummaryScoresData.map((c: ICommentSummaryScoreAttributes) =>
        CommentSummaryScore.insertOrUpdate(c, { transaction: t }),
      ),
    );
  });

  await updateMaxSummaryScore(comment);

  // Mark the comment score request as done
  await commentScoreRequest
    .set('doneAt', sequelize.fn('now'))
    .save();
}

export async function updateMaxSummaryScore(comment: ICommentInstance): Promise<void> {
  const tagsInSummaryScore = await Tag.findAll({
    where: {
      inSummaryScore: true,
    },
  });
  const summaryScores = await CommentSummaryScore.findAll({
    where: {
      commentId: comment.id,
      tagId: {
        $in: tagsInSummaryScore.map((tag) => tag.id),
      },
    },
  });

  if (summaryScores.length <= 0) {
    return;
  }

  const maxSummaryScores = maxBy(summaryScores, (score) => score.get('score'));
  await comment.update({
    // TODO(ldixon): investigate typing to avoid `maxSummaryScores` being
    // undefined and needing the type hack here.
    maxSummaryScore: maxSummaryScores!.get('score'),
    maxSummaryScoreTagId: maxSummaryScores!.get('tagId'),
  });
}

/**
 * Once all scores are in, process rules, record the decision and denormalize.
 */
export async function completeMachineScoring(commentId: number): Promise<void> {
  const comment = (await Comment.findById(commentId, {
    include: [Article],
  }))!;

  await comment.set('isScored', true).save();

  await cacheCommentTopScores(comment);
  await processRulesForComment(comment);
  await denormalizeCountsForComment(comment);
  await denormalizeCommentCountsForArticle(await comment.getArticle(), false);
}

/**
 * Take raw scores data and an object of model data and map it all together in an array to
 * bulk create comment scores with
 */
export function compileScoresData(sourceType: string, userId: number, scoreData: IScores, modelData: any): Array<ICommentScoreAttributes> {
  sourceType = sourceType || 'Machine';

  const tagsByKey = groupBy(modelData.tags, (tag: ITagInstance) => tag.get('key'));

  const data: Array<ICommentScoreAttributes> = [];

  Object
    .keys(scoreData)
    .forEach((tagKey) => {
      scoreData[tagKey].forEach((score) => {
        data.push({
          commentId: modelData.comment.id,
          commentScoreRequestId: modelData.commentScoreRequest.id,
          sourceType,
          userId,
          tagId: tagsByKey[tagKey][0].id,
          score: score.score,
          annotationStart: score.begin,
          annotationEnd: score.end,
        });
      });
    });

  return data;
}

/**
 * Take raw scores data and an object of model data and map it all together in an array to
 * bulk create comment summary scores with
 */
export function compileSummaryScoresData(scoreData: ISummaryScores, comment: ICommentInstance, tags: Array<ITagInstance>): Array<ICommentSummaryScoreAttributes> {
  const tagsByKey = groupBy(tags, (tag: ITagInstance) => tag.get('key'));

  const data: Array<ICommentSummaryScoreAttributes> = [];

  Object
    .keys(scoreData)
    .forEach((tagKey) => {
      data.push({
        commentId: comment.id,
        // TODO(ldixon): figure out why this typehack is needed and fix.
        tagId: (tagsByKey[tagKey][0] as any).id,
        score: scoreData[tagKey],
      });
    });

  return data;
}

/**
 * Given an array of tag keys, find or create them
 *
 * @param {array} keys      Array of tag keys (strings)
 * @param {object} options  Optional object to pass into the query, mainly to be able to pass along a `transaction`
 * @return {object} Promise object that resolves to an array of Tag model instances
 */
export async function findOrCreateTagsByKey(
  keys: Array<string>,
  options: Partial<FindOrInitializeOptions<ITagAttributes>> = {},
): Promise<Array<ITagInstance>> {
  options = options || {};

  return await Bluebird.mapSeries(keys, async (key) => {
    const cleanKey = trim(key);
    const label = titleize(humanize(cleanKey));

    const [instance] = await Tag.findOrCreate({
      where: {
        key: cleanKey,
      },

      defaults: {
        key: cleanKey,
        label,
      },

      ...options,
    });

    return instance;
  });
}

/**
 * Save the action of a rule or user making a comment on a decision.
 */
export async function recordDecision(
  comment: ICommentInstance,
  status: IResolution,
  source: IUserInstance | IModerationRuleInstance | null,
): Promise<IDecisionInstance> {
  // Find out if we're overriding a previous decision.
  const previousDecisions = await comment.getDecisions({
    where: {
      isCurrentDecision: true,
    },
  });

  // Set previous active decisions to `isCurrentDecision` false.
  await Promise.all(
    previousDecisions.map((d) => d.update({ isCurrentDecision: false })),
  );

  await comment.update({ updatedAt: sequelize.fn('now') });

  // Add new decision, isCurrentDecision defaults to true.
  const decision = await Decision.create({
    commentId: comment.id,
    status,

    source: isUser(source) ? 'User' : 'Rule',
    userId: (source && isUser(source)) ? source.id : undefined,
    moderationRuleId: (source && isModerationRule(source)) ? source.id : undefined,
  });

  // Don't send decision to publisher in noop mode
  const mode = config.get('publisher_notification_mode');

  if (mode === 'noop') {
    await decision.update({ sentBackToPublisher: sequelize.fn('now') });
  }

  return decision;
}

export async function postProcessComment(comment: ICommentInstance): Promise<void> {
  const article = await comment.getArticle();

  // Denormalize the moderation counts for the comment article
  await denormalizeCommentCountsForArticle(article, false);

  // Cache the size of the comment text.
  await cacheTextSize(comment, 696);

  // Try to create reply, return if not a reply
  const replyToSourceId = comment.get('replyToSourceId');
  if (!replyToSourceId) { return; }

  // Find a parent id
  const parent = await Comment.findOne({
    where: {
      sourceId: replyToSourceId,
    },
  });

  // If the parent cannot be found, then return
  if (!parent) { return; }

  await comment.update({
    replyId: parent.id,
  });
}
