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
import {updateHappened} from './last_update';

/**
 * Tag model
 */
export class Tag extends Model {
  id: number;
  key: string;
  label: string;
  color?: string;
  description?: string;
  isInBatchView?: boolean;
  isTaggable?: boolean;
  inSummaryScore?: boolean;
}
Tag.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  key: {
    type: DataTypes.CHAR(255),
    allowNull: false,
  },

  label: {
    type: DataTypes.CHAR(255),
    allowNull: false,
  },

  color: {
    type: DataTypes.CHAR(255),
    allowNull: false,
    defaultValue: '#000000',
  },

  description: {
    type: DataTypes.CHAR(255),
    allowNull: true,
  },

  // If false, hides from frontend-ui. Useful for having tags for
  // various analytics which users are never expected to see. Or if a ML
  // tag is in "beta" and is running silently until the kinks are worked out.
  isInBatchView: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  // If false, hides from tag lists like reason to reject
  // or tags that moderator can apply to a comment
  isTaggable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  inSummaryScore: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  modelName: 'tag',
  indexes: [
    {
      fields: ['key'],
      unique: true,
    },
  ],
  hooks: {
    afterCreate: updateHappened,
    afterDestroy: updateHappened,
    afterUpdate: updateHappened,
    afterBulkCreate: updateHappened,
    afterBulkUpdate: updateHappened,
    afterBulkDestroy: updateHappened,
  },
});