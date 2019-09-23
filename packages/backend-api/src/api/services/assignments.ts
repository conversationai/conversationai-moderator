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

import {
  Article,
  IArticleInstance,
  IModeratorAssignmentAttributes,
  IUserCategoryAssignmentAttributes,
  IUserCategoryAssignmentInstance,
  ModeratorAssignment,
  partialUpdateHappened,
  updateHappened,
  User,
  UserCategoryAssignment,
} from '../../models';
import { REPLY_SUCCESS } from '../constants';
import * as JSONAPI from '../jsonapi';
import { list } from '../util/SequelizeHandler';

export function createAssignmentsService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.get('/users/:id', JSONAPI.handleGet(
    async ({ params: { id } }, paging, include, filters, sort, fields) => {
      const user = await User.findById(id);

      return await list(
        'articles', {
          page: paging,
          include,
          filters,
          sort,
          fields,
        },

        // Hack type for dynamically generated methods.
        (user as any).getAssignedArticles.bind(user),
        (user as any).countAssignedArticles.bind(user),
      );
    },
    JSONAPI.renderListResults,
    ({ params: { id } }) => `/services/assignments/users/${id}`,
  ));

  router.get('/users/:id/count', async (req, res, next) => {
    const user = await User.findById(req.params.id);
    const count = user ? await user.countAssignments() : 0;

    // So simple, not worth validating the schema.
    res.json({ count });

    next();
  });

  router.get('/articles/:id', JSONAPI.handleGet(
    async ({ params: { id } }, paging, include, filters, sort, fields) => {
      const article = await Article.findById(id);

      return await list(
        'users',
        {
          page: paging,
          include,
          filters,
          sort,
          fields,
        },

        // Hack type for dynamically generated methods.
        (article as any).getAssignedModerators.bind(article),
        (article as any).countAssignedModerators.bind(article),
      );
    },
    JSONAPI.renderListResults,
    ({ params: { id } }) => `/services/assignments/articles/${id}`,
  ));

  async function removeArticleAssignment(userIds: Array<number>, articleIdsInCategory: Array<number>) {
    // Remove all assignmentsForArticles that have articleId that exist in articlesInCategory AND userId === userId
    // TODO: This looks wrong.  What happens if user1 assigned to article 1 and 2 and user 2 assigned to article 1 and 2
    //       And we want to remove user 1 article 2 and user 2 article 1.  This will remove them all....
    await ModeratorAssignment.destroy({
      where: {
        userId: {
          $in: userIds,
        },
        articleId: {
          $in: articleIdsInCategory,
        },
      },
    });
  }

  function getArticleAssignmentArray(userIds: Array<number>, articleIdsInCategory: Array<number>): Array<IModeratorAssignmentAttributes> {
    return articleIdsInCategory.reduce((sum: Array<{articleId: number; userId: number; }>, articleId) => {
      return sum.concat(userIds.map((userId) => {
        return {
          articleId,
          userId,
        };
      }));
    }, []);
  }

  function getUserCategoryAssignment(userIds: Array<number>, categoryId: number): Array<IUserCategoryAssignmentAttributes> {
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

    const articlesInCategory: Array<IArticleInstance> = await Article.findAll({
      where: {
        categoryId,
      },
    });

    const articleIdsInCategory = articlesInCategory.map((article) => article.id);

    // Get assignments for the category
    const assignmentsForCategory = await UserCategoryAssignment.findAll({
      where: {
        categoryId,
      },
    });

    const userIdsToBeRemoved = assignmentsForCategory.reduce((prev: Array<number>, current: IUserCategoryAssignmentInstance): Array<number> => {
      const assignmentUserId: number = current.get('userId');
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
            $in: userIdsToBeRemoved,
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
      where: {
        articleId,
      },
    });

    const toRemove = new Array<number>();

    for (const a of assignments) {
      const id = a.get('userId');
      if (userIds.has(id)) {
        userIds.delete(id);
      }
      else {
        toRemove.push(a.id);
      }
    }

    await ModeratorAssignment.bulkCreate(getArticleAssignmentArray(Array.from(userIds), [articleId]));
    await ModeratorAssignment.destroy({where: {id: {$in: toRemove }}});

    res.json(REPLY_SUCCESS);
    partialUpdateHappened(articleId);
    next();
  });

  return router;
}
