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
import {Comment, ICommentInstance} from './comment';
import { IBaseAttributes, IBaseInstance } from './constants';
import { ITagInstance, Tag } from './tag';

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
  extra?: any | null;
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
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  commentId: {
    type: Sequelize.INTEGER.UNSIGNED,
    references: { model: Comment, key: 'id' },
    allowNull: false,
    onDelete: 'cascade',
    onUpdate: 'cascade',
  },

  tagId: {
    type: Sequelize.INTEGER.UNSIGNED,
    references: { model: Tag, key: 'id' },
    allowNull: false,
    onDelete: 'cascade',
    onUpdate: 'cascade',
  },

  sourceType: {
    type: Sequelize.ENUM(SCORE_SOURCE_TYPES),
    allowNull: false,
  },

  sourceId: {
    type: Sequelize.CHAR(255),
    allowNull: true,
  },

  score: {
    type: Sequelize.FLOAT.UNSIGNED, // Score from 0 - 1
    allowNull: false,
  },

  annotationStart: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
  },

  annotationEnd: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
  },

  extra: {
    type: Sequelize.JSON,
    allowNull: true,
  },

  confirmedUserId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
  },

  isConfirmed: {
    type: Sequelize.BOOLEAN,
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

CommentScore.associate = (models) => {
  CommentScore.belongsTo(models.Comment, {
    onDelete: 'CASCADE',
  });
  CommentScore.belongsTo(models.CommentScoreRequest, {
    as: 'commentScoreRequest',
    onDelete: 'CASCADE',
  });
  CommentScore.belongsTo(models.Tag, {
    onDelete: 'CASCADE',
  });
  CommentScore.belongsTo(models.User, {
    onDelete: 'SET NULL',
  });
};
