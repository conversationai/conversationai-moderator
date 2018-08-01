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
import * as WebSocket from 'ws';

import { clearInterested, makeServer } from '@conversationai/moderator-backend-core';

import {destroyUpdateNotificationService} from '../../../api/services/updateNotifications';
import {mountAPI} from '../../../index';
import {
  expect,
  makeArticle,
  makeCategory,
  makeUser,
  sleep,
} from '../../test_helper';

const chaiHttp = require('chai-http');
chai.use(chaiHttp);

describe('websocket tests: assign moderators', () => {
  let app: any;
  let server: any;
  let socket: any;
  let gotClose = false;
  let gotMessage = 0;

  let user: any;
  let category: any;
  let article: any;

  beforeEach(async () => {
    user = await makeUser();

    category = await makeCategory();
    article = await makeArticle({categoryId: category.id});

    const serverStuff = makeServer(true);
    app = serverStuff.app;
    app.use('/', (req: any, _: any, next: () => void) => {
      req.user = user;
      next();
    });

    app.use('/', mountAPI(true));
    server = serverStuff.start(3000);
    socket = new WebSocket('ws://localhost:3000/services/updates/summary');
    socket.onclose = () => {
      gotClose = true;
    };

    socket.onmessage = () => {
      gotMessage += 1;
    };
    await sleep(500);
    expect(gotClose).is.false;
    expect(gotMessage).is.equal(2);
    gotMessage = 0;
  });

  afterEach(async () => {
    await socket.close();
    await server.close();
    await clearInterested();
    await sleep(500);
    gotClose = false;
    gotMessage = 0;
    destroyUpdateNotificationService();
  });

  it('Test we get notifications when moderators assigned to categories', async () => {
    // Assign a moderator to the category
    gotMessage = 0;
    {
      const apiClient = chai.request(app);
      const {status, body} = await apiClient.post(`/services/assignments/categories/${category.id}`).send({data: [user.id]});
      expect(status).to.be.equal(200);
      expect(body.status).to.be.equal('success');
    }

    await sleep(500);
    expect(gotMessage).is.greaterThan(1);

    // Remove moderator from the category
    gotMessage = 0;
    {
      const apiClient = chai.request(app);
      const {status, body} = await apiClient.post(`/services/assignments/categories/${category.id}`).send({data: []});
      expect(status).to.be.equal(200);
      expect(body.status).to.be.equal('success');
    }

    await sleep(500);
    expect(gotMessage).is.greaterThan(1);
  });

  it('Test we get notifications when moderators assigned to articles', async () => {
    // Assign a moderator to the article
    gotMessage = 0;
    {
      const apiClient = chai.request(app);
      const {status} = await apiClient.patch(`/rest/articles/${article.id}/relationships/assignedModerators`).send({data: [{id: user.id}]});
      expect(status).to.be.equal(204);
    }

    await sleep(500);
    expect(gotMessage).is.equal(1);

    // Remove moderator assignment
    gotMessage = 0;
    {
      const apiClient = chai.request(app);
      const {status} = await apiClient.patch(`/rest/articles/${article.id}/relationships/assignedModerators`).send({data: []});
      expect(status).to.be.equal(204);
    }

    await sleep(500);
    expect(gotMessage).is.equal(1);
  });
});
