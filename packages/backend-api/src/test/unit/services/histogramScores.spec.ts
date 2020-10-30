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
  Article,
  Category,
  Comment,
  CommentSummaryScore,
  IArticleInstance,
  ICategoryInstance,
  Tag,
} from '../../../models';

import {
  expect,
  makeArticle,
  makeCategory,
  makeComment,
  makeCommentSummaryScore,
  makeTag,
} from '../../fixture';

import {
  getHistogramScoresForAllCategories,
  getHistogramScoresForArticle,
  getHistogramScoresForCategory,
  NotFoundError,
} from '../../../api/services/histogramScores/util';

describe('histogramScores Functions', () => {
  beforeEach(async () => {
    await CommentSummaryScore.destroy({where: {}});
    await Comment.destroy({where: {}});
    await Article.destroy({where: {}});
    await Category.destroy({where: {}});
    await Tag.destroy({where: {}});
  });

  describe('getHistogramScoresForAllCategories', () => {
    it('returns scores across all categories for tag', async () => {
      const tag = await makeTag({ key: 'SPAM', label: 'spam' });

      async function createScore(categoryLabel: string, scoreValue: number) {
        const category = await makeCategory({ label: categoryLabel });
        const article = await makeArticle({ categoryId: category.id });
        const comment = await makeComment({ articleId: article.id});
        const score = await makeCommentSummaryScore({ commentId: comment.id, tagId: tag.id, score: scoreValue });

        return { category, article, comment, score };
      }

      const result1 = await createScore('One', 1.0);
      const result2 = await createScore('Two', 0.5);

      const results = await getHistogramScoresForAllCategories(tag.id);

      expect(results).to.be.lengthOf(2);
      expect(results).to.deep.include({
        commentId: result1.comment.id,
        score: 1.0,
      });

      expect(results).to.deep.include({
        commentId: result2.comment.id,
        score: 0.5,
      });
    });

    it('throw if missing tag', async () => {
      let wasThrown = false;

      try {
        await getHistogramScoresForAllCategories(1);
      } catch (e) {
        wasThrown = true;
        expect(e).to.be.an.instanceOf(NotFoundError);
      } finally {
        expect(wasThrown).to.be.true;
      }
    });
  });

  describe('getHistogramScoresForCategory', () => {
    it('returns scores in a category for tag', async () => {
      const tag = await makeTag({ key: 'SPAM', label: 'spam' });
      const category1 = await makeCategory({ label: 'Category 1' });
      const category2 = await makeCategory({ label: 'Category 2' });

      async function createScore(scoreValue: number, category: ICategoryInstance) {
        const article = await makeArticle({ categoryId: category.id });
        const comment = await makeComment({ articleId: article.id});
        const score = await makeCommentSummaryScore({ commentId: comment.id, tagId: tag.id, score: scoreValue });

        return { article, comment, score };
      }

      const result1 = await createScore(1.0, category1);
      const result2 = await createScore(0.5, category1);

      // Should not appear
      await createScore(0.25, category2);

      const results = await getHistogramScoresForCategory(category1.id, tag.id);

      expect(results).to.be.lengthOf(2);
      expect(results).to.deep.include({
        commentId: result1.comment.id,
        score: 1.0,
      });

      expect(results).to.deep.include({
        commentId: result2.comment.id,
        score: 0.5,
      });
    });

    it('throw if missing category', async () => {
      const tag = await makeTag({ key: 'SPAM', label: 'spam' });
      let wasThrown = false;

      try {
        await getHistogramScoresForCategory(0, tag.id);
      } catch (e) {
        wasThrown = true;
        expect(e).to.be.an.instanceOf(NotFoundError);
      } finally {
        expect(wasThrown).to.be.true;
      }
    });

    it('throw if missing tag', async () => {
      const category = await makeCategory({ label: 'Category 1' });
      let wasThrown = false;

      try {
        await getHistogramScoresForCategory(category.id, 0);
      } catch (e) {
        wasThrown = true;
        expect(e).to.be.an.instanceOf(NotFoundError);
      } finally {
        expect(wasThrown).to.be.true;
      }
    });
  });

  describe('getHistogramScoresForArticle', () => {
    it('returns scores in an article for tag', async () => {
      const tag = await makeTag({ key: 'SPAM', label: 'spam' });
      const article1 = await makeArticle();
      const article2 = await makeArticle();

      async function createScore(scoreValue: number, article: IArticleInstance) {
        const comment = await makeComment({ articleId: article.id});
        const score = await makeCommentSummaryScore({ commentId: comment.id, tagId: tag.id, score: scoreValue });

        return { article, comment, score };
      }

      const result1 = await createScore(1.0, article1);
      const result2 = await createScore(0.5, article1);

      // Should not appear
      await createScore(0.25, article2);

      const results = await getHistogramScoresForArticle(article1.id, tag.id);

      expect(results).to.be.lengthOf(2);
      expect(results).to.deep.include({
        commentId: result1.comment.id,
        score: 1.0,
      });

      expect(results).to.deep.include({
        commentId: result2.comment.id,
        score: 0.5,
      });
    });

    it('throw if missing category', async () => {
      const tag = await makeTag({ key: 'SPAM', label: 'spam' });
      let wasThrown = false;

      try {
        await getHistogramScoresForArticle(0, tag.id);
      } catch (e) {
        wasThrown = true;
        expect(e).to.be.an.instanceOf(NotFoundError);
      } finally {
        expect(wasThrown).to.be.true;
      }
    });

    it('throw if missing tag', async () => {
      const article = await makeArticle();
      let wasThrown = false;

      try {
        await getHistogramScoresForArticle(article.id, 0);
      } catch (e) {
        wasThrown = true;
        expect(e).to.be.an.instanceOf(NotFoundError);
      } finally {
        expect(wasThrown).to.be.true;
      }
    });
  });
});
