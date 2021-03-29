/*
Copyright 2019 Google Inc.

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

import { Article, Category, User } from '../../../models';
import { clearInterested } from '../../../notification_router';

import { REPLY_SUCCESS_VALUE } from '../../../api/constants';
import { destroyUpdateNotificationService } from '../../../api/services/updateNotifications';
import { makeServer } from '../../../api/util/server';
import { mountAPI } from '../../../index';
import {
  assertGlobalMessage,
  assertArticleUpdateMessage,
  assertSystemMessage,
  assertUserMessage,
  expect,
  listenForMessages,
  makeArticle,
  makeCategory,
  makeUser,
  sleep,
} from '../../fixture';

import chaiHttp = require('chai-http');
import {cleanDatabase} from '../../test_helper';
chai.use(chaiHttp);

describe('websocket tests: assign moderators', () => {
  let app: any;
  let server: any;

  let user: User;
  let category: Category;
  let article: Article;

  before(async () => {
    await cleanDatabase();
    await Article.destroy({where: {}});
    await Category.destroy({where: {}});
    await User.destroy({where: {}});

    user = await makeUser();

    category = await makeCategory();
    article = await makeArticle({categoryId: category.id});

    const serverStuff = makeServer(true);
    app = serverStuff.app;
    app.use('/', (req: any, _: any, next: () => void) => {
      req.user = user;
      next();
    });

    app.use('/', await mountAPI(true));
    server = serverStuff.start(3000);
  });

  after(async () => {
    await server.close();
    await clearInterested();
    destroyUpdateNotificationService();
  });

  it('Test we get notifications when moderators assigned to categories', async () => {
    async function assignCategoryModerator(data: Array<number>) {
      const apiClient = chai.request(app);
      const {status, body} = await apiClient.post(`/services/assignments/categories/${category.id}`).send({data});
      expect(status).is.equal(200);
      expect(body.status).is.equal(REPLY_SUCCESS_VALUE);
    }

    await listenForMessages(async () => {
      await assignCategoryModerator([user.id]);
      await sleep(100);
      await assignCategoryModerator([]);
    },
    [
      (m: any) => { assertSystemMessage(m); },
      (m: any) => { assertGlobalMessage(m); },
      (m: any) => { assertUserMessage(m); },
      (m: any) => {
        assertGlobalMessage(m);
        expect(m.data.categories.length).eq(1);
        expect(m.data.categories[0].assignedModerators.length).eq(1);
        expect(m.data.categories[0].assignedModerators[0]).eq(user.id.toString());
        expect(m.data.articles.length).eq(1);
        expect(m.data.articles[0].assignedModerators.length).eq(1);
        expect(m.data.articles[0].assignedModerators[0]).eq(user.id.toString());
      },
      (m: any) => { assertArticleUpdateMessage(m); },
      (m: any) => {
        assertGlobalMessage(m);
        expect(m.data.categories.length).eq(1);
        expect(m.data.categories[0].assignedModerators.length).eq(0);
        expect(m.data.articles.length).eq(1);
        expect(m.data.articles[0].assignedModerators.length).eq(0);
      },
      (m: any) => { assertArticleUpdateMessage(m); },
    ]);
  });

  it('Test we get notifications when moderators assigned to articles', async () => {
    async function assignArticleModerator(data: Array<number>) {
      const apiClient = chai.request(app);
      const {status} = await apiClient.post(`/services/assignments/article/${article.id}`).send({data});
      expect(status).is.equal(200);
    }

    await listenForMessages(async () => {
      await assignArticleModerator([user.id]);
      await sleep(100);
      await assignArticleModerator([]);
    },
    [
      (m: any) => { assertSystemMessage(m); },
      (m: any) => { assertGlobalMessage(m); },
      (m: any) => { assertUserMessage(m); },
      (m: any) => {
        assertArticleUpdateMessage(m);
        expect(m.data.categories[0].assignedModerators.length).eq(0);
        expect(m.data.articles[0].assignedModerators.length).eq(1);
        expect(m.data.articles[0].assignedModerators[0]).eq(user.id.toString());
      },
      (m: any) => {
        assertArticleUpdateMessage(m);
        expect(m.data.categories[0].assignedModerators.length).eq(0);
        expect(m.data.articles[0].assignedModerators.length).eq(0);
      },
    ]);
  });
});
