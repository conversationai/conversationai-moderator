/*
Copyright 2020 Google Inc.

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

import * as chai from 'chai';

import {denormalizeCountsForComment} from '../../../domain/comments';
import {
  Article,
  Comment,
  CommentFlag,
  CommentScore,
  CommentSummaryScore,
  CommentTopScore,
  Tag,
} from '../../../models';
import {
  expect,
  makeArticle,
  makeComment,
  makeCommentScore,
  makeCommentSummaryScore,
  makeCommentTopScore, makeFlag,
  makeTag,
} from '../../fixture';
import {app} from './test_helper';

const BASE_URL = `/services/simple`;

describe(BASE_URL, () => {
  let article1: Article;
  let article2: Article;
  let comment1: Comment;
  let comment2: Comment;
  let tag1: Tag;
  let tag2: Tag;

  before(async () => {
    article1 = await makeArticle({title: 'test article 1', text: 'this is the text for article 1'});
    article2 = await makeArticle({title: 'test article 2'});
    tag1 = await makeTag({key: 'tag1', label: 'tag1'});
    tag2 = await makeTag({key: 'tag2', label: 'tag2'});
    comment1 = await makeComment({
      articleId: article1.id,
      text: 'test comment 1',
      maxSummaryScore: 0.3,
      maxSummaryScoreTagId: tag2.id,
    });
    comment2 = await makeComment({articleId: article2.id, text: 'test comment 2', replyId: comment1.id});
    await makeCommentScore({commentId: comment1.id, tagId: tag1.id, score: 0.1, annotationStart: 3, annotationEnd: 4});
    const score2 = await makeCommentScore({commentId: comment1.id, tagId: tag1.id, score: 0.2, annotationStart: 5, annotationEnd: 6});
    const score3 = await makeCommentScore({commentId: comment1.id, tagId: tag2.id, score: 0.3, annotationStart: 7, annotationEnd: 8});
    await makeCommentTopScore(score2);
    await makeCommentTopScore(score3);
    await makeCommentSummaryScore({commentId: comment1.id, tagId: tag1.id, score: 0.15, isConfirmed: false});
    await makeCommentSummaryScore({commentId: comment1.id, tagId: tag2.id, score: 0.3, isConfirmed: false});
    await makeFlag({label: 'red', commentId: comment1.id});
    await makeFlag({label: 'red', commentId: comment1.id});
    await makeFlag({label: 'green', commentId: comment1.id, isResolved: true});
    await denormalizeCountsForComment(comment1);
  });

  after(async () => {
    await Article.destroy({where: {}});
    await CommentFlag.destroy({where: {}});
    await CommentTopScore.destroy({where: {}});
    await CommentSummaryScore.destroy({where: {}});
    await CommentScore.destroy({where: {}});
    await Comment.destroy({where: {}});
    await Tag.destroy({where: {}});
  });

  describe('article api tests', () => {
    it('fetch 1 and update', async () => {
      {
        const apiClient = chai.request(app);
        const {status, body} = await apiClient.post(`${BASE_URL}/article/get`).send([article1.id]);
        expect(status).to.equal(200);
        expect(body.length).to.equal(1);
        expect(body[0].title).to.equal('test article 1');
        expect(body[0].isCommentingEnabled).to.be.true;
        expect(body[0].isAutoModerated).to.be.true;
      }

      {
        const apiClient = chai.request(app);
        const {status} = await apiClient.post(`${BASE_URL}/article/update/${article1.id}`).send({
          isCommentingEnabled: false,
        });
        expect(status).to.equal(200);
      }

      {
        const apiClient = chai.request(app);
        const {status, body} = await apiClient.post(`${BASE_URL}/article/get`).send([article1.id]);
        expect(status).to.equal(200);
        expect(body[0].isCommentingEnabled).to.be.false;
        expect(body[0].isAutoModerated).to.be.true;
      }

      {
        const apiClient = chai.request(app);
        const {status} = await apiClient.post(`${BASE_URL}/article/update/${article1.id}`).send({
          isCommentingEnabled: true,
          isAutoModerated: false,
        });
        expect(status).to.equal(200);
      }

      {
        const apiClient = chai.request(app);
        const {status, body} = await apiClient.post(`${BASE_URL}/article/get`).send([article1.id]);
        expect(status).to.equal(200);
        expect(body[0].isCommentingEnabled).to.be.true;
        expect(body[0].isAutoModerated).to.be.false;
      }
    });

    it('fetch multiple', async () => {
      const apiClient = chai.request(app);
      const { status, body } = await apiClient.post(`${BASE_URL}/article/get`).send([article1.id, article2.id]);
      expect(status).to.equal(200);
      expect(body.length).to.equal(2);
      expect(body[0].title).to.equal('test article 1');
      expect(body[1].title).to.equal('test article 2');
    });

    it('fetch text', async () => {
      const apiClient = chai.request(app);
      const { status, body } = await apiClient.get(`${BASE_URL}/article/${article1.id}/text`);
      expect(status).to.equal(200);
      expect(body.text).to.equal('this is the text for article 1');
    });
  });

  describe('comment', () => {
    it('fetch 1 comment', async () => {
      const apiClient = chai.request(app);
      const {status, body} = await apiClient.post(`${BASE_URL}/comment/get`).send([comment1.id]);
      expect(status).to.equal(200);
      expect(body.length).to.equal(1);
      expect(body[0].text).to.equal('test comment 1');
      expect(body[0].replies).to.deep.equal([comment2.id.toString()]);
      expect(body[0].maxSummaryScore).to.equal(0.3);
      expect(body[0].maxSummaryScoreTagId).to.equal(tag2.id.toString());
      expect(body[0].summaryScores).to.deep.equal([
        { tagId: tag1.id.toString(), score: 0.15, topScore: {score: 0.2, start: 5, end: 6}},
        { tagId: tag2.id.toString(), score: 0.3, topScore: {score: 0.3, start: 7, end: 8}},
      ]);
      expect(body[0].unresolvedFlagsCount).to.equal(2);
      expect(body[0].flagsSummary).to.deep.equal({ red: [ 2, 2, 0 ], green: [ 1, 0, 0 ] });
    });

    it('fetch multiple comments', async () => {
      const apiClient = chai.request(app);
      const {status, body} = await apiClient.post(`${BASE_URL}/comment/get`).send([comment1.id, comment2.id]);
      expect(status).to.equal(200);
      expect(body.length).to.equal(2);
      expect(body[0].text).to.equal('test comment 1');
      expect(body[1].text).to.equal('test comment 2');
    });

    it('fetch scores', async () => {
      const apiClient = chai.request(app);
      const {status, body} = await apiClient.get(`${BASE_URL}/comment/${comment1.id}/scores`);
      expect(status).to.equal(200);
      expect(body.length).to.equal(3);
      expect(body.map((i: {[key: string]: any}) => i.score)).to.deep.equal([0.1, 0.2, 0.3]);
    });

    it('fetch flags', async () => {
      const apiClient = chai.request(app);
      const {status, body} = await apiClient.get(`${BASE_URL}/comment/${comment1.id}/flags`);
      expect(status).to.equal(200);
      expect(body.map((i: {[key: string]: any}) => i.label)).to.deep.equal(['red', 'red', 'green']);
    });
  });
});
