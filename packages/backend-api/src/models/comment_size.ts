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

export interface ICommentSizeAttributes extends IBaseAttributes {
  commentId: number;
  width: number;
  height: number;
}

export type ICommentSizeInstance = Sequelize.Instance<ICommentSizeAttributes> &
  ICommentSizeAttributes & IBaseInstance;

/**
 * Category model
 */
export const CommentSize = sequelize.define<
  ICommentSizeInstance,
  ICommentSizeAttributes
>('comment_size', {
  commentId: {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: false,
    primaryKey: true,
  },

  width: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
  },

  height: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
  },
}, {
  indexes: [
    {
      name: 'commentId_width_index',
      fields: ['commentId', 'width'],
      unique: true,
    },
  ],

  classMethods: {

    /**
     * Article relationships
     */
    associate(models: any) {
      CommentSize.belongsTo(models.Comment, {
        onDelete: 'CASCADE',
      });
    },
  },

});
