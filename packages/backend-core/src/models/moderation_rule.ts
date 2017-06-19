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

export const MODERATION_RULE_ACTION_TYPES = [
  'Accept',
  'Reject',
  'Defer',
  'Highlight',
];

export interface IModerationRuleAttributes {
  tagId: number;
  categoryId?: number;
  createdBy?: number;
  lowerThreshold: number;
  upperThreshold: number;
  action: string;
}

export interface IModerationRuleInstance
    extends Sequelize.Instance<
      IModerationRuleAttributes
    > {
  id: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * ModerationRule model
 */
export const ModerationRule = sequelize.define<
  IModerationRuleInstance,
  IModerationRuleAttributes
>('moderation_rule', {
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

  action: {
    type: Sequelize.ENUM(MODERATION_RULE_ACTION_TYPES),
    allowNull: false,
  },
}, {
  classMethods: {
    associate(models: any) {
      ModerationRule.belongsTo(models.Category, {
        onDelete: 'CASCADE',
        foreignKey: {
          allowNull: true,
        },
      });

      ModerationRule.belongsTo(models.Tag, {
        onDelete: 'CASCADE',
        foreignKey: {
          allowNull: false,
        },
      });

      ModerationRule.belongsTo(models.User, {
        foreignKey: 'createdBy',
        constraints: false,
      });
    },
  },
});
