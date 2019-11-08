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
  Article, Category, Comment, Tag, TaggingSensitivity,
} from '../../../models';
import {
  ICategoryInstance,
  ICommentInstance,
  ICommentScoreInstance,
  ITagInstance,
} from '../../../models';

import {
  expect,
  makeArticle,
  makeCategory,
  makeComment,
  makeCommentScore,
  makeTag,
  makeTaggingSensitivity,
} from '../../fixture';

import {
  filterTopScoresByTaggingSensitivity,
} from '../../../api/util/queryComments';
import {
  cacheCommentTopScores,
  calculateTopScores,
  ITopScores,
} from '../../../domain';

describe('queryComments Functions', () => {
  describe('filterTopScoresByTaggingSensitivity', () => {
    let category: ICategoryInstance;
    let tag: ITagInstance;
    let comment1: ICommentInstance;
    let comment2: ICommentInstance;
    let topScores: ITopScores;
    let comment1Top: ICommentScoreInstance;
    let comment2Top: ICommentScoreInstance;

    beforeEach(async () => {
      await Comment.destroy({where: {}});
      await Article.destroy({where: {}});
      await Category.destroy({where: {}});
      await Tag.destroy({where: {}});
      await TaggingSensitivity.destroy({where: {}});

      category = await makeCategory({ label: 'Test' });

      const article = await makeArticle({ categoryId: category.id });
      const articleId = article.id;

      tag = await makeTag({ key: 'SPAM', label: 'spam' });

      comment1 = await makeComment({ articleId });
      await makeCommentScore({ commentId: comment1.id, tagId: tag.id, score: 0, annotationStart: 0, annotationEnd: 1 });
      await makeCommentScore({ commentId: comment1.id, tagId: tag.id, score: 0.5, annotationStart: 0, annotationEnd: 1 });
      comment1Top = await makeCommentScore({ commentId: comment1.id, tagId: tag.id, score: 1, annotationStart: 0, annotationEnd: 1 });
      await cacheCommentTopScores(comment1);

      comment2 = await makeComment({ articleId });
      await makeCommentScore({ commentId: comment2.id, tagId: tag.id, score: 0, annotationStart: 0, annotationEnd: 1 });
      await makeCommentScore({ commentId: comment2.id, tagId: tag.id, score: 0.25, annotationStart: 0, annotationEnd: 1 });
      comment2Top = await makeCommentScore({ commentId: comment2.id, tagId: tag.id, score: 0.5, annotationStart: 0, annotationEnd: 1 });
      await cacheCommentTopScores(comment2);

      topScores = await calculateTopScores([comment1, comment2], tag.id);
    });

    it('returns all scores if no tagging sensitivity is set', async () => {
      const results = await filterTopScoresByTaggingSensitivity(topScores, tag.id);

      expect(Object.keys(results)).to.be.lengthOf(2);
      expect(results[comment1.id]).to.deep.equal({
        commentId: comment1Top.commentId,
        score: comment1Top.score,
        start: comment1Top.annotationStart,
        end: comment1Top.annotationEnd,
      });
      expect(results[comment2.id]).to.deep.equal({
        commentId: comment2Top.commentId,
        score: comment2Top.score,
        start: comment2Top.annotationStart,
        end: comment2Top.annotationEnd,
      });
    });

    it('uses global sensitivity', async () => {
      await makeTaggingSensitivity({ lowerThreshold: 0.25, upperThreshold: 0.75 });
      const results = await filterTopScoresByTaggingSensitivity(topScores, tag.id);

      expect(Object.keys(results)).to.be.lengthOf(1);

      expect(results[comment2.id]).to.deep.equal({
        commentId: comment2Top.commentId,
        score: comment2Top.score,
        start: comment2Top.annotationStart,
        end: comment2Top.annotationEnd,
      });
    });

    it('uses category sensitivity', async () => {
      // Global
      await makeTaggingSensitivity({ lowerThreshold: 0.25, upperThreshold: 0.75 });

      // Category
      await makeTaggingSensitivity({ categoryId: category.id, lowerThreshold: 0.75, upperThreshold: 1.0 });

      const results = await filterTopScoresByTaggingSensitivity(topScores, tag.id);

      expect(Object.keys(results)).to.be.lengthOf(1);

      expect(results[comment1.id]).to.deep.equal({
        commentId: comment1Top.commentId,
        score: comment1Top.score,
        start: comment1Top.annotationStart,
        end: comment1Top.annotationEnd,
      });
    });

    it('uses tag sensitivity', async () => {
      // Global
      await makeTaggingSensitivity({ lowerThreshold: 0.25, upperThreshold: 0.75 });

      // Tag
      await makeTaggingSensitivity({ tagId: tag.id, lowerThreshold: 0.75, upperThreshold: 1.0 });

      const results = await filterTopScoresByTaggingSensitivity(topScores, tag.id);

      expect(Object.keys(results)).to.be.lengthOf(1);

      expect(results[comment1.id]).to.deep.equal({
        commentId: comment1Top.commentId,
        score: comment1Top.score,
        start: comment1Top.annotationStart,
        end: comment1Top.annotationEnd,
      });
    });

    it('uses tag and category sensitivity', async () => {
      // Global
      await makeTaggingSensitivity({ lowerThreshold: 0.25, upperThreshold: 0.75 });

      // Category
      await makeTaggingSensitivity({ categoryId: category.id, lowerThreshold: 0, upperThreshold: 0.5 });

      // Tag
      await makeTaggingSensitivity({ tagId: tag.id, lowerThreshold: 0, upperThreshold: 0.6 });

      // Both
      await makeTaggingSensitivity({ tagId: tag.id, categoryId: category.id, lowerThreshold: 0.75, upperThreshold: 1.0 });

      const results = await filterTopScoresByTaggingSensitivity(topScores, tag.id);

      expect(Object.keys(results)).to.be.lengthOf(1);

      expect(results[comment1.id]).to.deep.equal({
        commentId: comment1Top.commentId,
        score: comment1Top.score,
        start: comment1Top.annotationStart,
        end: comment1Top.annotationEnd,
      });
    });
  });
});
