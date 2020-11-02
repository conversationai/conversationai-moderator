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
import { Comment, ICommentInstance } from './comment';
import { CommentScoreRequest } from './comment_score_request';
import { IBaseAttributes, IBaseInstance } from './constants';
import { ITagInstance, Tag } from './tag';
import { User } from './user';

export const SCORE_SOURCE_TYPES = [
  'User',
  'Moderator',
  'Machine',
];

export interface ICommentScoreAttributes extends IBaseAttributes {
  commentId?: number | null;
  confirmedUserId?: number;
  commentScoreRequestId?: number;
  tagId?: number | null;
  userId?: number;
  sourceType: string;
  sourceId?: string | null;
  score: number;
  annotationStart?: number | null;
  annotationEnd?: number | null;
  isConfirmed?: boolean | null;
  extra?: object | null;
}

export type ICommentScoreInstance = Sequelize.Instance<ICommentScoreAttributes> &
  ICommentScoreAttributes & IBaseInstance & {
  getComment: Sequelize.BelongsToGetAssociationMixin<ICommentInstance>;
  getTag: Sequelize.BelongsToGetAssociationMixin<ITagInstance>;
};

/**
 * CommentScore model
 */
export const CommentScore = sequelize.define<ICommentScoreInstance, ICommentScoreAttributes>('comment_score', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  commentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    references: { model: Comment, key: 'id' },
    allowNull: false,
    onDelete: 'cascade',
    onUpdate: 'cascade',
  },

  tagId: {
    type: DataTypes.INTEGER.UNSIGNED,
    references: { model: Tag, key: 'id' },
    allowNull: false,
    onDelete: 'cascade',
    onUpdate: 'cascade',
  },

  sourceType: {
    type: DataTypes.ENUM(...SCORE_SOURCE_TYPES),
    allowNull: false,
  },

  sourceId: {
    type: DataTypes.CHAR(255),
    allowNull: true,
  },

  score: {
    type: DataTypes.FLOAT.UNSIGNED, // Score from 0 - 1
    allowNull: false,
  },

  annotationStart: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  annotationEnd: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  extra: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  confirmedUserId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  isConfirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },

}, {
  indexes: [
    {
      name: 'commentId_index',
      fields: ['commentId'],
    },
    {
      name: 'commentId_score_index',
      fields: ['commentId', 'score'],
    },
    {
      name: 'commentId_score_tagId_index',
      fields: ['commentId', 'score', 'tagId'],
    },
  ],
});

CommentScore.belongsTo(Comment, {
  onDelete: 'CASCADE',
});
CommentScore.belongsTo(CommentScoreRequest, {
  as: 'commentScoreRequest',
  onDelete: 'CASCADE',
});
CommentScore.belongsTo(Tag, {
  onDelete: 'CASCADE',
});
CommentScore.belongsTo(User, {
  onDelete: 'SET NULL',
});
