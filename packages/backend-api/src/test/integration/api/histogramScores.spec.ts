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

import { cacheCommentTopScores } from '@conversationai/moderator-backend-core';
import * as chai from 'chai';
import {
  expect,
  makeArticle,
  makeCategory,
  makeComment,
  makeCommentSummaryScore,
  makeTag,
} from '../../test_helper';
import {
  app,
} from './test_helper';

const BASE_URL = `/services/histogramScores`;

describe(BASE_URL, () => {

  describe('/articles/:articleId/tags/:tagId', () => {

    it('returns scores in the article and tag', async () => {
      const apiClient = chai.request(app);

      const article = await makeArticle();
      const articleId = article.id;

      const tag = await makeTag({ key: 'SPAM', label: 'spam' });
      const tagId = tag.id;

      const comment1 = await makeComment({ articleId });
      const commentSummaryScore1 = await makeCommentSummaryScore({ commentId: comment1.id, tagId, score: 1.0 });

      const comment2 = await makeComment({ articleId });
      const commentSummaryScore2 = await makeCommentSummaryScore({ commentId: comment2.id, tagId, score: 0.25 });

      // Should ignore non scored
      await makeComment({ articleId, isScored: false });

      const { body } = await apiClient.get(`${BASE_URL}/articles/${articleId}/tags/${tagId}`);

      // Only comment 2 should be present, because its score is between the rule 0-0.5

      expect(body.data).to.be.lengthOf(2);

      expect(body.data).to.deep.include({
        commentId: comment1.id.toString(),
        score: commentSummaryScore1.get('score'),
      });

      expect(body.data).to.deep.include({
        commentId: comment2.id.toString(),
        score: commentSummaryScore2.get('score'),
      });
    });

    it('returns a 404 for missing article', async () => {
      let was404 = false;

      try {
        const apiClient = chai.request(app);
        const { status } = await apiClient.get(`${BASE_URL}/articles/0/tags/0`);
        expect(status).to.be.equal(404);
        was404 = true;
      } catch (e) {
        console.log(e);
      } finally {
        expect(was404).to.be.true;
      }
    });

    it('returns a 404 for missing tag', async () => {
      let was404 = false;
      const article = await makeArticle();
      const articleId = article.id;

      try {
        const apiClient = chai.request(app);
        const { status } = await apiClient.get(`${BASE_URL}/articles/${articleId}/tags/0`);
        expect(status).to.be.equal(404);
        was404 = true;
      } catch (e) {
        console.log(e);
      } finally {
        expect(was404).to.be.true;
      }
    });
  });

  describe('/categories/:categoryId/tags/:tagId', () => {

    it('returns scores in the category and tag', async () => {
      const category1 = await makeCategory({ label: 'One' });
      const categoryId1 = category1.id;

      const article1 = await makeArticle({ categoryId: categoryId1 });
      const articleId1 = article1.id;

      const category2 = await makeCategory({ label: 'Two' });
      const categoryId2 = category2.id;

      const article2 = await makeArticle({ categoryId: categoryId2 });
      const articleId2 = article2.id;

      const tag = await makeTag({ key: 'SPAM', label: 'spam' });
      const tagId = tag.id;

      const comment1 = await makeComment({ articleId: articleId1 });
      const commentSummaryScore1 = await makeCommentSummaryScore({ commentId: comment1.id, tagId, score: 1.0 });
      await cacheCommentTopScores(comment1);

      const comment2 = await makeComment({ articleId: articleId1 });
      const commentSummaryScore2 = await makeCommentSummaryScore({ commentId: comment2.id, tagId, score: 0.25 });
      await cacheCommentTopScores(comment2);

      // Should ignore non scored
      await makeComment({ articleId: articleId2, isScored: true });
      await makeComment({ articleId: articleId2, isScored: false });

      const apiClient = chai.request(app);
      const { body } = await apiClient.get(`${BASE_URL}/categories/${categoryId1}/tags/${tagId}`);

      expect(body.data).to.be.lengthOf(2);

      expect(body.data).to.deep.include({
        commentId: comment1.id.toString(),
        score: commentSummaryScore1.get('score'),
      });

      expect(body.data).to.deep.include({
        commentId: comment2.id.toString(),
        score: commentSummaryScore2.get('score'),
      });
    });

    it('returns a 404 for missing article', async () => {
      let was404 = false;

      try {
        const apiClient = chai.request(app);
        const { status } = await apiClient.get(`${BASE_URL}/categories/0/tags/0`);
        expect(status).to.be.equal(404);
        was404 = true;
      } catch (e) {
        console.log(e);
      } finally {
        expect(was404).to.be.true;
      }
    });

    it('returns a 404 for missing tag', async () => {
      let was404 = false;
      const category = await makeCategory({ label: 'One' });
      const categoryId = category.id;

      try {
        const apiClient = chai.request(app);
        const { status } = await apiClient.get(`${BASE_URL}/categories/${categoryId}/tags/0`);
        expect(status).to.be.equal(404);
        was404 = true;
      } catch (e) {
        console.log(e);
      } finally {
        expect(was404).to.be.true;
      }
    });
  });
});
