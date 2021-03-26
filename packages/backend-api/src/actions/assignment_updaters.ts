/*
Copyright 2021 Google Inc.

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
import {Op} from 'sequelize';

import {Article, ModeratorAssignment, UserCategoryAssignment} from '../models';
import {partialUpdateHappened, updateHappened} from '../notification_router';

function getUserCategoryAssignment(userIds: Array<number>, categoryId: number) {
  return userIds.map((id) => {
    return {
      userId: id,
      categoryId,
    };
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

async function removeArticleAssignments(userIds: Array<number>, articleIds: Array<number>) {
  await ModeratorAssignment.destroy({
    where: {
      userId: {
        [Op.in]: userIds,
      },
      articleId: {
        [Op.in]: articleIds,
      },
    },
  });
}

export async function updateCategoryAssignments(categoryId: number, userIds: Array<number>) {
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
    await removeArticleAssignments(userIdsToBeRemoved, articleIdsInCategory);
  }

  const newUserIds = userIds.filter((userId) => {
    return !assignmentsForCategory.some(
      (assignment: any) => assignment.userId === userId && assignment.categoryId === categoryId,
    );
  });

  // If a user is being assigned we need to clear and then add them to each article with categoryId of categoryId
  await removeArticleAssignments(newUserIds, articleIdsInCategory);
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
  updateHappened();
}

export async function updateArticleAssignments(articleId: number, userIds: Set<number>) {
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

  partialUpdateHappened(articleId);
}
