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
import * as DataTypes from 'sequelize';

import { sequelize } from '../sequelize';
import { Category, ICategoryInstance } from './category';
import { IBaseAttributes, IBaseInstance } from './constants';
import { updateHappened } from './last_update';
import { IUserInstance, User } from './user';

export interface IArticleAttributes extends IBaseAttributes {
  ownerId?: number | null;
  sourceId: string;
  categoryId?: number | null;
  title: string;
  text: string;
  url: string;
  sourceCreatedAt?: Date | null;
  isCommentingEnabled: boolean;
  isAutoModerated: boolean;
  extra?: object | null;
  allCount: number;
  unprocessedCount: number;
  unmoderatedCount: number;
  moderatedCount: number;
  highlightedCount: number;
  approvedCount: number;
  rejectedCount: number;
  deferredCount: number;
  flaggedCount: number;
  batchedCount: number;
  lastModeratedAt?: Date | null;
}

export type IArticleInstance = Sequelize.Instance<IArticleAttributes> & IArticleAttributes & IBaseInstance & {
  getCategory: Sequelize.BelongsToGetAssociationMixin<ICategoryInstance>;
  getAssignedModerators: Sequelize.BelongsToManyGetAssociationsMixin<IUserInstance>;
  countAssignedModerators: Sequelize.BelongsToManyCountAssociationsMixin;
};

/**
 * Article model
 */
export const Article = sequelize.define<IArticleInstance, IArticleAttributes>('article', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  ownerId: {
    type: DataTypes.INTEGER.UNSIGNED,
    references: { model: User, key: 'id' },
    allowNull: true,
  },

  sourceId: {
    type: DataTypes.CHAR(255),
    allowNull: false,
  },

  categoryId: {
    type: DataTypes.INTEGER.UNSIGNED,
    references: { model: Category, key: 'id' },
    allowNull: true,
  },

  title: {
    type: DataTypes.CHAR(255),
    allowNull: false,
  },

  text: {
    type: DataTypes.TEXT({length: 'long'}),
    allowNull: false,
  },

  url: {
    type: DataTypes.CHAR(255),
    allowNull: false,
  },

  sourceCreatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  isCommentingEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },

  isAutoModerated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },

  allCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  unprocessedCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  unmoderatedCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  moderatedCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  highlightedCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  approvedCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  rejectedCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  deferredCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  flaggedCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  batchedCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  lastModeratedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  extra: {
    type: DataTypes.JSON,
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

  hooks: {
    afterCreate: updateHappened,
    afterBulkCreate: updateHappened,
  },
});

Article.belongsTo(User, {as: 'owner'});
Article.belongsTo(Category);
