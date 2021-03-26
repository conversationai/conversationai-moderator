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

import {DataTypes, Model} from 'sequelize';

import {sequelize} from '../sequelize';
import {Category} from './category';
import {Tag} from './tag';
import {User} from './user';

export class Preselect extends Model {
  id: number;
  tagId?: number;
  categoryId?: number;
  createdBy?: number;
  lowerThreshold: number;
  upperThreshold: number;
}

Preselect.init({
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
  sequelize,
  modelName: 'preselect',
});

Preselect.belongsTo(Category, {
  onDelete: 'CASCADE',
  foreignKey: {
    allowNull: true,
  },
});

Preselect.belongsTo(Tag, {
  onDelete: 'CASCADE',
  foreignKey: {
    allowNull: true,
  },
});

Preselect.belongsTo(User, {
  foreignKey: 'createdBy',
  constraints: false,
});
