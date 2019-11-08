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

export interface ITagAttributes extends IBaseAttributes {
  key: string;
  label: string;
  color?: string;
  description?: string;
  isInBatchView?: boolean;
  isTaggable?: boolean;
  inSummaryScore?: boolean;
}

export type ITagInstance = Sequelize.Instance<ITagAttributes> & ITagAttributes & IBaseInstance;

/**
 * Tag model
 */
export const Tag = sequelize.define<ITagInstance, ITagAttributes>('tag', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  key: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  label: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  color: {
    type: Sequelize.CHAR(255),
    allowNull: false,
    defaultValue: '#000000',
  },

  description: {
    type: Sequelize.CHAR(255),
    allowNull: true,
  },

  // If false, hides from frontend-ui. Useful for having tags for
  // various analytics which users are never expected to see. Or if a ML
  // tag is in "beta" and is running silently until the kinks are worked out.
  isInBatchView: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  // If false, hides from tag lists like reason to reject
  // or tags that moderator can apply to a comment
  isTaggable: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  inSummaryScore: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  indexes: [
    {
      fields: ['key'],
      unique: true,
    },
  ],

  classMethods: {
    associate(models: any) {
      Tag.hasMany(models.ModerationRule, {
        as: 'moderationRules',
      });

      Tag.hasMany(models.CommentScore, {
        as: 'commentScores',
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
