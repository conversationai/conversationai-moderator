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

// Set true to send test update packets
const SEND_TEST_UPDATE_PACKETS = false;

import * as express from 'express';
import { isEqual, pick } from 'lodash';
import * as Sequelize from 'sequelize';
import * as WebSocket from 'ws';

import { logger } from '../../logger';
import {
  Article,
  Category,
  ModerationRule,
  Preselect,
  Tag,
  TaggingSensitivity,
  User,
} from '../../models';
import {
  IArticleInstance,
  ICategoryInstance,
  IModerationRuleInstance,
  IPreselectInstance,
  ITaggingSensitivityInstance,
  ITagInstance,
  IUserInstance,
} from '../../models';
import { registerInterest } from '../../models';

const TAG_FIELDS = ['id', 'color', 'description', 'key', 'label', 'isInBatchView', 'inSummaryScore', 'isTaggable'];
const RANGE_FIELDS = ['id', 'categoryId', 'lowerThreshold', 'upperThreshold', 'tagId'];
const TAGGING_SENSITIVITY_FIELDS = RANGE_FIELDS;
const RULE_FIELDS = ['action', 'createdBy', ...RANGE_FIELDS];
const PRESELECT_FIELDS = RANGE_FIELDS;
const USER_FIELDS = ['id', 'name', 'email', 'avatarURL', 'group', 'isActive'];

const COMMENTSET_FIELDS = ['id', 'updatedAt', 'allCount', 'unprocessedCount', 'unmoderatedCount', 'moderatedCount',
  'approvedCount', 'highlightedCount', 'rejectedCount', 'deferredCount', 'flaggedCount',
  'batchedCount', 'recommendedCount', 'assignedModerators', ];
const CATEGORY_FIELDS = [...COMMENTSET_FIELDS, 'label', 'ownerId', 'isActive', 'sourceId'];
const ARTICLE_FIELDS = [...COMMENTSET_FIELDS, 'title', 'url', 'categoryId', 'sourceCreatedAt', 'lastModeratedAt',
  'isCommentingEnabled', 'isAutoModerated'];

const ID_FIELDS = new Set(['categoryId', 'tagId', 'ownerId']);

// TODO: Can't find a good way to get rid of the any types below.  And typing is generally a mess.
//       Revisit when sequelize has been updated
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
    return serialiseObject(u, USER_FIELDS);
  });

  const tags = await Tag.findAll({});
  const tagdata = tags.map((t: ITagInstance) => {
    return serialiseObject(t, TAG_FIELDS);
  });

  const taggingSensitivities = await TaggingSensitivity.findAll({});
  const tsdata = taggingSensitivities.map((t: ITaggingSensitivityInstance) => {
    return serialiseObject(t, TAGGING_SENSITIVITY_FIELDS);
  });

  const rules = await ModerationRule.findAll({});
  const ruledata = rules.map((r: IModerationRuleInstance) => {
    return serialiseObject(r, RULE_FIELDS);
  });

  const preselects = await Preselect.findAll({});
  const preselectdata = preselects.map((p: IPreselectInstance) => {
    return serialiseObject(p, PRESELECT_FIELDS);
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

// Convert IDs to strings, and assignedModerators to arrays of strings.
function serialiseObject(
  o: Sequelize.Instance<any>,
  fields: Array<string>,
): {[key: string]: {} | Array<string> | string | number} {
  const serialised = pick(o.toJSON(), fields);

  serialised.id = serialised.id.toString();

  for (const k in serialised) {
    const v = serialised[k];

    if (ID_FIELDS.has(k) && v) {
      serialised[k] = v.toString();
    }
  }

  if (serialised.assignedModerators) {
    serialised.assignedModerators = serialised.assignedModerators.map(
      (i: any) => (i.user_category_assignment ?  i.user_category_assignment.userId.toString() :
                                                 i.moderator_assignment.userId.toString()));
  }
  return serialised;
}

async function getAllArticlesData() {
  const categories = await Category.findAll({
    include: [{ model: User, as: 'assignedModerators', attributes: ['id']}],
  });
  const categoryIds: Array<number> = [];
  const categorydata = categories.map((c: ICategoryInstance) => {
    categoryIds.push(c.id);
    return serialiseObject(c, CATEGORY_FIELDS);
  });

  const articles = await Article.findAll({
    where: {$or: [{categoryId: null}, {categoryId: categoryIds}]},
    include: [{ model: User, as: 'assignedModerators', attributes: ['id']}],
  });
  const articledata = articles.map((a: IArticleInstance) => {
    return serialiseObject(a, ARTICLE_FIELDS);
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
  if (!article) {
    return null;
  }
  const aData = serialiseObject(article, ARTICLE_FIELDS);

  const category = await Category.findById(
    await article.get('categoryId'),
    {include: [{ model: User, as: 'assignedModerators', attributes: ['id']}]},
  );

  const cData = category  ? serialiseObject(category, CATEGORY_FIELDS) : undefined;

  return {
    type: 'article-update',
    data: {
      categories: [cData],
      articles: [aData],
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

function sendTestUpdatePackets(si: ISocketItem) {
  logger.info(`*** settng up fake update notifications for user ${si.userId}`);
  let counter = 1;
  setInterval(async () => {
    const update = await getArticleUpdate(counter);
    if (!update) {
      logger.info(`no such article ${counter}`);
      counter = 1;
      return;
    }
    const data = update.data as IArticleUpdateData;
    let msg = `fake update message ${counter}`;
    if (counter % 3 === 1) {
      // Just send the category
      delete  data.article;
      msg += ' category';
    }
    else if (counter % 3 === 2) {
      // just send the article
      delete  data.category;
      msg += ' article';
    }
    else {
      msg += ' both';
    }

    if (counter % 4 === 2) {
      // pretend its a new object
      msg += ' new';
      if (data.article) {
        data.article.id = data.article.id + 10000 + Math.floor(Math.random() * 1000);
      }
      if (data.category) {
        data.category.id = data.category.id + 10000 + Math.floor(Math.random() * 1000);
      }
    }
    if (counter % 4 === 3) {
      msg += ' faked data';
      // Mess with the data
      if (data.article) {
        data.article.unmoderatedCount = data.article.unmoderatedCount + Math.floor(Math.random() * 10000);
      }
      if (data.category) {
        data.category.unmoderatedCount = data.category.unmoderatedCount + Math.floor(Math.random() * 10000);
      }
    }

    logger.info(msg);
    counter ++;
    logger.info(`Sending **fake** article update to user ${si.userId} -- ${msg}`);
    for (const ws of si.ws) {
      await ws.send(JSON.stringify(update));
    }
  }, 1000);
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

      if (SEND_TEST_UPDATE_PACKETS) {
        sendTestUpdatePackets(si);
      }
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

export function destroyUpdateNotificationService() {
  lastAllArticlesMessage = null;
  for (const si of socketItems.values()) {
    for (const ws of si.ws) {
      ws.close();
    }
  }
  socketItems.clear();
}
