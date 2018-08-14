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

import { groupBy, maxBy } from 'lodash';
import * as moment from 'moment';
import * as requestRaw from 'request';
import { FindOrInitializeOptions } from 'sequelize';
import { humanize, rtrim, titleize, trim } from 'underscore.string';
import { trigger } from '../../events';
import { logger } from '../../logger';
import {
  Article,
  Comment,
  CommentScore,
  CommentScoreRequest,
  CommentSummaryScore,
  Decision,
  ICommentInstance,
  ICommentScoreAttributes,
  ICommentSummaryScoreAttributes,
  IDecisionInstance,
  IModerationRuleInstance,
  ITagAttributes,
  ITagInstance,
  IUserInstance,
  ModerationRule,
  Tag,
  User,
} from '../../models';
import { sequelize } from '../../sequelize';
import { denormalizeCommentCountsForArticle } from '../articles/countDenormalization';
import { cacheCommentTopScores } from '../commentScores';
import { denormalizeCountsForComment } from './countDenormalization';
import { processRulesForComment } from './rules';
import { getIsDoneScoring, IResolution } from './state';
import { cacheTextSize } from './textSizes';

import * as Bluebird from 'bluebird';
const request = Bluebird.promisify(requestRaw) as any;
Bluebird.promisifyAll(request);

import * as striptags from 'striptags';

import { config } from '@conversationai/moderator-config';

export interface IScore {
  score: number;
  begin?: number;
  end?: number;
}

export interface IScores {
  [key: string]: Array<IScore>;
}

export interface ISummaryScores {
  [key: string]: number;
}

export interface IScoreData {
  scores: IScores;
  summaryScores: ISummaryScores;
}

interface IBotPostData {
  sync?: boolean;

  comment: {
    commentId: number;
    plainText: string;
    htmlText: string;
    links: {
      self: string;
    };
  };

  article: {
    articleId: number;
    plainText: string;
    links: {
      self: string;
    };
  };

  includeSummaryScores: true;

  inReplyToComment?: {
    commentId: number;
    plainText: string;
    htmlText: string;
    links: {
      self: string;
    };
  };

  links: {
    callback: string;
  };
}

/**
 * Send a single comment to a single scorer
 *
 * @param {object} comment        Comment model instance
 * @param {object} serviceUser    A "service" User model instance
 * @param {bool} sync           An extra flag to override API for test.
 * @return {object} Promise object
 */
export async function sendToScorer(comment: ICommentInstance, serviceUser: IUserInstance, sync?: boolean) {
  const apiURL = rtrim(config.get('api_url'), '/');

  const article = await Article.findById(comment.get('articleId'));

  // Ensure data is present, otherwise an error will throw.
  if (!article) {
    logger.error(`sendToScorer: Article ${comment.get('articleId')} not found for comment ${comment.id}.`);

    return;
  }

  try {

    // Destroy existing comment score request for user.
    await CommentScoreRequest.destroy({
        where: {
          commentId: comment.id,
          userId: serviceUser.id,
        },
      });

    // Create score request
    const insertedObj = await CommentScoreRequest.create({
      commentId: comment.id,
      userId: serviceUser.id,
      sentAt: sequelize.fn('now'),
    });

    const postData: IBotPostData = {
      sync: sync ? sync : undefined,
      includeSummaryScores: true,

      comment: {
        commentId: comment.id,
        plainText: striptags(comment.get('text')),
        htmlText: comment.get('text'),
        links: {
          self: apiURL + '/rest/comments/' + comment.id,
        },
      },

      article: {
        articleId: article.id,
        plainText: striptags(article.get('text')),
        links: {
          self: apiURL + '/rest/articles/' + article.id,
        },
      },

      links: {
        callback: apiURL + '/assistant/scores/' + insertedObj.id,
      },
    };

    // Check for a `replyTo`

    if (comment.get('replyTo')) {
      const replyTo = comment.get('replyTo');

      postData.inReplyToComment = {
        commentId: replyTo.get('id'),
        plainText: striptags(replyTo.get('text')),
        htmlText: replyTo.get('text'),
        links: {
          self: apiURL + '/rest/comments/' + replyTo.id,
        },
      };
    }

    logger.info(
      `Sending comment id ${comment.id} for scoring ` +
      `by service user id ${serviceUser.id} ` +
      `to endpoint: ${serviceUser.get('endpoint')}`,
      postData,
    );

    const response = await request.postAsync({
      url: serviceUser.get('endpoint'),
      json: true,
      body: postData,
      headers: {
        Authorization: config.get('google_score_auth'),
      },
    });

    logger.info(`Assistant Endpoint Response :: ${response.statusCode}`);

    if (response.statusCode !== 200) {
      logger.error('Error posting comment id %d for scoring.', comment.id, +
      ' Server responded with status ', response.statusCode, response.body );
    } else {
      if (sync) {
        logger.info('Using scoring in sync mode.');

        const isDoneScoring = await processMachineScore(
          comment.id,
          serviceUser.id,
          response.body,
        );

        if (isDoneScoring) {
          await completeMachineScoring(comment.id);
        }
      }
    }
  } catch (err) {
    logger.error('Error posting comment id %d for scoring: ', comment.id, err);
  }
}

