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

import {
  Article,
  User,
  USER_GROUP_SERVICE,
} from '@conversationai/moderator-backend-core';
import {
  createToken,
  partialUpdateHappened,
} from '@conversationai/moderator-backend-core';

import { REPLY_SUCCESS } from '../constants';

const userFields = ['id', 'name', 'email', 'group', 'isActive', 'extra'];

export function createSimpleRESTService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.get('/systemUsers/:type', async (req, res, next) => {
    const users = await User.findAll({
      where: {
        group: req.params.type,
      },
    });

    const userdata: Array<any> = [];
    for (const u of users) {
      const simple = u.toJSON();
      if (req.params.type === USER_GROUP_SERVICE) {
        const token = await createToken(u.id);
        simple.extra = {jwt: token};
      }
      else {
        simple.extra = JSON.parse(u.get('extra'));
      }
      userdata.push(pick(simple, userFields));
    }

    res.json({ users: userdata });

    next();
  });

  router.post('/article/update/:id', async (req, res, next) => {
    const articleId = parseInt(req.params.id, 10);
    const a = await Article.findById(articleId);
    a.set('isCommentingEnabled', req.body.isCommentingEnabled);
    a.set('isAutoModerated', req.body.isAutoModerated);
    a.save();

    res.json(REPLY_SUCCESS);
    partialUpdateHappened(articleId);
    next();
  });

  router.get('/article/:id/text', async (req, res, next) => {
    const articleId = parseInt(req.params.id, 10);
    const a = await Article.findById(articleId);
    const text = a.get('text');
    res.json({text: text});
    next();
  });

  return router;
}
