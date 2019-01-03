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
import { isEqual, pick } from 'lodash';
import * as WebSocket from 'ws';

import {
  Article, Category, Comment, ModerationRule, Preselect, Tag, TaggingSensitivity, User,
} from '@conversationai/moderator-backend-core';
import {
  IArticleInstance, ICategoryInstance, IModerationRuleInstance, IPreselectInstance,
  ITaggingSensitivityInstance, ITagInstance, IUserInstance,
} from '@conversationai/moderator-backend-core';
import { logger, registerInterest } from '@conversationai/moderator-backend-core';

const tagFields = ['id', 'color', 'description', 'key', 'label', 'isInBatchView', 'inSummaryScore', 'isTaggable'];
const rangeFields = ['id', 'categoryId', 'lowerThreshold', 'upperThreshold', 'tagId'];
const taggingSensitivityFields = rangeFields;
const ruleFields = ['action', 'createdBy', ...rangeFields];
const preselectFields = rangeFields;
const userFields = ['id', 'name', 'email', 'avatarURL', 'group', 'isActive'];

const commonFields = ['id', 'updatedAt', 'allCount', 'unprocessedCount', 'unmoderatedCount', 'moderatedCount',
  'approvedCount', 'highlightedCount', 'rejectedCount', 'deferredCount', 'flaggedCount',
  'batchedCount', 'recommendedCount', 'assignedModerators', ];
const categoryFields = [...commonFields, 'label'];
const articleFields = [...commonFields, 'title', 'url', 'categoryId', 'sourceCreatedAt', 'lastModeratedAt',
  'isCommentingEnabled', 'isAutoModerated'];

interface ISystemSummary {
  tags: any;
  taggingSensitivities: any;
  rules: any;
  preselects: any;
}

interface IGlobalSummary {
  users: any;
  categories: any;
  articles: any;
  deferred: number;
}

interface IUserSummary {
  assignments: number;
}

interface IMessage {
  type: 'system' | 'global' | 'user';
  data: ISystemSummary | IGlobalSummary | IUserSummary;
}

async function getSystemSummary() {
  const tags = await Tag.findAll({});
  const tagdata = tags.map((t: ITagInstance) => {
    return pick(t.toJSON(), tagFields);
  });

  const taggingSensitivities = await TaggingSensitivity.findAll({});
  const tsdata = taggingSensitivities.map((t: ITaggingSensitivityInstance) => {
    return pick(t.toJSON(), taggingSensitivityFields);
  });

  const rules = await ModerationRule.findAll({});
  const ruledata = rules.map((r: IModerationRuleInstance) => {
    return pick(r.toJSON(), ruleFields);
  });

  const preselects = await Preselect.findAll({});
  const preselectdata = preselects.map((p: IPreselectInstance) => {
    return pick(p.toJSON(), preselectFields);
  });

  return {
    type: 'system',
    data: {
      tags: tagdata,
      taggingSensitivities: tsdata,
      rules: ruledata,
      preselects: preselectdata,
    },
  } as IMessage;
}

async function getGlobalSummary() {
  const users = await User.findAll({where: {group: ['admin', 'general']}});
  const userdata = users.map((u: IUserInstance) => {
    return pick(u.toJSON(), userFields);
  });

  const categories = await Category.findAll({
    where: {isActive: true},
    include: [{ model: User, as: 'assignedModerators', attributes: ['id']}],
  });
  const categoryIds: Array<number> = [];
  const categorydata = categories.map((c: ICategoryInstance) => {
    categoryIds.push(c.id);
    return pick(c.toJSON(), categoryFields);
  });

  const articles = await Article.findAll({
    where: {$or: [{categoryId: null}, {categoryId: categoryIds}]},
    include: [{ model: User, as: 'assignedModerators', attributes: ['id']}],
  });
  const articledata = articles.map((a: IArticleInstance) => {
    return pick(a.toJSON(), articleFields);
  });

  const deferred = await Comment.findAndCountAll({where: { isDeferred: true }, limit: 0});

  return {
    type: 'global',
    data: {
      users: userdata,
      categories: categorydata,
      articles: articledata,
      deferred: deferred['count'],
    },
  } as IMessage;
}

