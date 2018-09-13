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
import { updateHappened } from './last_update';

export interface IModeratorAssignmentAttributes {
  id?: number;
  userId: number;
  articleId: number;
}

export interface IModeratorAssignmentInstance
    extends Sequelize.Instance<
      IModeratorAssignmentAttributes
    > {
  id: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Article model
 */
export const ModeratorAssignment = sequelize.define<
  IModeratorAssignmentInstance,
  IModeratorAssignmentAttributes
>(
  'moderator_assignment',
  {
    id: {
      type: Sequelize.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
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

    classMethods: {
      associate(models: any) {
        ModeratorAssignment.belongsTo(models.User, {
          onDelete: 'CASCADE',
        });

        ModeratorAssignment.belongsTo(models.Article, {
          onDelete: 'CASCADE',
        });
      },
    },

    hooks: {
      afterBulkCreate: updateHappened,
      afterBulkDestroy: updateHappened,
    },
  },
);
