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

import * as express from 'express';
import {isEqual} from 'lodash';
import * as WebSocket from 'ws';

import {Comment, User} from '@conversationai/moderator-backend-core';
import {logger, registerInterest} from '@conversationai/moderator-backend-core';

interface IGlobalSummary {
  deferred: number;
}

interface IUserSummary {
  assignments: number;
}

interface IMessage {
  type: 'global' | 'user';
  data: IGlobalSummary | IUserSummary;
}

async function getGlobalSummary() {
  const deferred = await Comment.findAndCountAll({where: { isDeferred: true }, limit: 0});
  const users = await User.findAll({where: {group: ['admin', 'general']}});
  const userdata = users.map((u) => u.toJSON());

  return {
    type: 'global',
    data: {
      deferred: deferred['count'],
      users: userdata,
    },
  } as IMessage;
}

async function getUserSummary(userId: number) {
  const user = await User.findById(userId);
  const assignments = await user.countAssignments();

  return {
    type: 'user',
    data: {
      assignments: assignments,
    },
  } as IMessage;
}

interface ISocketItem {
  userId: number;
  ws: WebSocket;
  lastUserSummary: IUserSummary | null;
}

let lastGlobalSummaryMessage: IMessage | null = null;
const socketItems = new Map<number, ISocketItem>();

async function maybeSendUpdateToUser(si: ISocketItem, sendGlobal: boolean) {
  if (sendGlobal) {
    logger.info(`Sending global summary to user ${si.userId}`);
    si.ws.send(JSON.stringify(lastGlobalSummaryMessage!));
  }

  const userSummaryMessage = await getUserSummary(si.userId);
  if (!si.lastUserSummary || !isEqual(userSummaryMessage.data, si.lastUserSummary)) {
    logger.info(`Sending local summary to user ${si.userId}`);
    si.ws.send(JSON.stringify(userSummaryMessage));
    si.lastUserSummary = userSummaryMessage.data as IUserSummary;
  }
}

async function maybeSendUpdates() {
  const globalSummaryMessage = await getGlobalSummary();

  const sendGlobal = !isEqual(globalSummaryMessage.data, lastGlobalSummaryMessage!.data);
  if (sendGlobal) {
    lastGlobalSummaryMessage = globalSummaryMessage;
  }

  for (const si of socketItems.values()) {
    maybeSendUpdateToUser(si, sendGlobal);
  }
}

export function createUpdateNotificationService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.ws('/summary', async (ws, req) => {
    if (!req.user) {
      logger.error(`Attempt to create a socket without authentication.  Bail...`);
      ws.terminate();
      return;
    }

    const userId = req.user.id;
    let si = socketItems.get(userId);
    if (!si) {
      si = {userId, ws, lastUserSummary: null};
      socketItems.set(userId, si);
    }

    if (lastGlobalSummaryMessage === null) {
      logger.info(`Setting up notifications`);
      // First time through here, so register the notifier
      lastGlobalSummaryMessage = await getGlobalSummary();
      registerInterest(maybeSendUpdates);
    }

    ws.on('close', () => {
      socketItems.delete(userId);
    });

    maybeSendUpdateToUser(si, true);
  });

  return router;
}

// Used in testing
export function destroyUpdateNotificationService() {
  lastGlobalSummaryMessage = null;
  for (const si of socketItems.values()) {
    si.ws.close();
  }
  socketItems.clear();
}