async function getUserSummary(userId: number) {
  const user = (await User.findById(userId))!;
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
  ws: Array<WebSocket>;
  lastUserSummary: IUserSummary | null;
}

let lastGlobalSummaryMessage: IMessage | null = null;
let lastSystemSummaryMessage: IMessage | null = null;
const socketItems = new Map<number, ISocketItem>();

function removeSocket(si: ISocketItem, ws: WebSocket) {
  const index = si.ws.indexOf(ws);
  if (index >= 0) {
    si.ws.splice(index, 1);
  }
  if (si.ws.length === 0) {
    socketItems.delete(si.userId);
  }
}

async function refreshGlobalMessages(alwaysSend: boolean) {
  let sendSystem = alwaysSend;
  if (!lastSystemSummaryMessage) {
    lastSystemSummaryMessage = await getSystemSummary();
    sendSystem = true;
  }
  else if (!alwaysSend) {
    const newMessage = await getSystemSummary();
    sendSystem = !isEqual(newMessage.data, lastSystemSummaryMessage.data);
    if (sendSystem) {
      lastSystemSummaryMessage = newMessage;
    }
  }

  let sendGlobal = alwaysSend;
  if (!lastGlobalSummaryMessage) {
    lastGlobalSummaryMessage = await getGlobalSummary();
    sendGlobal = true;
  }
  else if (!alwaysSend) {
    const newMessage = await getGlobalSummary();
    sendGlobal = !isEqual(newMessage.data, lastGlobalSummaryMessage.data);
    if (sendGlobal) {
      lastGlobalSummaryMessage = newMessage;
    }
  }

  return {sendSystem, sendGlobal, sendUser: alwaysSend};
}

async function maybeSendUpdateToUser(si: ISocketItem,
                                     {sendSystem, sendGlobal, sendUser}: {sendSystem: boolean, sendGlobal: boolean, sendUser: boolean}) {
  const userSummaryMessage = await getUserSummary(si.userId);
  sendUser = sendUser || !si.lastUserSummary || !isEqual(userSummaryMessage.data, si.lastUserSummary);

  for (const ws of si.ws) {
    try {
      if (sendSystem) {
        logger.info(`Sending system summary to user ${si.userId}`);
        await ws.send(JSON.stringify(lastSystemSummaryMessage));
      }

      if (sendGlobal) {
        logger.info(`Sending global summary to user ${si.userId}`);
        await ws.send(JSON.stringify(lastGlobalSummaryMessage));
      }

      if (sendUser) {
        logger.info(`Sending user summary to user ${si.userId}`);
        await ws.send(JSON.stringify(userSummaryMessage));
      }
    }
    catch (e) {
      logger.warn(`Websocket faulty for ${si.userId}`, e.message);
      ws.terminate();
      removeSocket(si, ws);
    }
  }

  si.lastUserSummary = userSummaryMessage.data as IUserSummary;
}

async function maybeSendUpdates() {
  for (const si of socketItems.values()) {
    maybeSendUpdateToUser(si, await refreshGlobalMessages(false));
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
      si = {userId, ws: [], lastUserSummary: null};
      socketItems.set(userId, si);
    }

    si.ws.push(ws);

    if (lastGlobalSummaryMessage === null) {
      logger.info(`Setting up notifications`);
      registerInterest(maybeSendUpdates);
    }

    ws.on('close', () => {
      removeSocket(si!, ws);
    });

    logger.info(`Websocket opened to ${req.user.email}`);
    maybeSendUpdateToUser(si, await refreshGlobalMessages(true));
  });

  return router;
}

// Used in testing
export function destroyUpdateNotificationService() {
  lastGlobalSummaryMessage = null;
  for (const si of socketItems.values()) {
    for (const ws of si.ws) {
      ws.close();
    }
  }
  socketItems.clear();
}
