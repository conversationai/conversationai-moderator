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
  denormalizeCommentCountsForArticle,
} from '@conversationai/moderator-backend-core';

import {
  Article,
  Category,
  Comment,
  ModeratorAssignment,
  User,
  UserCategoryAssignment,
} from '@conversationai/moderator-backend-core';
import {
  IArticleInstance,
  ICategoryInstance,
  IUserInstance,
} from '@conversationai/moderator-backend-core';

import { REPLY_SUCCESS_VALUE } from '../../../api/constants';
import {
  expect,
  makeArticle,
  makeCategory,
  makeComment,
  makeUser,
} from '../../test_helper';
import {
  app,
} from './test_helper';

const BASE_URL = `/services/assignments`;

describe(BASE_URL, () => {
  let category: ICategoryInstance;
  let article: IArticleInstance;
  let user: IUserInstance;

  beforeEach(async () => {
    await ModeratorAssignment.destroy({where: {}});
    await UserCategoryAssignment.destroy({where: {}});
    await Comment.destroy({where: {}});
    await Article.destroy({where: {}});
    await Category.destroy({where: {}});
    await User.destroy({where: {}});

    category = await makeCategory();
    article = await makeArticle({categoryId: category.id});
    await makeComment({articleId: article.id});
    denormalizeCommentCountsForArticle(article, false);
    user = await makeUser();
  });

  describe('/users/:id/count', () => {
    const url = `${BASE_URL}/users/:id/count`;

    it('Fetch counts of assigned comments', async () => {
      {
        const apiClient = chai.request(app);
        const {status, body} = await apiClient.get(url.replace(':id', user.id.toString()));
        expect(status).to.be.equal(200);
        expect(body.count).to.be.equal(0);
      }

      await ModeratorAssignment.create({
        userId: user.id,
        articleId: article.id,
      });

      {
        const apiClient = chai.request(app);
        const {status, body} = await apiClient.get(url.replace(':id', user.id.toString()));
        expect(status).to.be.equal(200);
        expect(body.count).to.be.equal(1);
      }
    });
  });

  describe('/categories/:id', () => {
    const url = `${BASE_URL}/categories/:id`;
    it('Assign a moderator to a category', async () => {
      const bca = await UserCategoryAssignment.findAndCountAll({where: {}});
      expect(bca.count).to.be.equal(0);
      const baa = await ModeratorAssignment.findAndCountAll({where: {}});
      expect(baa.count).to.be.equal(0);

      {
        const apiClient = chai.request(app);
        const {status, body} = await apiClient.post(url.replace(':id', category.id.toString())).send({data: [user.id]});
        expect(status).to.be.equal(200);
        expect(body.status).to.be.equal(REPLY_SUCCESS_VALUE);

        const aca = await UserCategoryAssignment.findAndCountAll({where: {}});
        expect(aca.count).to.be.equal(1);
        const aaa = await ModeratorAssignment.findAndCountAll({where: {}});
        expect(aaa.count).to.be.equal(1);
      }

      {
        const apiClient = chai.request(app);
        const {status, body} = await apiClient.post(url.replace(':id', category.id.toString())).send({data: []});
        expect(status).to.be.equal(200);
        expect(body.status).to.be.equal(REPLY_SUCCESS_VALUE);

        const aca = await UserCategoryAssignment.findAndCountAll({where: {}});
        expect(aca.count).to.be.equal(0);
        const aaa = await ModeratorAssignment.findAndCountAll({where: {}});
        expect(aaa.count).to.be.equal(0);
      }
    });
  });
});
