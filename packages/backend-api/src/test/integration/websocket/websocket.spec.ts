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

import * as WebSocket from 'ws';

import { User } from '@conversationai/moderator-backend-core';
import { clearInterested, makeServer } from '@conversationai/moderator-backend-core';

import {mountAPI} from '../../../index';
import {
  assertAllArticlesMessage,
  assertSystemMessage, assertUserMessage,
  expect, listenForMessages,
  makeUser,
  sleep,
} from '../../test_helper';
import {destroyUpdateNotificationService} from '../../../api/services/updateNotifications';

describe('websocket tests', () => {
  beforeEach(async () => {
    await User.destroy({where: {}});
  });

  it('Test what we get when connect without authentication', async () => {
    const serverStuff = makeServer(true);
    const app = serverStuff.app;
    app.use('/', await mountAPI(true));
    const server = serverStuff.start(3000);

    try {
      let gotClose = false;
      let gotMessage = false;
      const socket = new WebSocket('ws://localhost:3000/services/updates/summary');

      socket.onclose = () => {
        gotClose = true;
      };

      socket.onmessage = () => {
        gotMessage = true;
      };

      await sleep(100);

      expect(gotMessage).is.false;
      expect(gotClose).is.true;
    }
    finally {
      server.close();
    }
  });

  it('Test what we get when connect with authentication', async () => {
    const user = await makeUser();

    const serverStuff = makeServer(true);
    const app = serverStuff.app;
    app.use('/', (req, _, next) => {
      req.user = user;
      next();
    });
    app.use('/', await mountAPI(true));
    const server = serverStuff.start(3000);

    try {
      await listenForMessages(async () => {
          await sleep(10);
        },
        [
          (m: any) => { assertSystemMessage(m); },
          (m: any) => { assertAllArticlesMessage(m); },
          (m: any) => { assertUserMessage(m); },
        ]);
    }
    finally {
      server.close();
      await clearInterested();
      destroyUpdateNotificationService();
    }
  });
});
