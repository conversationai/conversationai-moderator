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
  Article, Category, ModerationRule, Preselect, Tag, TaggingSensitivity, User,
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
  'isCommentingEnabled', 'isAutoModerated', 'text'];

interface ISystemData {
  users: any;
  tags: any;
  taggingSensitivities: any;
  rules: any;
  preselects: any;
}

interface IAllArticlesData {
  categories: any;
  articles: any;
}

interface IArticleUpdateData {
  category: any;
  article: any;
}

interface IPerUserData {
  assignments: number;
}

interface IMessage {
  type: 'system' | 'global' | 'article-update' | 'user';
  data: ISystemData | IAllArticlesData | IArticleUpdateData | IPerUserData;
}

async function getSystemData() {
  const users = await User.findAll({where: {group: ['admin', 'general']}});
  const userdata = users.map((u: IUserInstance) => {
    return pick(u.toJSON(), userFields);
  });

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
      users: userdata,
      tags: tagdata,
      taggingSensitivities: tsdata,
      rules: ruledata,
      preselects: preselectdata,
    },
  } as IMessage;
}

// TODO: Can't find a good way to get rid of the any types below
//       Revisit when sequelize has been updated
async function getAllArticlesData() {
  const categories = await Category.findAll({
    where: {isActive: true},
    include: [{ model: User, as: 'assignedModerators', attributes: ['id']}],
  });
  const categoryIds: Array<number> = [];
  const categorydata = categories.map((c: ICategoryInstance) => {
    categoryIds.push(c.id);
    const category: any = pick(c.toJSON(), categoryFields);
    category.assignedModerators = category.assignedModerators.map((i: any) => i.user_category_assignment.userId.toString());
    return category;
  });

  const articles = await Article.findAll({
    where: {$or: [{categoryId: null}, {categoryId: categoryIds}]},
    include: [{ model: User, as: 'assignedModerators', attributes: ['id']}],
  });
  const articledata = articles.map((a: IArticleInstance) => {
    const article: any = pick(a.toJSON(), articleFields);
    article.assignedModerators = article.assignedModerators.map((i: any) => i.moderator_assignment.userId.toString());
    return article;
  });

  return {
    type: 'global',
    data: {
      categories: categorydata,
      articles: articledata,
    },
  } as IMessage;
}

async function getArticleUpdate(articleId: number) {
  const article = await Article.findById(
    articleId,
    {include: [{ model: User, as: 'assignedModerators', attributes: ['id']}]},
  );
  const aData: any = pick(article.toJSON(), articleFields);
  aData.assignedModerators = aData.assignedModerators.map((i: any) => i.moderator_assignment.userId.toString());

  const category = await Category.findById(
    aData.categoryId,
    {include: [{ model: User, as: 'assignedModerators', attributes: ['id']}]},
  );
  const cData: any = pick(category.toJSON(), categoryFields);
  cData.assignedModerators = cData.assignedModerators.map((i: any) => i.user_category_assignment.userId.toString());

  return {
    type: 'article-update',
    data: {
      category: cData,
      article: aData,
    },
  } as IMessage;
}

async function getPerUserData(userId: number) {
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
  lastPerUserMessage: IPerUserData | null;
}

let lastSystemMessage: IMessage | null = null;
let lastAllArticlesMessage: IMessage | null = null;
const socketItems = new Map<number, ISocketItem>();

async function refreshSystemMessage(): Promise<boolean> {
  const newMessage = await getSystemData();
  if (!lastSystemMessage) {
    lastSystemMessage = newMessage;
    return true;
  }

  const send = !isEqual(newMessage.data, lastSystemMessage.data);
  if (send) {
    lastSystemMessage = newMessage;
  }

  return send;
}

async function refreshAllArticlesMessage(): Promise<boolean> {
  const newMessage = await getAllArticlesData();
  if (!lastAllArticlesMessage) {
    lastAllArticlesMessage = newMessage;
    return true;
  }

  const send = !isEqual(newMessage.data, lastAllArticlesMessage.data);
  if (send) {
    lastAllArticlesMessage = newMessage;
  }

  return send;
}

function removeSocket(si: ISocketItem, ws: WebSocket) {
  const index = si.ws.indexOf(ws);
  if (index >= 0) {
    si.ws.splice(index, 1);
  }
  if (si.ws.length === 0) {
    socketItems.delete(si.userId);
  }
}

async function refreshMessages(alwaysSend: boolean) {
  const sendSystem = (await refreshSystemMessage() || alwaysSend);
  const sendAllArticles = (await refreshAllArticlesMessage() || alwaysSend);
  return {sendSystem, sendAllArticles, sendUser: alwaysSend};
}

async function maybeSendUpdateToUser(si: ISocketItem,
                                     {sendSystem, sendAllArticles, sendUser}:
                                       {sendSystem: boolean, sendAllArticles: boolean, sendUser: boolean}) {
  const userSummaryMessage = await getPerUserData(si.userId);
  sendUser = sendUser || !si.lastPerUserMessage || !isEqual(userSummaryMessage.data, si.lastPerUserMessage);

  for (const ws of si.ws) {
    try {
      if (sendSystem) {
        logger.info(`Sending system data to user ${si.userId}`);
        await ws.send(JSON.stringify(lastSystemMessage));
      }

      if (sendAllArticles) {
        logger.info(`Sending all articles data to user ${si.userId}`);
        await ws.send(JSON.stringify(lastAllArticlesMessage));
      }

      if (sendUser) {
        logger.info(`Sending per user data to user ${si.userId}`);
        await ws.send(JSON.stringify(userSummaryMessage));
      }
    }
    catch (e) {
      logger.warn(`Websocket faulty for ${si.userId}`, e.message);
      ws.terminate();
      removeSocket(si, ws);
    }
  }

  si.lastPerUserMessage = userSummaryMessage.data as IPerUserData;
}

async function maybeSendUpdates() {
  for (const si of socketItems.values()) {
    const updateFlags = await refreshMessages(false);
    await maybeSendUpdateToUser(si, updateFlags);
  }
}

async function sendPartialUpdate(articleId: number) {
  lastAllArticlesMessage = await getAllArticlesData();
  const update = await getArticleUpdate(articleId);
  for (const si of socketItems.values()) {
    for (const ws of si.ws) {
      logger.info(`Sending article update to user ${si.userId}`);
      await ws.send(JSON.stringify(update));
    }
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
      si = {userId, ws: [], lastPerUserMessage: null};
      socketItems.set(userId, si);
    }

    si.ws.push(ws);

    if (lastAllArticlesMessage === null) {
      logger.info(`Setting up notifications`);
      registerInterest({
        updateHappened: maybeSendUpdates,
        partialUpdateHappened: sendPartialUpdate});
    }

    ws.on('close', () => {
      removeSocket(si!, ws);
    });

    logger.info(`Websocket opened to ${req.user.email}`);
    const updateFlags = await refreshMessages(true);
    maybeSendUpdateToUser(si, updateFlags);
  });

  return router;
}

// Used in testing
export function destroyUpdateNotificationService() {
  lastAllArticlesMessage = null;
  for (const si of socketItems.values()) {
    for (const ws of si.ws) {
      ws.close();
    }
  }
  socketItems.clear();
}
