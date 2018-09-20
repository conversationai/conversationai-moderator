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
import {
  compileScores,
  processRulesForComment,
  resolveComment,
} from '../../../domain/comments';
import {
  Article,
  Category,
  Comment,
  CommentSummaryScore,
  ModerationRule,
  Tag,
} from '../../../models';
import {
  createArticle,
  createCategory,
  createComment,
  createCommentSummaryScore,
  createModerationRule,
  createTag,
  getCommentSummaryScoreData,
  getTagData,
} from './fixture';

describe('Comment Domain Rules Tests', () => {
  beforeEach(async () => {
    await CommentSummaryScore.destroy({where: {}});
    await Comment.destroy({where: {}});
    await ModerationRule.destroy({where: {}});
    await Tag.destroy({where: {}});
    await Article.destroy({where: {}});
    await Category.destroy({where: {}});
  });

  describe('compileScores', () => {
    it('should return an object of scores keyed by tag id', () => {
      const tag1 = Tag.build(getTagData());
      tag1.set('id', 1);

      const tag2 = Tag.build(getTagData());
      tag2.set('id', 2);

      const score1 = CommentSummaryScore.build(getCommentSummaryScoreData({tagId: 1, score: 0.57}));
      const score2 = CommentSummaryScore.build(getCommentSummaryScoreData({tagId: 2, score: 0.75}));
      const scores = [score1, score2];

      const expected = {
        1: 0.57,
        2: 0.75,
      };

      assert.deepEqual(compileScores(scores), expected);
    });

    it('should get the max scores with the same tag', () => {
      const tag1 = Tag.build(getTagData());
      tag1.set('id', 1);

      const tag2 = Tag.build(getTagData());
      tag2.set('id', 2);

      const score1 = CommentSummaryScore.build(getCommentSummaryScoreData({tagId: 1, score: 0.5}));
      const score2 = CommentSummaryScore.build(getCommentSummaryScoreData({tagId: 2, score: 0.6}));
      const score3 = CommentSummaryScore.build(getCommentSummaryScoreData({tagId: 2, score: 0.8}));
      const scores = [score1, score2, score3];

      const expected = {
        1: 0.5,
        2: 0.8,
      };

      assert.deepEqual(compileScores(scores), expected);
    });
  });

  describe('resolveComment', () => {
    let comment: any;

    beforeEach(async () => {
      const category = await createCategory();
      const article = await createArticle({ categoryId: category.id });
      comment = await createComment({
        articleId: article.id,
        maxSummaryScore:  0.8,
      });
    });

    it('should accept a comment when a single "accept" action is ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 1,
          score: 0.5,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 1,
          lowerThreshold: 0.4,
          upperThreshold: 0.6,
          action: 'Accept',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isTrue(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isFalse(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should accept a comment when a single "accept" rule for Summary Score', async () => {
      const summaryTag = await Tag.build({
        label: 'Summary Score',
        key: 'SUMMARY_SCORE',
      });

      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: summaryTag.id,
          score: comment.get('maxSummaryScore'),
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: summaryTag.id,
          lowerThreshold: 0,
          upperThreshold: 1,
          action: 'Accept',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isTrue(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isFalse(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should accept a comment when unanimous "accept" actions are ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 3,
          score: 0.8,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 3,
          lowerThreshold: 0.7,
          upperThreshold: 0.9,
          action: 'Accept',
        }),

        ModerationRule.build({
          tagId: 3,
          lowerThreshold: 0.7,
          upperThreshold: 0.8,
          action: 'Accept',
        }),

        // This should be ignored

        ModerationRule.build({
          tagId: 3,
          lowerThreshold: 0.5,
          upperThreshold: 0.7,
          action: 'Reject',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = (await Comment.findById(comment.id))!;

      assert.isTrue(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isFalse(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should accept and highlight a comment when both "accept" and "highlight" actions are ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 1,
          score: 0.95,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 3,
          score: 0.8,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 1,
          lowerThreshold: 0.7,
          upperThreshold: 1,
          action: 'Highlight',
        }),

        ModerationRule.build({
          tagId: 3,
          lowerThreshold: 0.7,
          upperThreshold: 0.8,
          action: 'Accept',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = (await Comment.findById(comment.id))!;

      assert.isTrue(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isTrue(updated.get('isHighlighted'));
      assert.isFalse(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should defer a comment when both "accept" and "reject" actions are ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 1,
          score: 0.9,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 2,
          score: 0.8,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 1,
          lowerThreshold: 0.8,
          upperThreshold: 0.9,
          action: 'Reject',
        }),

        ModerationRule.build({
          tagId: 2,
          lowerThreshold: 0.7,
          upperThreshold: 0.8,
          action: 'Accept',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isNull(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isTrue(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should reject when a "reject" action is ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 29,
          score: 0.64,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 29,
          lowerThreshold: 0.5,
          upperThreshold: 1,
          action: 'Reject',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isFalse(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isFalse(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should reject when multiple "reject" actions are ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 46,
          score: 0.98,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 83,
          score: 0.87,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 46,
          lowerThreshold: 0.9,
          upperThreshold: 1,
          action: 'Reject',
        }),

        ModerationRule.build({
          tagId: 83,
          lowerThreshold: 0.5,
          upperThreshold: 1,
          action: 'Reject',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isFalse(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isFalse(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should defer when a "defer" action is ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 15,
          score: 0.64,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 15,
          lowerThreshold: 0.5,
          upperThreshold: 1,
          action: 'Defer',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = (await Comment.findById(comment.id));
      assert.isNotNull(updated);

      assert.isNull(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isTrue(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should defer when both "accept" and "defer" actions are ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 217,
          score: 0.45,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 415,
          score: 0.67,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 217,
          lowerThreshold: 0.4,
          upperThreshold: 0.9,
          action: 'Accept',
        }),

        ModerationRule.build({
          tagId: 415,
          lowerThreshold: 0.5,
          upperThreshold: 0.7,
          action: 'Defer',
        }),

        // Should be ignored...

        ModerationRule.build({
          tagId: 415,
          lowerThreshold: 0.7,
          upperThreshold: 0.9,
          action: 'Reject',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isNull(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isTrue(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should defer when "accept", "reject", and "defer" actions are ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 91,
          score: 0.31,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 294,
          score: 0.64,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 19,
          score: 0.85,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 91,
          lowerThreshold: 0.8,
          upperThreshold: 0.9,
          action: 'Accept',
        }),

        ModerationRule.build({
          tagId: 294,
          lowerThreshold: 0.7,
          upperThreshold: 0.8,
          action: 'Reject',
        }),

        ModerationRule.build({
          tagId: 19,
          lowerThreshold: 0.8,
          upperThreshold: 1,
          action: 'Defer',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isNull(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isTrue(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should highlight a comment if both "accept" and "highlight" actions are ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 81,
          score: 0.31,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 901,
          score: 0.64,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 901,
          lowerThreshold: 0.1,
          upperThreshold: 0.9,
          action: 'Accept',
        }),

        ModerationRule.build({
          tagId: 81,
          lowerThreshold: 0.3,
          upperThreshold: 0.4,
          action: 'Highlight',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isTrue(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isTrue(updated.get('isHighlighted'));
      assert.isFalse(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should defer and not highlight a comment if both "reject" and "highlight" actions are ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 2,
          score: 0.87,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 4,
          score: 0.43,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 6,
          score: 0.91,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 2,
          lowerThreshold: 0.8,
          upperThreshold: 0.9,
          action: 'Reject',
        }),

        ModerationRule.build({
          tagId: 4,
          lowerThreshold: 0.3,
          upperThreshold: 0.5,
          action: 'Highlight',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isNull(updated.get('isAccepted'), 'isAccepted');
      assert.isTrue(updated.get('isAutoResolved'), 'isAutoResolved');
      assert.isFalse(updated.get('isHighlighted'), 'isHighlighted');
      assert.isTrue(updated.get('isDeferred'), 'isDeferred');
      assert.isTrue(updated.get('isModerated'), 'isModerated');
      assert.isFalse(updated.get('isScored'), 'isScored');
    });

    it('should defer and not highlight a comment if both "defer" and "highlight" actions are ruled', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 5,
          score: 0.16,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 10,
          score: 0.92,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 15,
          score: 0.27,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 15,
          lowerThreshold: 0.2,
          upperThreshold: 0.3,
          action: 'Defer',
        }),

        ModerationRule.build({
          tagId: 10,
          lowerThreshold: 0.9,
          upperThreshold: 1,
          action: 'Highlight',
        }),

        // Should be ignored

        ModerationRule.build({
          tagId: 5,
          lowerThreshold: 0.3,
          upperThreshold: 0.5,
          action: 'Accept',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isNull(updated.get('isAccepted'), 'isAccepted');
      assert.isTrue(updated.get('isAutoResolved'), 'isAutoResolved');
      assert.isFalse(updated.get('isHighlighted'), 'isHighlighted');
      assert.isTrue(updated.get('isDeferred'), 'isDeferred');
      assert.isTrue(updated.get('isModerated'), 'isModerated');
      assert.isFalse(updated.get('isScored'), 'isScored');
    });

    it('should do nothing to the comment if no rules match', async () => {
      const scores = [
        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 4,
          score: 0.16,
        }),

        CommentSummaryScore.build({
          commentId: comment.id,
          tagId: 12,
          score: 0.92,
        }),
      ];

      const rules = [
        ModerationRule.build({
          tagId: 12,
          lowerThreshold: 0.2,
          upperThreshold: 0.3,
          action: 'Reject',
        }),

        ModerationRule.build({
          tagId: 4,
          lowerThreshold: 0.9,
          upperThreshold: 1,
          action: 'Highlight',
        }),
      ];

      await resolveComment(comment, scores, rules);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isNull(updated.get('isAccepted'), 'isAccepted');
      assert.isFalse(updated.get('isAutoResolved'), 'isAutoResolved');
      assert.isFalse(updated.get('isHighlighted'), 'isHighlighted');
      assert.isFalse(updated.get('isDeferred'), 'isDeferred');
      assert.isFalse(updated.get('isModerated'), 'isModerated');
      assert.isFalse(updated.get('isScored'), 'isScored');
    });
  });

  describe('processRulesForComment', () => {
    it('should do nothing if no matching rules are found', async () => {
      const category = await createCategory();
      const article = await createArticle({ categoryId: category.id });
      const comment = await createComment({ articleId: article.id });

      await processRulesForComment(comment);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isNull(updated.get('isAccepted'));
      assert.isFalse(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isFalse(updated.get('isDeferred'));
      assert.isFalse(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should do nothing if no comment scores are found', async () => {
      const category = await createCategory();
      const article = await createArticle({ categoryId: category.id });
      const comment = await createComment({ articleId: article.id });

      const [tag1, tag2] = await Promise.all([
        createTag(),
        createTag(),
      ]);

      await Promise.all([
        createModerationRule({ tagId: tag1.id }),
        createModerationRule({ tagId: tag2.id }),
      ]);

      await processRulesForComment(comment);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isNull(updated.get('isAccepted'));
      assert.isFalse(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isFalse(updated.get('isDeferred'));
      assert.isFalse(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should mark a comment accepted for matching rules', async () => {
      const category = await createCategory();
      const article = await createArticle({ categoryId: category.id });
      const comment = await createComment({ articleId: article.id });

      const [tag1, tag2] = await Promise.all([
        createTag(),
        createTag(),
      ]);

      await Promise.all([
        createModerationRule({
          tagId: tag1.id,
          lowerThreshold: 0.5,
          upperThreshold: 1,
          action: 'Accept',
        }),

        createModerationRule({
          tagId: tag2.id,
          lowerThreshold: 0.25,
          upperThreshold: 0.75,
          action: 'Accept',
        }),
      ]);

      await Promise.all([
        createCommentSummaryScore({
          commentId: comment.id,
          tagId: tag1.id,
          score: 0.75,
        }),

        createCommentSummaryScore({
          commentId: comment.id,
          tagId: tag2.id,
          score: 0.5,
        }),
      ]);

      await processRulesForComment(comment);
      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);

      assert.isTrue(updated.get('isAccepted'));
      assert.isTrue(updated.get('isAutoResolved'));
      assert.isFalse(updated.get('isHighlighted'));
      assert.isFalse(updated.get('isDeferred'));
      assert.isTrue(updated.get('isModerated'));
      assert.isFalse(updated.get('isScored'));
    });

    it('should do nothing if article has disabled rule processing', async () => {
      const category = await createCategory();
      const article = await createArticle({ categoryId: category.id, disableRules: true });
      const comment = await createComment({ articleId: article.id });

      const [tag1, tag2] = await Promise.all([
        createTag(),
        createTag(),
      ]);

      await Promise.all([
        createModerationRule({
          tagId: tag1.id,
          lowerThreshold: 0.5,
          upperThreshold: 1,
          action: 'Accept',
        }),
        createModerationRule({
          tagId: tag2.id,
          lowerThreshold: 0.25,
          upperThreshold: 0.75,
          action: 'Accept',
        }),
      ]);

      await Promise.all([
        createCommentSummaryScore({
          commentId: comment.id,
          tagId: tag1.id,
          score: 0.75,
        }),

        createCommentSummaryScore({
          commentId: comment.id,
          tagId: tag2.id,
          score: 0.5,
        }),
      ]);

      await processRulesForComment(comment);

      const updated = await Comment.findById(comment.id);
      assert.isNotNull(updated);
      assert.isNull(updated.get('isAccepted'));
    });
  });
});
