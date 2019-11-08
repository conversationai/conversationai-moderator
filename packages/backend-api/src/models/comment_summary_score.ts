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
import { IBaseAttributes, IBaseInstance } from './constants';
import { ITagInstance } from './tag';

export interface ICommentSummaryScoreAttributes extends IBaseAttributes{
  commentId: number;
  tagId: number;
  score: number;
  isConfirmed?: boolean | null;
  confirmedUserId?: number | null;
}

export type ICommentSummaryScoreInstance = Sequelize.Instance<ICommentSummaryScoreAttributes> &
  ICommentSummaryScoreAttributes & IBaseInstance & {
  getTag: Sequelize.BelongsToGetAssociationMixin<ITagInstance>;
}

/**
 * Category model
 */
export const CommentSummaryScore = sequelize.define<
  ICommentSummaryScoreInstance,
  ICommentSummaryScoreAttributes
>('comment_summary_score', {
  commentId: {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  },

  tagId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  },

  score: {
    type: Sequelize.FLOAT.UNSIGNED, // Score from 0 - 1
    allowNull: false,
  },

  isConfirmed: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: null,
  },

  confirmedUserId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  },
}, {
  timestamps: false,

  indexes: [
    {
      name: 'commentId_tagId_index',
      fields: ['commentId', 'tagId'],
      unique: true,
    },
  ],

  classMethods: {
    associate(models: any) {
      CommentSummaryScore.belongsTo(models.Comment, {
        onDelete: 'CASCADE',
      });

      CommentSummaryScore.belongsTo(models.Tag, {
        onDelete: 'CASCADE',
      });
    },
  },
});
