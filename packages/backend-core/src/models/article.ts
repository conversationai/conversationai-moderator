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
import { IUserInstance } from './user';

export interface IArticleAttributes {
  id?: number;
  sourceId: string;
  categoryId?: number;
  title: string;
  text: string;
  url: string;
  sourceCreatedAt: Date | string | null;
  isAutoModerated?: boolean | null;
  extra?: any | null;
  count?: number;
  unprocessedCount?: number;
  unmoderatedCount?: number;
  moderatedCount?: number;
  highlightedCount?: number;
  approvedCount?: number;
  rejectedCount?: number;
  deferredCount?: number;
  flaggedCount?: number;
  batchedCount?: number;
  recommendedCount?: number;
  disableRules?: boolean;
}

export interface IArticleInstance
    extends Sequelize.Instance<IArticleAttributes> {
  id: number;
  createdAt: string;
  updatedAt: string;

  getAssignedModerators: Sequelize.BelongsToManyGetAssociationsMixin<IUserInstance>;
  countAssignedModerators: Sequelize.BelongsToManyCountAssociationsMixin;
}

/**
 * Article model
 */
export const Article = sequelize.define<IArticleInstance, IArticleAttributes>('article', {
  id: {
    type: Sequelize.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  sourceId: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  title: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  text: {
    type: Sequelize.TEXT('long'),
    allowNull: false,
  },

  url: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  sourceCreatedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },

  createdAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,
  },

  disableRules: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  isAutoModerated: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  },

  count: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  unprocessedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  unmoderatedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  moderatedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  highlightedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  approvedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  rejectedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  deferredCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  flaggedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  batchedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  recommendedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  extra: {
    type: Sequelize.JSON,
    allowNull: true,
  },
}, {
  indexes: [
    {
      name: 'sourceId_index',
      fields: ['sourceId'],
      unique: true,
    },
  ],

  classMethods: {

    /**
     * Article relationships
     */
    associate(models: any) {
      Article.belongsTo(models.Category);
      Article.hasMany(models.Comment);

      Article.belongsToMany(models.User, {
        through: {
          model: models.ModeratorAssignment,
          unique: false,
        },
        foreignKey: 'articleId',
        as: 'assignedModerators',
      });
    },

  },
  hooks: {
    afterCreate: updateHappened,
    afterBulkCreate: updateHappened,
  },
});
