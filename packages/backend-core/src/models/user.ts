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

export const USER_GROUPS = [
  'general',
  'admin',
  'service',
];

export interface IUserAttributes {
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

  // Scoring endpoint for 'service' users to post comments to for scoring

  endpoint: {
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
      fields: ['email'],
      unique: true,
    },
  ],

  validate: {
    /**
     * Require an email address for non-service users
     */
    requireEmailForHumans() {
      if (this.get('group') !== 'service') {
        const validEmail = Joi.validate(this.get('email'), Joi.string().email().required(), { convert: false });
        if (validEmail.error !== null) {
          throw new Error('Email address required for human users');
        }
      }
    },

    /**
     * If `endpoint` is set, make sure it's a valid URL
     */
    requireValidURLForEndpoint() {
      if (this.get('endpoint')) {
        const validURL = Joi.validate(this.get('endpoint'), Joi.string().uri({
          scheme: ['http', 'https'],
        }).required(), { convert: false });
        if (validURL.error !== null) {
          throw new Error('`endpoint` must be a valid URL');
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

});
