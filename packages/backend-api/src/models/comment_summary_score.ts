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

import {BelongsToGetAssociationMixin, DataTypes, Model} from 'sequelize';

import {sequelize} from '../sequelize';
import {Comment} from './comment';
import {Tag} from './tag';
import {User} from './user';

export class CommentSummaryScore extends Model {
  id: number;
  commentId: number;
  tagId: number;
  score: number;
  isConfirmed?: boolean | null;
  confirmedUserId?: number | null;
  getTag: BelongsToGetAssociationMixin<Tag>;
}

CommentSummaryScore.init({
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

  score: {
    type: DataTypes.FLOAT.UNSIGNED, // Score from 0 - 1
    allowNull: false,
  },

  isConfirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null,
  },

  confirmedUserId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    defaultValue: null,
  },
}, {
  sequelize,
  modelName: 'comment_summary_score',
  timestamps: false,
  indexes: [
    {
      name: 'commentId_tagId_index',
      fields: ['commentId', 'tagId'],
      unique: true,
    },
  ],
});

CommentSummaryScore.removeAttribute('id');

CommentSummaryScore.belongsTo(Comment, {
  onDelete: 'CASCADE',
});

CommentSummaryScore.belongsTo(Tag, {
  onDelete: 'CASCADE',
});

CommentSummaryScore.belongsTo(User, {
  as: 'confirmedUser',
  onDelete: 'CASCADE',
});
