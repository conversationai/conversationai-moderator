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

import { assert } from 'chai';
import { groupBy } from 'lodash';
import * as moment from 'moment';

import {
  Article,
  Category,
  Comment,
  CommentScore,
  CommentScoreRequest,
  CommentSummaryScore,
  Decision,
  MODERATION_ACTION_ACCEPT,
  MODERATION_ACTION_REJECT,
  Tag,
} from '../../models';
import {
  compileScoresData,
  compileSummaryScoresData,
  completeMachineScoring,
  findOrCreateTagsByKey,
  getCommentsToResendForScoring,
  processMachineScore,
  recordDecision,
} from '../../pipeline';
import { IScores, ISummaryScores } from '../../pipeline/shim';
import { getIsDoneScoring } from '../../pipeline/state';
import {
  createArticle,
  createCategory,
  createComment,
  createCommentScoreRequest,
  createCommentSummaryScore,
  createModerationRule,
  createModeratorUser,
  createTag,
  createUser,
} from '../domain/comments/fixture';

describe('Pipeline Tests', () => {
  beforeEach(async () => {
    await CommentSummaryScore.destroy({where: {}});
    await CommentScore.destroy({where: {}});
    await CommentScoreRequest.destroy({where: {}});
    await Decision.destroy({where: {}});
    await Comment.destroy({where: {}});
    await Article.destroy({where: {}});
    await Category.destroy({where: {}});
    await Tag.destroy({where: {}});
  });

  describe('getCommentsToResendForScoring', () => {
    it('should fetch comments that need to be resent for scoring', async () => {
      const [
        comment,
        notQuiteStaleComment,
        staleComment,
        acceptedComment,
        rejectedComment,
        scoredComment,
        scoredStaleComment,
      ] = await Promise.all([

        // Standard comment
        createComment(),

        // Not quite re-sendable
        createComment({
          isAccepted: null,
          sentForScoring: moment().subtract(5, 'minutes').add(10, 'seconds'),
        }),

        // Freshly re-sendable
        createComment({
          isAccepted: null,
          sentForScoring: moment().subtract(5, 'minutes').subtract(10, 'seconds'),
        }),

        // Accepted comments should be ignored
        createComment({
          isAccepted: true,
        }),

        // Rejected comments should be ignored
        createComment({
          isAccepted: false,
        }),

        // Scored comments should be ignored
        createComment({
          isScored: true,
        }),

        // Scored, stale comments should be ignored
        createComment({
          isScored: true,
          sentForScoring: moment().subtract(5, 'minutes').subtract(10, 'seconds'),
        }),
      ]);

      const comments = await getCommentsToResendForScoring();
      const ids = comments.map((c) => c.id);

      assert.notInclude(ids, comment.id);
      assert.notInclude(ids, notQuiteStaleComment.id);
      assert.include(ids, staleComment.id);
      assert.notInclude(ids, acceptedComment.id);
      assert.notInclude(ids, rejectedComment.id);
      assert.notInclude(ids, scoredComment.id);
      assert.notInclude(ids, scoredStaleComment.id);
    });
  });

  describe('processMachineScore', () => {
    it('should process the passed in score data, updating the request record and adding score records', async () => {
      // Create test data

      const fakeScoreData: any = {
        scores: {
          ATTACK_ON_COMMENTER: [
            {
              score: 0.2,
              begin: 0,
              end: 62,
            },
          ],
          INFLAMMATORY: [
            {
              score: 0.4,
              begin: 0,
              end: 62,
            },
            {
              score: 0.7,
              begin: 63,
              end: 66,
            },
          ],
        },

        summaryScores: {
          ATTACK_ON_COMMENTER: 0.2,
          INFLAMMATORY: 0.55,
        },

        error: '',
      };

      // Put a series of fixture data into the database

      const [comment, serviceUser] = await Promise.all([
        createComment(),
        createModeratorUser(),
      ]);

      const commentScoreRequest = await createCommentScoreRequest({
        commentId: comment.id,
        userId: serviceUser.id,
      });

      // Call processMachineScore and start making assertions
      await processMachineScore(comment.id, serviceUser.id, fakeScoreData);

      // This is the only score in the queue, so it should be complete (true).
      assert.isTrue(await getIsDoneScoring(comment.id));
      await completeMachineScoring(comment.id);

      // Get scores and score requests from the database
      const scores = await CommentScore.findAll({
          where: { commentId: comment.id },
          include: [Tag],
        });
      const request = await CommentScoreRequest.findOne({
          where: { id: commentScoreRequest.id },
          include: [Comment],
        });
      const summaryScores = await CommentSummaryScore.findAll({
          where: { commentId: comment.id },
          include: [Tag],
        });

      // Scores assertions
      assert.lengthOf(scores, 3);

      // Summary scores assertions
      assert.lengthOf(summaryScores, 2);

      // Assertions against test data

      for (const score of scores) {
        assert.equal(score.sourceType, 'Machine');
        assert.equal(score.userId, serviceUser.id);

        if (score.score === 0.2) {
          assert.equal(score.annotationStart, 0);
          assert.equal(score.annotationEnd, 62);
          assert.equal((await score.getTag())!.key, 'ATTACK_ON_COMMENTER');
        }

        if (score.score === 0.4) {
          assert.equal(score.annotationStart, 0);
          assert.equal(score.annotationEnd, 62);
          assert.equal((await score.getTag())!.key, 'INFLAMMATORY');
        }

        if (score.score === 0.7) {
          assert.equal(score.annotationStart, 63);
          assert.equal(score.annotationEnd, 66);
          assert.equal((await score.getTag())!.key, 'INFLAMMATORY');
        }
      }

      for (const score of summaryScores) {
        if (score.score === 0.2) {
          assert.equal((await score.getTag())!.key, 'ATTACK_ON_COMMENTER');
        }

        if (score.score === 0.55) {
          assert.equal((await score.getTag())!.key, 'INFLAMMATORY');
        }
      }

      // Request assertions
      assert.isNotNull(request);
      assert.isOk(request!.doneAt);
      assert.equal(request!.commentId, comment.id);
      assert.isTrue((await request!.getComment())!.isScored);
    });

    it('should short-circuit if error key is present and not falsy in the scoreData', async () => {
      const fakeScoreData: any = {
        scores: {
          SPAM: [
            {
              score: 0.2,
              begin: 0,
              end: 15,
            },
          ],
        },

        summaryScores: {
          SPAM: 0.2,
        },

        error: 'Some error message',
      };

      try {
        await processMachineScore(1, 1, fakeScoreData);
        throw new Error('`processMachineScore` successfully resolved when it should have been rejected');
      } catch (err) {
        assert.instanceOf(err, Error);
      }
    });

    it('should fail for any missed queries', async () => {
      // Create test data

      const fakeScoreData: any = {
        scores: {
          ATTACK_ON_COMMENTER: [
            {
              score: 0.2,
              begin: 0,
              end: 62,
            },
          ],
          INFLAMMATORY: [
            {
              score: 0.4,
              begin: 0,
              end: 62,
            },
            {
              score: 0.7,
              begin: 63,
              end: 66,
            },
          ],
        },

        summaryScores: {
          ATTACK_ON_COMMENTER: 0.2,
          INFLAMMATORY: 0.55,
        },

        error: '',
      };

      // Create similar fixture data as to previous test case, but leave out the score request creation
      const [comment, serviceUser] = await Promise.all([
        createComment(),
        createModeratorUser(),
      ]);

      try {
        await processMachineScore(comment.id, serviceUser.id, fakeScoreData);
        throw new Error('`processMachineScore` unexpectedly resolved successfully');
      } catch (err) {
        assert.instanceOf(err, Error);
      }
    });

    it('should not mark the comment as `isScored` when not all score requests have come back', async () => {
      // Test data

      const fakeScoreData: any = {
        scores: {
          ATTACK_ON_COMMENTER: [
            {
              score: 0.2,
              begin: 0,
              end: 62,
            },
          ],
          INFLAMMATORY: [
            {
              score: 0.4,
              begin: 0,
              end: 62,
            },
            {
              score: 0.7,
              begin: 63,
              end: 66,
            },
          ],
        },

        summaryScores: {
          ATTACK_ON_COMMENTER: 0.2,
          INFLAMMATORY: 0.55,
        },

        error: '',
      };

      // Create similar fixture data as to previous test case, but leave out the score request

      const [comment, serviceUser1, serviceUser2] = await Promise.all([
        createComment(),
        createModeratorUser(),
        createModeratorUser(),
      ]);

      // Make one request for each scorer

      const [commentScoreRequest1] = await Promise.all([
        createCommentScoreRequest({
          commentId: comment.id,
          userId: serviceUser1.id,
        }),
        createCommentScoreRequest({
          commentId: comment.id,
          userId: serviceUser2.id,
        }),
      ]);

      // Receive a score for the first scorer

      await processMachineScore(comment.id, serviceUser1.id, fakeScoreData);

      const commentScoreRequests = await CommentScoreRequest.findAll({
        where: { commentId: comment.id },
        include: [Comment],
        order: [['id', 'ASC']],
      });

      assert.lengthOf(commentScoreRequests, 2);

      commentScoreRequests.forEach((request: CommentScoreRequest) => {
        if (request.id === commentScoreRequest1.id) {
          assert.isOk(request.doneAt);
        } else {
          assert.isNull(request.doneAt);
        }
      });

      assert.isFalse((await commentScoreRequests[0].getComment())!.isScored);
    });
  });

  describe('completeMachineScoring', () => {
    it('should denormalize', async () => {
      const category = await createCategory();
      const article = await createArticle({ categoryId: category.id });
      const comment = await createComment({ isScored: true, articleId: article.id });
      const tag = await createTag();

      await createCommentSummaryScore({
        commentId: comment.id,
        tagId: tag.id,
        score: 0.5,
      });

      await createModerationRule({
        action: MODERATION_ACTION_REJECT,
        tagId: tag.id,
        lowerThreshold: 0.0,
        upperThreshold: 1.0,
      });

      await completeMachineScoring(comment.id);

      const updatedCategory = (await Category.findByPk(category.id))!;
      const updatedArticle = (await Article.findByPk(article.id))!;
      const updatedComment = (await Comment.findByPk(comment.id))!;

      assert.isTrue(updatedComment.isAutoResolved, 'comment isAutoResolved');
      assert.equal(updatedComment.unresolvedFlagsCount, 0, 'comment unresolvedFlagsCount');

      assert.equal(updatedCategory.moderatedCount, 1, 'category moderatedCount');
      assert.equal(updatedCategory.rejectedCount, 1, 'category rejectedCount');

      assert.equal(updatedArticle.moderatedCount, 1, 'article moderatedCount');
      assert.equal(updatedArticle.rejectedCount, 1, 'article rejectedCount');
      assert.isNull(updatedArticle.lastModeratedAt); // last moderated doesn't get updated by machine ops
    });

    it('should record the Reject decision from a rule', async () => {
      const category = await createCategory();
      const article = await createArticle({ categoryId: category.id });
      const comment = await createComment({ articleId: article.id });
      const tag = await createTag();

      await createCommentSummaryScore({
        commentId: comment.id,
        tagId: tag.id,
        score: 0.5,
      });

      const rule = await createModerationRule({
        action: MODERATION_ACTION_REJECT,
        tagId: tag.id,
        lowerThreshold: 0.0,
        upperThreshold: 1.0,
      });

      await completeMachineScoring(comment.id);

      const decision = (await Decision.findOne({
        where: { commentId: comment.id },
      }))!;

      assert.equal(decision.status, MODERATION_ACTION_REJECT);
      assert.equal(decision.source, 'Rule');
      assert.equal(decision.moderationRuleId, rule.id);
    });
  });

  describe('compileScoresData', () => {
    it('should compile raw score and model data into an array for CommentScore bulk creation', async () => {
      const scoreData: IScores = {
        ATTACK_ON_COMMENTER: [
          {
            score: 0.2,
            begin: 0,
            end: 62,
          },
        ],
        INFLAMMATORY: [
          {
            score: 0.4,
            begin: 0,
            end: 62,
          },
          {
            score: 0.7,
            begin: 63,
            end: 66,
          },
        ],
      };

      const tags = await findOrCreateTagsByKey(Object.keys(scoreData));

      const tagsByKey = groupBy(tags, (tag: Tag) => {
        return tag.key;
      });

      const [comment, serviceUser] = await Promise.all([
        createComment(),
        createModeratorUser(),
      ]);

      const commentScoreRequest = await createCommentScoreRequest({
        commentId: comment.id,
        userId: serviceUser.id,
      });

      const sourceType = 'Machine';

      const expected = [
        {
          sourceType,
          userId: serviceUser.id,
          commentId: comment.id,
          commentScoreRequestId: commentScoreRequest.id,
          tagId: tagsByKey.ATTACK_ON_COMMENTER[0].id,
          score: 0.2,
          annotationStart: 0,
          annotationEnd: 62,
        },
        {
          sourceType,
          userId: serviceUser.id,
          commentId: comment.id,
          commentScoreRequestId: commentScoreRequest.id,
          tagId: tagsByKey.INFLAMMATORY[0].id,
          score: 0.4,
          annotationStart: 0,
          annotationEnd: 62,
        },
        {
          sourceType,
          userId: serviceUser.id,
          commentId: comment.id,
          commentScoreRequestId: commentScoreRequest.id,
          tagId: tagsByKey.INFLAMMATORY[0].id,
          score: 0.7,
          annotationStart: 63,
          annotationEnd: 66,
        },
      ];

      const compiled = compileScoresData(sourceType, serviceUser.id, scoreData, {
        comment,
        commentScoreRequest,
        tags,
      });

      assert.deepEqual(compiled, expected);
    });
  });

  describe('compileSummaryScoresData', () => {
    it('should compile raw score and model data into an array for CommentSummaryScore bulk creation', async () => {
      const summarScoreData: ISummaryScores = {
        ATTACK_ON_COMMENTER: 0.2,
        INFLAMMATORY: 0.55,
      };

      const tags = await findOrCreateTagsByKey(Object.keys(summarScoreData));

      const tagsByKey = groupBy(tags, (tag: Tag) => {
        return tag.key;
      });

      const comment = await createComment();

      const expected = [
        {
          commentId: comment.id,
          tagId: tagsByKey.ATTACK_ON_COMMENTER[0].id,
          score: 0.2,
        },
        {
          commentId: comment.id,
          tagId: tagsByKey.INFLAMMATORY[0].id,
          score: 0.55,
        },
      ];

      const compiled = compileSummaryScoresData(summarScoreData, comment, tags);

      assert.deepEqual(compiled, expected);
    });
  });

  describe('findOrCreateTagsByKey', () => {
    it('should create tags not present in the database and resolve their data', async () => {
      const keys = ['ATTACK_ON_AUTHOR'];

      const results = await findOrCreateTagsByKey(keys);

      assert.lengthOf(results, 1);

      const tag = results[0];
      assert.equal(tag.key, keys[0]);
      assert.equal(tag.label, 'Attack On Author');

      const instance = (await Tag.findOne({
        where: { key: keys[0] },
      }))!;

      assert.equal(tag.id, instance.id);
      assert.equal(tag.key, instance.key);
      assert.equal(tag.label, instance.label);
    });

    it('should find existing tags and resolve their data', async () => {
      const key = 'SPAM';

      const dbTag = await Tag.create({
        key,
        label: 'Spam',
      });

      const results = await findOrCreateTagsByKey([key]);

      assert.lengthOf(results, 1);

      const tag = results[0];
      assert.equal(tag.id, dbTag.id);
      assert.equal(tag.key, key);
      assert.equal(tag.label, 'Spam');
    });

    it('should resolve a mix of existing and new tags', async () => {
      const keys = ['INCOHERENT', 'OFF_TOPIC'];

      const dbTag = await Tag.create({
        key: 'INCOHERENT',
        label: 'Incoherent',
      });

      const results = await findOrCreateTagsByKey(keys);

      assert.lengthOf(results, keys.length);

      results.forEach((tag) => {
        if (tag.key === 'INCOHERENT') {
          assert.equal(tag.id, dbTag.id);
        } else {
          assert.isNumber(tag.id);
          assert.equal(tag.key, 'OFF_TOPIC');
          assert.equal(tag.label, 'Off Topic');
        }
      });
    });
  });

  describe('recordDecision', () => {
    it('should record the descision to accept', async () => {
      const comment = await createComment();
      const user = await createUser();
      await recordDecision(comment, MODERATION_ACTION_ACCEPT, user);

      const foundDecisions = await Decision.findAll({
        where: { commentId: comment.id },
      });

      assert.lengthOf(foundDecisions, 1);

      const firstDecision = foundDecisions[0];

      assert.equal(firstDecision.commentId, comment.id);
      assert.equal(firstDecision.source, 'User');
      assert.equal(firstDecision.userId, user.id);
      assert.equal(firstDecision.status, MODERATION_ACTION_ACCEPT);
      assert.isTrue(firstDecision.isCurrentDecision);
    });

    it('should clear old decisions', async () => {
      const user = await createUser();
      const tag = await createTag();
      const rule = await createModerationRule({
        action: MODERATION_ACTION_REJECT,
        tagId: tag.id,
        lowerThreshold: 0.0,
        upperThreshold: 1.0,
      });

      const comment = await createComment();

      await recordDecision(comment, MODERATION_ACTION_ACCEPT, user);
      await recordDecision(comment, MODERATION_ACTION_REJECT, rule);

      const foundDecisions = await Decision.findAll({
        where: { commentId: comment.id },
      });

      assert.lengthOf(foundDecisions, 2);

      const currentDecisions = await Decision.findAll({
        where: {
          commentId: comment.id,
          isCurrentDecision: true,
        },
      });

      assert.lengthOf(currentDecisions, 1);

      const firstDecision = currentDecisions[0];

      assert.equal(firstDecision.commentId, comment.id);
      assert.equal(firstDecision.source, 'Rule');
      assert.equal(firstDecision.moderationRuleId, rule.id);
      assert.equal(firstDecision.status, MODERATION_ACTION_REJECT);
      assert.isTrue(firstDecision.isCurrentDecision);
    });
  });
});
