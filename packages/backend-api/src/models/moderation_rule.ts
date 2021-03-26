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

import {DataTypes, Model} from 'sequelize';

import {sequelize} from '../sequelize';

import {Category} from './category';
import {
  IAction,
  MODERATION_ACTION_ACCEPT,
  MODERATION_ACTION_DEFER,
  MODERATION_ACTION_HIGHLIGHT,
  MODERATION_ACTION_REJECT,
} from './constants';
import {Tag} from './tag';
import {User} from './user';

export const MODERATION_RULE_ACTION_TYPES = [
  MODERATION_ACTION_ACCEPT,
  MODERATION_ACTION_REJECT,
  MODERATION_ACTION_DEFER,
  MODERATION_ACTION_HIGHLIGHT,
];

export const MODERATION_RULE_ACTION_TYPES_SET = new Set(MODERATION_RULE_ACTION_TYPES);

export class ModerationRule extends Model {
  id: number;
  tagId: number;
  categoryId?: number;
  createdBy?: number;
  lowerThreshold: number;
  upperThreshold: number;
  action: IAction;
}

ModerationRule.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  tagId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
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

  action: {
    type: DataTypes.ENUM(...MODERATION_RULE_ACTION_TYPES),
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'moderation_rules',
});

ModerationRule.belongsTo(Category, {
  onDelete: 'CASCADE',
  foreignKey: {
    allowNull: true,
  },
});

ModerationRule.belongsTo(Tag, {
  onDelete: 'CASCADE',
  foreignKey: {
    allowNull: false,
  },
});

ModerationRule.belongsTo(User, {
  foreignKey: 'createdBy',
  constraints: false,
});

export function isModerationRule(instance: any) {
  // TODO: instanceof doesn't work under some circumstances that I don't really understand.
  //       Hopefully fixed in later sequelize.
  //       Instead check for an attribute unique to this object.
  // return instance instanceof ModerationRule.Instance;
  return instance && instance.get && !!instance.action;
}
