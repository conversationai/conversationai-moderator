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

import {BelongsToGetAssociationMixin, BelongsToManyGetAssociationsMixin, DataTypes, Model} from 'sequelize';

import {createSendNotificationHook} from '../notification_router';
import {sequelize} from '../sequelize';
import {User} from './user';

export class Category extends Model {
  id: number;
  label: string;
  ownerId?: number | null;
  sourceId?: string;
  isActive?: boolean;
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

  getAssignedModerators: BelongsToManyGetAssociationsMixin<User>;
  getOwner: BelongsToGetAssociationMixin<User>;
}

Category.init({
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
    allowNull: true,
  },

  label: {
    type: DataTypes.CHAR(255),
    allowNull: false,
  },

  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
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

  extra: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {

  sequelize,
  modelName: 'category',
  indexes: [
    {
      name: 'label_index',
      fields: ['label'],
      unique: true,
    },
  ],
  hooks: {
    afterCreate: createSendNotificationHook<Category>('category', 'create', (a) => a.id),
    afterUpdate: createSendNotificationHook<Category>('category', 'modify', (a) => a.id),
  },
});

Category.belongsTo(User, {as: 'owner'});
