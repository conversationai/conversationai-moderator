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
import {Comment} from './comment';
import {User} from './user';

export class CommentFlag extends Model {
  id: number;
  label: string;
  detail?: string;
  isRecommendation: boolean;
  commentId: number;
  sourceId?: string;
  authorSourceId?: string;
  isResolved: boolean;
  resolvedById?: number;
  resolvedAt?: Date | null;
  extra?: object | null;
}

CommentFlag.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  label: {
    type: DataTypes.CHAR(80),
    allowNull: false,
  },

  detail: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  isRecommendation: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  commentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    references: { model: Comment, key: 'id' },
    onDelete: 'cascade',
    onUpdate: 'cascade',
  },

  sourceId: {
    type: DataTypes.CHAR(255),
    allowNull: true,
  },

  authorSourceId: {
    type: DataTypes.CHAR(255),
    allowNull: true,
  },

  isResolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  resolvedById: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: User, key: 'id' },
    onDelete: 'set null',
  },

  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  extra: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'comment_flag',
  charset: 'utf8',
});

CommentFlag.belongsTo(Comment, {
  onDelete: 'CASCADE',
});
