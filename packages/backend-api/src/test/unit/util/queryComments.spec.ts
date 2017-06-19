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
  cacheCommentTopScores,
  calculateTopScores,
} from '@conversationai/moderator-backend-core';

import {
  expect,
  makeArticle,
  makeCategory,
  makeComment,
  makeCommentScore,
  makeTag,
  makeTaggingSensitivity,
} from '../../test_helper';

import {
  filterTopScoresByTaggingSensitivity,
} from '../../../api/util/queryComments';

describe('queryComments Functions', () => {
  describe('filterTopScoresByTaggingSensitivity', () => {
    beforeEach(async () => {
      this.category = await makeCategory({ label: 'Test' });

      const article = await makeArticle({ categoryId: this.category.get('id') });
      const articleId = article.get('id');

      this.tag = await makeTag({ key: 'SPAM', label: 'spam' });

      this.comment1 = await makeComment({ articleId });
      this.comment1['bottom'] = await makeCommentScore({ commentId: this.comment1.get('id'), tagId: this.tag.get('id'), score: 0, annotationStart: 0, annotationEnd: 1 });
      this.comment1['middle'] = await makeCommentScore({ commentId: this.comment1.get('id'), tagId: this.tag.get('id'), score: 0.5, annotationStart: 0, annotationEnd: 1 });
      this.comment1['top'] = await makeCommentScore({ commentId: this.comment1.get('id'), tagId: this.tag.get('id'), score: 1, annotationStart: 0, annotationEnd: 1 });
      await cacheCommentTopScores(this.comment1);

      this.comment2 = await makeComment({ articleId });
      this.comment2['bottom'] = await makeCommentScore({ commentId: this.comment2.get('id'), tagId: this.tag.get('id'), score: 0, annotationStart: 0, annotationEnd: 1 });
      this.comment2['middle'] = await makeCommentScore({ commentId: this.comment2.get('id'), tagId: this.tag.get('id'), score: 0.25, annotationStart: 0, annotationEnd: 1 });
      this.comment2['top'] = await makeCommentScore({ commentId: this.comment2.get('id'), tagId: this.tag.get('id'), score: 0.5, annotationStart: 0, annotationEnd: 1 });
      await cacheCommentTopScores(this.comment2);

      this.comments = [this.comment1, this.comment2];
      this.topScores = await calculateTopScores(this.comments, this.tag.get('id'));
    });

    it('returns all scores if no tagging sensitivity is set', async () => {
      const results = await filterTopScoresByTaggingSensitivity(this.topScores, this.tag.get('id'));

      expect(Object.keys(results)).to.be.lengthOf(2);

      this.comments.forEach((c: any) => {
        expect(results[c.get('id')]).to.deep.equal({
          commentId: c['top'].get('commentId'),
          score: c['top'].get('score'),
          start: c['top'].get('annotationStart'),
          end: c['top'].get('annotationEnd'),
        });
      });
    });

    it('uses global sensitivity', async () => {
      await makeTaggingSensitivity({ lowerThreshold: 0.25, upperThreshold: 0.75 });
      const results = await filterTopScoresByTaggingSensitivity(this.topScores, this.tag.get('id'));

      expect(Object.keys(results)).to.be.lengthOf(1);

      expect(results[this.comment2.get('id')]).to.deep.equal({
        commentId: this.comment2['top'].get('commentId'),
        score: this.comment2['top'].get('score'),
        start: this.comment2['top'].get('annotationStart'),
        end: this.comment2['top'].get('annotationEnd'),
      });
    });

    it('uses category sensitivity', async () => {
      // Global
      await makeTaggingSensitivity({ lowerThreshold: 0.25, upperThreshold: 0.75 });

      // Category
      await makeTaggingSensitivity({ categoryId: this.category.get('id'), lowerThreshold: 0.75, upperThreshold: 1.0 });

      const results = await filterTopScoresByTaggingSensitivity(this.topScores, this.tag.get('id'));

      expect(Object.keys(results)).to.be.lengthOf(1);

      expect(results[this.comment1.get('id')]).to.deep.equal({
        commentId: this.comment1['top'].get('commentId'),
        score: this.comment1['top'].get('score'),
        start: this.comment1['top'].get('annotationStart'),
        end: this.comment1['top'].get('annotationEnd'),
      });
    });

    it('uses tag sensitivity', async () => {
      // Global
      await makeTaggingSensitivity({ lowerThreshold: 0.25, upperThreshold: 0.75 });

      // Tag
      await makeTaggingSensitivity({ tagId: this.tag.get('id'), lowerThreshold: 0.75, upperThreshold: 1.0 });

      const results = await filterTopScoresByTaggingSensitivity(this.topScores, this.tag.get('id'));

      expect(Object.keys(results)).to.be.lengthOf(1);

      expect(results[this.comment1.get('id')]).to.deep.equal({
        commentId: this.comment1['top'].get('commentId'),
        score: this.comment1['top'].get('score'),
        start: this.comment1['top'].get('annotationStart'),
        end: this.comment1['top'].get('annotationEnd'),
      });
    });

    it('uses tag and category sensitivity', async () => {
      // Global
      await makeTaggingSensitivity({ lowerThreshold: 0.25, upperThreshold: 0.75 });

      // Category
      await makeTaggingSensitivity({ categoryId: this.category.get('id'), lowerThreshold: 0, upperThreshold: 0.5 });

      // Tag
      await makeTaggingSensitivity({ tagId: this.tag.get('id'), lowerThreshold: 0, upperThreshold: 0.6 });

      // Both
      await makeTaggingSensitivity({ tagId: this.tag.get('id'), categoryId: this.category.get('id'), lowerThreshold: 0.75, upperThreshold: 1.0 });

      const results = await filterTopScoresByTaggingSensitivity(this.topScores, this.tag.get('id'));

      expect(Object.keys(results)).to.be.lengthOf(1);

      expect(results[this.comment1.get('id')]).to.deep.equal({
        commentId: this.comment1['top'].get('commentId'),
        score: this.comment1['top'].get('score'),
        start: this.comment1['top'].get('annotationStart'),
        end: this.comment1['top'].get('annotationEnd'),
      });
    });
  });
});
