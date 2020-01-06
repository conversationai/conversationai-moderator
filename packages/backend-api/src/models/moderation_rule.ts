/*
Copyright 2019 Google Inc.

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
import {
  IAction,
  MODERATION_ACTION_ACCEPT,
  MODERATION_ACTION_DEFER,
  MODERATION_ACTION_HIGHLIGHT,
  MODERATION_ACTION_REJECT,
} from './constants';
import { IBaseAttributes, IBaseInstance } from './constants';
import { updateHappened } from './last_update';

export const MODERATION_RULE_ACTION_TYPES = [
  MODERATION_ACTION_ACCEPT,
  MODERATION_ACTION_REJECT,
  MODERATION_ACTION_DEFER,
  MODERATION_ACTION_HIGHLIGHT,
];

export interface IModerationRuleAttributes extends IBaseAttributes {
  tagId: number;
  categoryId?: number;
  createdBy?: number;
  lowerThreshold: number;
  upperThreshold: number;
  action: IAction;
}

export type IModerationRuleInstance = Sequelize.Instance<IModerationRuleAttributes> &
  IModerationRuleAttributes & IBaseInstance;

/**
 * ModerationRule model
 */
export const ModerationRule = sequelize.define<
  IModerationRuleInstance,
  IModerationRuleAttributes
>('moderation_rules', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  tagId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
  },

  categoryId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
  },

  createdBy: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
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
  hooks: {
    afterCreate: updateHappened,
    afterDestroy: updateHappened,
    afterUpdate: updateHappened,
    afterBulkCreate: updateHappened,
    afterBulkUpdate: updateHappened,
    afterBulkDestroy: updateHappened,
  },
});

export function isModerationRule(instance: any) {
  // TODO: instanceof doesn't work under some circumstances that I don't really understand.
  //       Hopefully fixed in later sequelize.
  //       Instead check for an attribute unique to this object.
  // return instance instanceof ModerationRule.Instance;
  return instance && instance.get && !!instance.action;
}

ModerationRule.associate = (models) => {
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
};
