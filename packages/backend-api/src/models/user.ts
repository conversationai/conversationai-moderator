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

import * as Joi from 'joi';
import * as Sequelize from 'sequelize';
import { sequelize } from '../sequelize';
import { IArticleInstance } from './article';
import { ICategoryInstance } from './category';
import { updateHappened } from './last_update';

export const USER_GROUP_GENERAL = 'general';
export const USER_GROUP_ADMIN = 'admin';
export const USER_GROUP_SERVICE = 'service';
export const USER_GROUP_YOUTUBE = 'youtube';
export const USER_GROUP_MODERATOR = 'moderator';

export const USER_GROUPS = [
  USER_GROUP_GENERAL,
  USER_GROUP_ADMIN,
  USER_GROUP_SERVICE,
  USER_GROUP_YOUTUBE,
  USER_GROUP_MODERATOR,
];

// Configuration constants for moderator service users
export const ENDPOINT_TYPE_PROXY = 'perspective-proxy';
export const ENDPOINT_TYPE_API = 'perspective-api';

export interface IUserAttributes {
  id?: number;
  group: string;
  email?: string;
  name: string;
  isActive?: boolean;
  extra?: any;
}

export interface IUserInstance extends Sequelize.Instance<IUserAttributes> {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  getAssignedArticles: Sequelize.BelongsToManyGetAssociationsMixin<IArticleInstance>;
  countAssignedArticles: Sequelize.BelongsToManyCountAssociationsMixin;
  countAssignments(): number;

  getAssignedCategories: Sequelize.BelongsToManyGetAssociationsMixin<ICategoryInstance>;
  countAssignedCategories: Sequelize.BelongsToManyCountAssociationsMixin;
}

export const User = sequelize.define<IUserInstance, IUserAttributes>('user', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  group: {
    type: Sequelize.ENUM(USER_GROUPS),
    allowNull: false,
  },

  name: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  email: {
    type: Sequelize.CHAR(255),
    allowNull: true,
  },

  isActive: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  avatarURL: {
    type: Sequelize.CHAR(255),
    allowNull: true,
  },

  extra: {
    type: Sequelize.JSON,
    allowNull: true,
  },
}, {
  indexes: [
    {
      name: 'group_index',
      fields: ['group'],
    },
    {
      name: 'isActive_index',
      fields: ['isActive'],
    },
    {
      fields: ['email', 'group'],
      unique: true,
    },
  ],

  validate: {
    /**
     * Require an email address for non-service users
     */
    requireEmailForHumans() {
      const group = this.get('group');
      if (group === USER_GROUP_GENERAL || group === USER_GROUP_ADMIN) {
        const validEmail = Joi.validate(this.get('email'), Joi.string().email().required(), { convert: false });
        if (validEmail.error) {
          throw new Error('Email address required for human users');
        }
      }
    },
  },

  classMethods: {

    /**
     * User relationships
     */
    associate(models: any) {
      User.belongsToMany(models.Category, {
        through: {
          model: models.UserCategoryAssignment,
          unique: false,
        },
        foreignKey: 'userId',
      });

      User.belongsToMany(models.Article, {
        through: {
          model: models.ModeratorAssignment,
          unique: false,
        },
        foreignKey: 'userId',
        as: 'assignedArticles',
      });

      User.belongsToMany(models.Category, {
        through: {
          model: models.UserCategoryAssignment,
          unique: false,
        },
        foreignKey: 'userId',
        as: 'assignedCategories',
      });
    },
  },

  hooks: {
    afterCreate: updateHappened,
    afterDelete: updateHappened,
    afterUpdate: updateHappened,
    afterBulkCreate: updateHappened,
    afterBulkUpdate: updateHappened,
    afterBulkDestroy: updateHappened,
  },

  instanceMethods: {
    async countAssignments() {
      const articles: Array<IArticleInstance> = await this.getAssignedArticles();
      return articles.reduce((sum, a) => sum + a.get('unmoderatedCount'), 0);
    },
  },
});

export function isUser(instance: any) {
  // TODO: instanceof doesn't work under some circumstances that I don't really understand.
  //       Hopefully fixed in later sequelize.
  //       Instead check for an attribute unique to this object.
  // return instance instanceof User.Instance;
  return instance && instance.get && !!instance.get('group');
}
