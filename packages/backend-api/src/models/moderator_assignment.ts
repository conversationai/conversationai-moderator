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

import {DataTypes, Model} from 'sequelize';

import {sequelize} from '../sequelize';
import {Article} from './article';
import {User} from './user';

/**
 * Article model
 */
export class ModeratorAssignment extends Model {
  id: number;
  userId: number;
  articleId: number;
}

ModeratorAssignment.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  articleId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'moderator_assignment',
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
});

ModeratorAssignment.belongsTo(User, {
  onDelete: 'CASCADE',
});

ModeratorAssignment.belongsTo(Article, {
  onDelete: 'CASCADE',
});
