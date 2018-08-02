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

export const USER_GROUP_ADMIN = 'admin';
export const USER_GROUP_SERVICE = 'service';

export const USER_GROUPS = [
  'general',
  USER_GROUP_ADMIN,
  USER_GROUP_SERVICE,
];

// Configuration constants for serevice users
export const SERVICE_TYPE_MODERATOR = 'moderator';
export const ENDPOINT_TYPE_PROXY = 'perspective-proxy';
export const ENDPOINT_TYPE_API = 'perspective-api';

export interface IUserAttributes {
  id?: number;
  group: string;
  email?: string;
  name: string;
  endpoint?: string;
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

  // TODO: Create database migration to remove endpoint.
  // Endpoint is now stored in the extra data.  But leaving this here to facilitate migrations
  // Remove when everyone has settled on the new database structure.
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
      if (this.get('group') !== USER_GROUP_SERVICE) {
        const validEmail = Joi.validate(this.get('email'), Joi.string().email().required(), { convert: false });
        if (validEmail.error) {
          throw new Error('Email address required for human users');
        }
      }
    },

    /**
     * If `endpoint` is set, make sure it's a valid URL
     */
    requireValidURLForEndpoint() {
      if (this.get('extra')) {
        const extra: any = this.get('extra');

        if (extra && extra.serviceType === SERVICE_TYPE_MODERATOR) {
          if (extra.endpointType === ENDPOINT_TYPE_PROXY || extra.endpointType === ENDPOINT_TYPE_API) {
            const validURL = Joi.validate(extra.endpoint, Joi.string().uri({
              scheme: ['http', 'https'],
            }).required(), { convert: false });
            if (validURL.error) {
              throw new Error('Moderator user validation: `endpoint` must be a valid URL');
            }
          }
          else {
            throw new Error('Moderator user validation: Unknown modereator endpoint type ' + extra.endpointType);
          }
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
