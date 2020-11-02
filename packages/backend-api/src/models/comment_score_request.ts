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
import { IBaseAttributes, IBaseInstance } from './constants';
import { User } from './user';

export interface ICommentScoreRequestAttributes extends IBaseAttributes {
  commentId?: number;
  userId?: number;
  sentAt: Date | Sequelize.fn;
  doneAt?: Date | Sequelize.fn | null;
}

export type ICommentScoreRequestInstance = Sequelize.Instance<ICommentScoreRequestAttributes> &
  ICommentScoreRequestAttributes & IBaseInstance & {
  getComment: Sequelize.BelongsToGetAssociationMixin<ICommentInstance>;
};

/**
 * CommentScoreRequest model
 */
export const CommentScoreRequest = sequelize.define<
  ICommentScoreRequestInstance,
  ICommentScoreRequestAttributes
>('comment_score_request', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  commentId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },

  sentAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },

  doneAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

CommentScoreRequest.belongsTo(Comment);
CommentScoreRequest.belongsTo(User);
