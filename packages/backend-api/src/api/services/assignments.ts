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

import {updateArticleAssignments, updateCategoryAssignments} from '../../actions/assignment_updaters';
import {
  Article,
  User,
} from '../../models';
import {REPLY_SUCCESS} from '../constants';

export async function countAssignments(user: User) {
  const articles: Array<Article> = await user.getAssignedArticles();
  return articles.reduce((sum, a) => sum + a.unmoderatedCount, 0);
}

export function createAssignmentsService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  // POST to category/id who's body.data contains userId[]
  router.post('/categories/:id', async (req, res) => {
    const categoryId = parseInt(req.params.id, 10);
    const userIds: Array<number> = req.body.data.map((s: any) => parseInt(s, 10));

    await updateCategoryAssignments(categoryId, userIds);

    res.json(REPLY_SUCCESS);
  });

  // POST to articles/id who's body.data contains userId[]
  router.post('/article/:id', async (req, res) => {
    const articleId = parseInt(req.params.id, 10);
    const userIds: Set<number> = new Set(req.body.data.map((s: any) => parseInt(s, 10)));

    await updateArticleAssignments(articleId, userIds);
    res.json(REPLY_SUCCESS);
  });

  return router;
}
