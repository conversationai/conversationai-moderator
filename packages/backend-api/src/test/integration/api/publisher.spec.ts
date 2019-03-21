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
import * as chai from 'chai';

import {
  Article, Comment,
} from '@conversationai/moderator-backend-core';

import { createArticleIfNonExistant, IArticleData } from '../../../api/publisher/articles';
import {
  expect,
  makeArticle,
  makeCategory,
  makeComment,
} from '../../test_helper';
import {
  app,
} from './test_helper';

const BASE_URL = `/publisher`;

let categoryIndex = 0;
async function makeArticleData(data: Partial<IArticleData> = {}): Promise<IArticleData> {
  const category = await makeCategory({ label: `category-${categoryIndex++}`});

  return {
    sourceId: 'publisher-id-1',
    categoryId: category.id.toString(),
    title: 'I am an article',
    text: 'Plenty of article text',
    url: 'http://example.com',
    createdAt: '2016-12-25T14:22:07+00:00',
    extra: {
      bonus: 'data',
    },
    ...data,
  };
}

function makeCommentData(data: any = {}): any {
  return {
    authorSourceId: 'authorId',
    text: 'Hello World',
    author: { name: 'Commentor' },
    createdAt: '2016-12-25T14:22:07+00:00',
    ...data,
  };
}

