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

import {BelongsToGetAssociationMixin, DataTypes, Model} from 'sequelize';

import {sequelize} from '../sequelize';
import {Comment} from './comment';
import {
  IResolution,
  MODERATION_ACTION_ACCEPT,
  MODERATION_ACTION_DEFER,
  MODERATION_ACTION_REJECT,
} from './constants';
import {ModerationRule} from './moderation_rule';
import {User} from './user';

/**
 * Decision model
 */
export class Decision extends Model {
  id: number;
  commentId?: number;
  userId?: number;
  moderationRuleId?: number;
  isCurrentDecision?: boolean;
  status?: IResolution;
  source?: 'User' | 'Rule';
  sentBackToPublisher?: Date;

  getComment: BelongsToGetAssociationMixin<Comment>;
}

Decision.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  status: {
    type: DataTypes.ENUM(MODERATION_ACTION_ACCEPT, MODERATION_ACTION_REJECT, MODERATION_ACTION_DEFER),
    allowNull: false,
  },

  source: {
    type: DataTypes.ENUM('User', 'Rule'),
    allowNull: false,
  },

  isCurrentDecision: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },

  sentBackToPublisher: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'decision',
});

Decision.belongsTo(Comment, {
  onDelete: 'CASCADE',
});

Decision.belongsTo(User, {
  onDelete: 'SET NULL',
  foreignKey: {
    allowNull: true,
  },
});

Decision.belongsTo(ModerationRule, {
  onDelete: 'SET NULL',
  foreignKey: {
    allowNull: true,
  },
});
