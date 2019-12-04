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

/**
 * We use this module for API endpoints where it is easier to implement a custom interface
 * than to modify/customise/configure the generic REST api to do the same thing.
 */

import * as express from 'express';
import { pick } from 'lodash';
import { Op } from 'sequelize';

import { createToken } from '../../auth/tokens';
import { clearError } from '../../integrations';
import {
  Article,
  IArticleInstance,
  User,
  USER_GROUP_ADMIN,
  USER_GROUP_GENERAL,
  USER_GROUP_SERVICE,
  USER_GROUP_YOUTUBE,
} from '../../models';
import {
  partialUpdateHappened,
  updateHappened,
} from '../../models';
import { REPLY_SUCCESS } from '../constants';
import { ARTICLE_FIELDS, serialiseObject } from './serializer';

const userFields = ['id', 'name', 'email', 'group', 'isActive', 'extra'];

export function createSimpleRESTService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.get('/systemUsers/:type', async (req, res, next) => {
    const users = await User.findAll({
      where: { group: req.params.type },
    });

    const userdata: Array<any> = [];
    for (const u of users) {
      const simple = u.toJSON();
      if (req.params.type === USER_GROUP_SERVICE) {
        const token = await createToken(u.id);
        simple.extra = {jwt: token};
      }
      else if (u.extra) {
        simple.extra = u.extra as object;
        // Make sure we don't send any access tokens out.
        delete simple.extra.token;
      }
      userdata.push(pick(simple, userFields));
    }

    res.json({ users: userdata });

    next();
  });

  router.post('/user/update/:id', async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).send('Not found');
      next();
      return;
    }

    const group = await user.group;

    function isRealUser(g: string) {
      return g === USER_GROUP_ADMIN || g === USER_GROUP_GENERAL;
    }

    if (isRealUser(group) || group === USER_GROUP_SERVICE) {
      user.name = req.body.name;
    }
    if (isRealUser(group)) {
      if (isRealUser(req.body.group)) {
        user.group = req.body.group;
      }
      user.email = req.body.email;
    }
    user.isActive = req.body.isActive;
    await user.save();

    if (group === USER_GROUP_YOUTUBE && req.body.isActive) {
      await clearError(user);
    }

    res.json(REPLY_SUCCESS);
    updateHappened();
    next();
  });

  router.post('/article/update/:id', async (req, res, next) => {
    const articleId = parseInt(req.params.id, 10);
    const article = await Article.findByPk(articleId);
    if (!article) {
      res.status(404).send('Not found');
      next();
      return;
    }

    article.isCommentingEnabled = req.body.isCommentingEnabled;
    article.isAutoModerated = req.body.isAutoModerated;
    await article.save();

    res.json(REPLY_SUCCESS);
    partialUpdateHappened(articleId);
    next();
  });

  router.post('/article/get', async (req, res, next) => {
    const articles = await Article.findAll({where: {id: {[Op.in]: req.body}}});
    const articleData = articles.map((a: IArticleInstance) => {
      return serialiseObject(a, ARTICLE_FIELDS);
    });

    res.json(articleData);
    next();
  });

  router.get('/article/:id/text', async (req, res, next) => {
    const articleId = parseInt(req.params.id, 10);
    const article = await Article.findByPk(articleId);
    if (!article) {
      res.status(404).send('Not found');
      next();
      return;
    }
    const text = article.text;
    res.json({text: text});
    next();
  });

  return router;
}
