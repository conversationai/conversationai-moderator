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
import { Op } from 'sequelize';

import {
  Article,
  ModeratorAssignment,
  partialUpdateHappened,
  updateHappened,
  User,
  UserCategoryAssignment,
} from '../../models';
import { REPLY_SUCCESS } from '../constants';

export async function countAssignments(user: User) {
  const articles: Array<Article> = await user.getAssignedArticles();
  return articles.reduce((sum, a) => sum + a.unmoderatedCount, 0);
}

export function createAssignmentsService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  async function removeArticleAssignment(userIds: Array<number>, articleIdsInCategory: Array<number>) {
    // Remove all assignmentsForArticles that have articleId that exist in articlesInCategory AND userId === userId
    await ModeratorAssignment.destroy({
      where: {
        userId: {
          [Op.in]: userIds,
        },
        articleId: {
          [Op.in]: articleIdsInCategory,
        },
      },
    });
  }

  function getArticleAssignmentArray(userIds: Array<number>, articleIdsInCategory: Array<number>) {
    return articleIdsInCategory.reduce((sum: Array<{articleId: number; userId: number; }>, articleId) => {
      return sum.concat(userIds.map((userId) => {
        return {
          articleId,
          userId,
        };
      }));
    }, []);
  }

  function getUserCategoryAssignment(userIds: Array<number>, categoryId: number) {
    return userIds.map((id) => {
      return {
        userId: id,
        categoryId,
      };
    });
  }

  // POST to category/id who's body.data contains userId[]
  router.post('/categories/:id', async (req, res, next) => {
    const categoryId = parseInt(req.params.id, 10);
    const userIds: Array<number> = req.body.data.map((s: any) => parseInt(s, 10));

    const articlesInCategory: Array<Article> = await Article.findAll({
      where: { categoryId },
    });

    const articleIdsInCategory = articlesInCategory.map((article) => article.id);

    // Get assignments for the category
    const assignmentsForCategory = await UserCategoryAssignment.findAll({
      where: { categoryId },
    });

    const userIdsToBeRemoved = assignmentsForCategory.reduce((prev: Array<number>, current: UserCategoryAssignment): Array<number> => {
      const assignmentUserId: number = current.userId;
      const isInAssignment = userIds.some((userId) => (userId === assignmentUserId));
      if (isInAssignment) {
        return prev;
      } else {
        return prev.concat(assignmentUserId);
      }
    }, []);

    if (userIdsToBeRemoved.length > 0) {
      await removeArticleAssignment(userIdsToBeRemoved, articleIdsInCategory);
    }

    const newUserIds = userIds.filter((userId) => {
      return !assignmentsForCategory.some(
        (assignment: any) => assignment.userId === userId && assignment.categoryId === categoryId,
      );
    });

    // If a user is being assigned we need to clear and then add them to each article with categoryId of categoryId
    await removeArticleAssignment(newUserIds, articleIdsInCategory);
    await ModeratorAssignment.bulkCreate(getArticleAssignmentArray(newUserIds, articleIdsInCategory));

    // Now remove/set UserCategoryAssignment
    if (userIdsToBeRemoved.length > 0) {
      await UserCategoryAssignment.destroy({
        where: {
          userId: {
            [Op.in]: userIdsToBeRemoved,
          },
        },
      });
    }
    await UserCategoryAssignment.bulkCreate(getUserCategoryAssignment(newUserIds, categoryId));

    res.json(REPLY_SUCCESS);

    updateHappened();
    next();
  });

  // POST to articles/id who's body.data contains userId[]
  router.post('/article/:id', async (req, res, next) => {
    const articleId = parseInt(req.params.id, 10);
    const userIds: Set<number> = new Set(req.body.data.map((s: any) => parseInt(s, 10)));

    // Get assignments for the category
    const assignments = await ModeratorAssignment.findAll({
      where: { articleId },
    });

    const toRemove = new Array<number>();

    for (const a of assignments) {
      const id = a.userId;
      if (userIds.has(id)) {
        userIds.delete(id);
      }
      else {
        toRemove.push(a.id);
      }
    }

    await ModeratorAssignment.bulkCreate(getArticleAssignmentArray(Array.from(userIds), [articleId]));
    await ModeratorAssignment.destroy({where: {id: {[Op.in]: toRemove }}});

    res.json(REPLY_SUCCESS);
    partialUpdateHappened(articleId);
    next();
  });

  return router;
}
