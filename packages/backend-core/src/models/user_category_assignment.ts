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

import * as Sequelize from 'sequelize';
import { sequelize } from '../sequelize';

export interface IUserCategoryAssignmentAttributes {
  categoryId: number;
  userId: number;
}

export interface IUserCategoryAssignmentInstance
    extends Sequelize.Instance<IUserCategoryAssignmentAttributes> {
  createdAt: string;
  updatedAt: string;
}

/**
 * Category model
 */
export const UserCategoryAssignment = sequelize.define<
  IUserCategoryAssignmentInstance,
  IUserCategoryAssignmentAttributes
>(
  'user_category_assignment',
  {
    categoryId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
    },

    userId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true,
    },
  },
);
