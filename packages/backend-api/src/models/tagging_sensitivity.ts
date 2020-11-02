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
import { Category } from './category';
import { IBaseAttributes, IBaseInstance } from './constants';
import { updateHappened } from './last_update';
import { Tag } from './tag';
import { User } from './user';

export interface ITaggingSensitivityAttributes extends IBaseAttributes {
  tagId?: number;
  categoryId?: number;
  createdBy?: number;
  lowerThreshold: number;
  upperThreshold: number;
}

export type ITaggingSensitivityInstance = Sequelize.Instance<ITaggingSensitivityAttributes> &
  ITaggingSensitivityAttributes & IBaseInstance;

/**
 * TaggingSensitivity model
 */
export const TaggingSensitivity = sequelize.define<
  ITaggingSensitivityInstance,
  ITaggingSensitivityAttributes
>('tagging_sensitivity', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  tagId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  categoryId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  createdBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  lowerThreshold: {
    type: DataTypes.FLOAT(2).UNSIGNED,
    allowNull: false,
  },

  upperThreshold: {
    type: DataTypes.FLOAT(2).UNSIGNED,
    allowNull: false,
  },
}, {
  hooks: {
    afterCreate: updateHappened,
    afterDestroy: updateHappened,
    afterUpdate: updateHappened,
    afterBulkCreate: updateHappened,
    afterBulkUpdate: updateHappened,
    afterBulkDestroy: updateHappened,
  },
});

TaggingSensitivity.belongsTo(Category, {
  onDelete: 'CASCADE',
  foreignKey: {
    allowNull: true,
  },
});

TaggingSensitivity.belongsTo(Tag, {
  onDelete: 'CASCADE',
  foreignKey: {
    allowNull: true,
  },
});

TaggingSensitivity.belongsTo(User, {
  foreignKey: 'createdBy',
  constraints: false,
});
