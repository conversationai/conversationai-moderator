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
import { updateHappened } from './last_update';

export interface IPreselectAttributes extends IBaseAttributes{
  tagId?: number;
  categoryId?: number;
  createdBy?: number;
  lowerThreshold: number;
  upperThreshold: number;
}

export type IPreselectInstance = Sequelize.Instance<IPreselectAttributes> & IPreselectAttributes & IBaseInstance;

/**
 * Preselect model
 */
export const Preselect = sequelize.define<
  IPreselectInstance,
  IPreselectAttributes
>('preselect', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  lowerThreshold: {
    type: Sequelize.FLOAT(2).UNSIGNED,
    allowNull: false,
  },

  upperThreshold: {
    type: Sequelize.FLOAT(2).UNSIGNED,
    allowNull: false,
  },
}, {
  classMethods: {
    associate(models: any) {
      Preselect.belongsTo(models.Category, {
        onDelete: 'CASCADE',
        foreignKey: {
          allowNull: true,
        },
      });

      Preselect.belongsTo(models.Tag, {
        onDelete: 'CASCADE',
        foreignKey: {
          allowNull: true,
        },
      });

      Preselect.belongsTo(models.User, {
        foreignKey: 'createdBy',
        constraints: false,
      });
    },
  },
  hooks: {
    afterCreate: updateHappened,
    afterDelete: updateHappened,
    afterUpdate: updateHappened,
    afterBulkCreate: updateHappened,
    afterBulkUpdate: updateHappened,
    afterBulkDestroy: updateHappened,
  },
});
