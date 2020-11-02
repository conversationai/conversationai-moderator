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
import { IBaseAttributes, IBaseInstance } from './constants';

export interface ICommentTopScoreAttributes extends IBaseAttributes {
  commentId: number;
  tagId: number;
  commentScoreId: number;
}

export type ICommentTopScoreInstance = Sequelize.Instance<ICommentTopScoreAttributes> &
  ICommentTopScoreAttributes & IBaseInstance;

/**
 * Category model
 */
export const CommentTopScore = sequelize.define<
  ICommentTopScoreInstance,
  ICommentTopScoreAttributes
>('comment_top_score', {
  commentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  },

  tagId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  },

  commentScoreId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
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
});
