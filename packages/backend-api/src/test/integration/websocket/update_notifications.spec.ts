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
import { clearInterested } from '../../../models';

import { REPLY_SUCCESS_VALUE } from '../../../api/constants';
import { destroyUpdateNotificationService } from '../../../api/services/updateNotifications';
import { makeServer } from '../../../api/util/server';
import { mountAPI} from '../../../index';
import {
  assertAllArticlesMessage,
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

const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('websocket tests: update_notifications', () => {
  let app: any;
  let server: any;

  let user: User;
  let category: Category;
  let article: Article;

  before(async () => {
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

  it('Test we get notifications when setting article attributes', async () => {
    async function setArticleAttributes(isCommentingEnabled: boolean, isAutoModerated: boolean) {
      const data = {isCommentingEnabled, isAutoModerated};
      const apiClient = chai.request(app);
      const {status, body} = await apiClient.post(`/services/simple/article/update/${article.id}`).send(data);
      expect(status).is.equal(200);
      expect(body.status).is.equal(REPLY_SUCCESS_VALUE);
    }

    await listenForMessages(async () => {
        await setArticleAttributes(true, false);
        await sleep(50);
        await setArticleAttributes(false, true);
        await sleep(50);
        await setArticleAttributes(false, false);
        await sleep(50);
        await setArticleAttributes(true, true);
      },
      [
        (m: any) => { assertSystemMessage(m); },
        (m: any) => { assertAllArticlesMessage(m); },
        (m: any) => { assertUserMessage(m); },
        (m: any) => {
          assertArticleUpdateMessage(m);
          expect(m.data.articles[0].id).eq(article.id.toString());
          expect(m.data.articles[0].isAutoModerated).eq(false);
          expect(m.data.articles[0].isCommentingEnabled).eq(true);
        },
        (m: any) => {
          assertArticleUpdateMessage(m);
          expect(m.data.articles[0].isAutoModerated).eq(true);
          expect(m.data.articles[0].isCommentingEnabled).eq(false);
        },
        (m: any) => {
          assertArticleUpdateMessage(m);
          expect(m.data.articles[0].isAutoModerated).eq(false);
          expect(m.data.articles[0].isCommentingEnabled).eq(false);
        },
        (m: any) => {
          assertArticleUpdateMessage(m);
          expect(m.data.articles[0].isAutoModerated).eq(true);
          expect(m.data.articles[0].isCommentingEnabled).eq(true);
        },
      ]);
  });
});