describe('Publisher API', () => {

  function prefixed(path: string): string {
    return `${BASE_URL}/${path}`;
  }

  function checkCreated(bodyData: any, ids: Array<string>) {
    for (const i of ids) {
      expect(bodyData[i]).to.be.an('string');
      delete bodyData[i];
    }
    expect(bodyData).to.deep.equal({});
  }

  beforeEach(async () => {
    await Comment.destroy({where: {}});
    await Article.destroy({where: {}});
  });

  describe(BASE_URL, () => {
    describe('/articles', () => {
      const url = prefixed('articles');

      it('should create a single article', async () => {
        const validArticleData1 = await makeArticleData();
        let was200 = false;

        try {
          const apiClient = chai.request(app);
          const { status, body } = await apiClient.post(url).send({
            data: validArticleData1,
          });

          expect(status).to.be.equal(200);
          was200 = true;

          checkCreated(body.data, [validArticleData1.sourceId]);
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should create a multiple articles', async () => {
        const validArticleData1 = await makeArticleData({ sourceId: 'one' });
        const validArticleData2 = await makeArticleData({ sourceId: 'two' });

        let was200 = false;

        try {
          const apiClient = chai.request(app);
          const { status, body } = await apiClient.post(url).send({
            data: [validArticleData1, validArticleData2],
          });

          expect(status).to.be.equal(200);
          was200 = true;

          checkCreated(body.data, [validArticleData1.sourceId, validArticleData2.sourceId]);
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should only create new articles', async () => {
        const validArticleData1 = await makeArticleData({ sourceId: 'one' });
        const validArticleData2 = await makeArticleData({ sourceId: 'two' });

        await createArticleIfNonExistant(validArticleData2);

        let was200 = false;

        try {
          const apiClient = chai.request(app);
          const { status, body } = await apiClient.post(url).send({
            data: [validArticleData1, validArticleData2],
          });

          expect(status).to.be.equal(200);
          was200 = true;

          checkCreated(body.data, [validArticleData1.sourceId, validArticleData2.sourceId]);
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should return 422 on bad schema', async () => {
        let was422 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.post(url).send({
            fakeData: {},
          });
          expect(status).to.be.equal(422);
          was422 = true;
        } catch (e) {
          console.log(e);
        } finally {
          expect(was422).to.be.true;
        }
      });
    });

    describe('/articles/:sourceId', () => {
      it('should update an article', async () => {
        const article = await makeArticle({ title: 'Title One' });
        const url = prefixed(`articles/${article.get('sourceId')}`);

        let was200 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.patch(url).send({
            data: {
              attributes: {
                title: 'Title Two',
              },
            },
          });

          expect(status).to.be.equal(200);
          was200 = true;

          const updatedArticle = (await Article.findOne({ where: { sourceId: article.get('sourceId') }}))!;

          expect(updatedArticle.get('title')).to.equal('Title Two');
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should return a 400 on missing article', async () => {
        let was400 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.patch(prefixed(`articles/fake-id`)).send({
            data: {
              attributes: { },
            },
          });
          expect(status).to.be.equal(400);
          was400 = true;
        } catch (e) {
          console.log(e);
        } finally {
          expect(was400).to.be.true;
        }
      });

      it('should return 422 on bad schema', async () => {
        let was422 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.patch(prefixed(`articles/fake-id`)).send({
            data: {
              fakeAttributes: { },
            },
          });
          expect(status).to.be.equal(422);
          was422 = true;
        } catch (e) {
          console.log(e);
        } finally {
          expect(was422).to.be.true;
        }
      });
    });

    describe('/comments', () => {
      const url = prefixed(`comments`);

      it('should create a single comment', async () => {
        let was200 = false;

        await makeArticle({ sourceId: 'articleId' });
        const commentData = makeCommentData({
          sourceId: 'sourceId',
          articleId: 'articleId',
        });

        try {
          const apiClient = chai.request(app);
          const { body, status } = await apiClient.post(url).send({
            data: commentData,
          });

          expect(status).to.be.equal(200);
          was200 = true;

          checkCreated(body.data, [commentData.sourceId]);
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should create multiple comments', async () => {
        let was200 = false;

        await makeArticle({ sourceId: 'articleId' });
        const commentData1 = makeCommentData({
          sourceId: 'sourceId',
          articleId: 'articleId',
        });
        const commentData2 = makeCommentData({
          sourceId: 'sourceId2',
          articleId: 'articleId',
        });

        try {
          const apiClient = chai.request(app);
          const { body, status } = await apiClient.post(url).send({
            data: [commentData1, commentData2],
          });

          expect(status).to.be.equal(200);
          was200 = true;

          checkCreated(body.data, [commentData1.sourceId, commentData2.sourceId]);
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should return 422 on bad schema', async () => {
        let was422 = false;

        try {
          const apiClient = chai.request(app);
          const { status } =  await apiClient.post(url).send({
            data: {
              fakeData: { },
            },
          });
          expect(status).to.be.equal(422);
          was422 = true;
        } catch (e) {
          console.log(e);
        } finally {
          expect(was422).to.be.true;
        }
      });
    });

    describe('/comments/tags', () => {
      const url = prefixed(`comments/tags`);

      it('should queue a single recommendation', async () => {
        const sourceCommentId = 'comment1';
        await makeComment({ sourceId: sourceCommentId });

        let was200 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.post(url).send({
            data: {
              type: 'recommendation',
              sourceUserId: 'user1',
              sourceCommentId,
            },
          });

          expect(status).to.be.equal(200);
          was200 = true;

          // Added to queue, can't be tested via API.
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should queue a single flag', async () => {
        const sourceCommentId = 'comment1';
        await makeComment({ sourceId: sourceCommentId });

        let was200 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.post(url).send({
            data: {
              type: 'flag',
              sourceUserId: 'user1',
              sourceCommentId,
            },
          });

          expect(status).to.be.equal(200);
          was200 = true;

          // Added to queue, can't be tested via API.
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should queue multiple mixed', async () => {
        const sourceCommentId = 'comment1';
        await makeComment({ sourceId: sourceCommentId });

        let was200 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.post(url).send({
            data: [
              {
                type: 'flag',
                sourceUserId: 'user1',
                sourceCommentId,
              },
              {
                type: 'recommendation',
                sourceUserId: 'user1',
                sourceCommentId,
              },
            ],
          });

          expect(status).to.be.equal(200);
          was200 = true;

          // Added to queue, can't be tested via API.
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should return 422 on bad schema', async () => {
        let was422 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.post(url).send({
            data: {
              type: 'flagtypo',
            },
          });
          expect(status).to.be.equal(422);
          was422 = true;
        } catch (e) {
          console.log(e);
        } finally {
          expect(was422).to.be.true;
        }
      });
    });

    describe('/comments/tags/revoke', () => {
      const url = prefixed(`comments/tags/revoke`);

      it('should queue a single recommendation revokation', async () => {
        const sourceCommentId = 'comment1';
        await makeComment({ sourceId: sourceCommentId });

        let was200 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.post(url).send({
            data: {
              type: 'recommendation',
              sourceUserId: 'user1',
              sourceCommentId,
            },
          });

          expect(status).to.be.equal(200);
          was200 = true;

          // Added to queue, can't be tested via API.
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should queue a single flag revokation', async () => {
        const sourceCommentId = 'comment1';
        await makeComment({ sourceId: sourceCommentId });

        let was200 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.post(url).send({
            data: {
              type: 'flag',
              sourceUserId: 'user1',
              sourceCommentId,
            },
          });

          expect(status).to.be.equal(200);
          was200 = true;

          // Added to queue, can't be tested via API.
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should queue multiple mixed revokations', async () => {
        const sourceCommentId = 'comment1';
        await makeComment({ sourceId: sourceCommentId });

        let was200 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.post(url).send({
            data: [
              {
                type: 'flag',
                sourceUserId: 'user1',
                sourceCommentId,
              },
              {
                type: 'recommendation',
                sourceUserId: 'user1',
                sourceCommentId,
              },
            ],
          });

          expect(status).to.be.equal(200);
          was200 = true;

          // Added to queue, can't be tested via API.
        } finally {
          expect(was200).to.be.true;
        }
      });

      it('should return 422 on bad schema', async () => {
        let was422 = false;

        try {
          const apiClient = chai.request(app);
          const { status } = await apiClient.post(url).send({
            data: {
              type: 'flagtypo',
            },
          });
          expect(status).to.be.equal(422);
          was422 = true;
        } catch (e) {
          console.log(e);
        } finally {
          expect(was422).to.be.true;
        }
      });
    });
  });
});
