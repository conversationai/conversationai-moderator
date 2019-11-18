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
import { Comment } from './comment';
import { IBaseAttributes, IBaseInstance } from './constants';
import { User } from './user';

export interface ICommentFlagAttributes extends IBaseAttributes {
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

export type ICommentFlagInstance = Sequelize.Instance<ICommentFlagAttributes> & ICommentFlagAttributes & IBaseInstance;

/**
 * CommentFlag model
 */
export const CommentFlag = sequelize.define<ICommentFlagInstance, ICommentFlagAttributes>('comment_flag', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  label: {
    type: Sequelize.CHAR(80),
    allowNull: false,
  },

  detail: {
    type: Sequelize.STRING,
    allowNull: true,
  },

  isRecommendation: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },

  commentId: {
    type: Sequelize.INTEGER.UNSIGNED,
    references: { model: Comment, key: 'id' },
    onDelete: 'cascade',
    onUpdate: 'cascade',
  },

  sourceId: {
    type: Sequelize.CHAR(255),
    allowNull: true,
  },

  authorSourceId: {
    type: Sequelize.CHAR(255),
    allowNull: true,
  },

  isResolved: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },

  resolvedById: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: User, key: 'id' },
    onDelete: 'set null',
  },

  resolvedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },

  extra: {
    type: Sequelize.JSON,
    allowNull: true,
  },
}, {
  charset: 'utf8',
});

CommentFlag.associate = (models) => {
  CommentFlag.belongsTo(models.Comment, {
    onDelete: 'CASCADE',
  });
};
