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
import { IBaseAttributes, IBaseInstance } from './constants';

export interface IModeratorAssignmentAttributes extends  IBaseAttributes {
  userId: number;
  articleId: number;
}

export type IModeratorAssignmentInstance = Sequelize.Instance<IModeratorAssignmentAttributes> &
  IModeratorAssignmentAttributes & IBaseInstance;

/**
 * Article model
 */
export const ModeratorAssignment = sequelize.define<
  IModeratorAssignmentInstance,
  IModeratorAssignmentAttributes
>(
  'moderator_assignment',
  {
    userId: {
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
    },

    articleId: {
      type: Sequelize.BIGINT.UNSIGNED,
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        name: 'unique_assignment_index',
        fields: ['userId', 'articleId'],
        unique: true,
      },
      {
        name: 'userId_index',
        fields: ['userId'],
      },
    ],
  },
);

ModeratorAssignment.associate = (models) => {
  ModeratorAssignment.belongsTo(models.User, {
    onDelete: 'CASCADE',
  });

  ModeratorAssignment.belongsTo(models.Article, {
    onDelete: 'CASCADE',
  });
};