/**
 * Send a comment to multiple scorers.
 */
export async function sendToScorers(comment: ICommentInstance, serviceUsers: Array<IUserInstance>, sync?: boolean): Promise<void> {
  for (const scorer of serviceUsers) {
    await sendToScorer(comment, scorer, sync);
  }

  // Mark timestamp for when comment was last sent for scoring
  await comment
      .set('sentForScoring', sequelize.fn('now'))
      .save();
}

/**
 * Send passed in comment for scoring against all active service Users.
 */
export async function sendForScoring(comment: ICommentInstance, sync?: boolean): Promise<void> {
  const serviceUsers = await User.findAll({
    where: {
      group: 'service',
      isActive: true,
      endpoint: {
        $ne: null, // Sequelize type doesn't accept `null`, even though that is correct.
      },
    },
  } as any);

  if (serviceUsers.length) {
    await sendToScorers(comment, serviceUsers, sync);
  } else {
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
export async function resendForScoring(comment: ICommentInstance, sync?: boolean): Promise<void> {
  logger.info('Re-sending comment id %s for scoring', comment.id);
  await sendForScoring(comment, sync);
}

/**
 * Receive a single score. Data object should have: commentId, serviceUserId, sourceType,
 * score, and optionally annotationStart and annotationEnde
 */
export async function processMachineScore(
  commentId: number,
  serviceUserId: number,
  scoreData: IScoreData,
): Promise<boolean> {
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

  // Check if all scoring is finished and update the comment accordingly
  const isDoneScoring = await getIsDoneScoring(comment);

  if (isDoneScoring === true) {
    await comment.set('isScored', true).save();

    return true;
  } else {
    return false;
  }
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

  await cacheCommentTopScores(comment);
  await processRulesForComment(comment);
  await denormalizeCountsForComment(comment);
  await denormalizeCommentCountsForArticle(comment.get('article'));
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
  autoConfirm: boolean,
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

    source: source ? (source instanceof User.Instance ? 'User' : 'Rule') : 'Rule',
    userId: source ? (source instanceof User.Instance ? source.id : undefined) : undefined,
    moderationRuleId: source ? (source instanceof ModerationRule.Instance ? source.id : undefined) : undefined,

    ...(autoConfirm ? {
      sentBackToPublisher: sequelize.fn('now'),
    } : {}),
  });

  // Don't send decision to publisher in noop mode
  const mode = config.get('publisher_notification_mode');

  if (mode === 'noop') {
    await decision.update({ sentBackToPublisher: sequelize.fn('now') });
  } else if (mode === 'push') {
    await trigger('api.publisher.sendDecisionToPublisher', { decision });
  }

  return decision;
}

export async function postProcessComment(comment: ICommentInstance): Promise<void> {
  const article = await comment.getArticle();

  // Denormalize the moderation counts for the comment article
  await denormalizeCommentCountsForArticle(article);

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
