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
import { ICommentInstance } from './comment';
import {
  IResolution,
  MODERATION_ACTION_ACCEPT,
  MODERATION_ACTION_DEFER,
  MODERATION_ACTION_REJECT,
} from './constants';

export interface IDecisionAttributes {
  id?: number;
  commentId?: number;
  userId?: number;
  moderationRuleId?: number;
  isCurrentDecision?: boolean;
  status?: IResolution;
  source?: 'User' | 'Rule';
  sentBackToPublisher?: Date | string | Sequelize.fn;
}

export interface IDecisionInstance
    extends Sequelize.Instance<IDecisionAttributes> {
  id: number;
  createdAt: string;
  updatedAt: string;

  getComment: Sequelize.BelongsToGetAssociationMixin<ICommentInstance>;
}

/**
 * Decision model
 */
export const Decision = sequelize.define<
  IDecisionInstance,
  IDecisionAttributes
>('decision', {
  id: {
    type: Sequelize.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  status: {
    type: Sequelize.ENUM([MODERATION_ACTION_ACCEPT, MODERATION_ACTION_REJECT, MODERATION_ACTION_DEFER]),
    allowNull: false,
  },

  source: {
    type: Sequelize.ENUM(['User', 'Rule']),
    allowNull: false,
  },

  isCurrentDecision: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },

  sentBackToPublisher: {
    type: Sequelize.DATE,
    allowNull: true,
  },
}, {
  classMethods: {
    associate(models: any) {
      Decision.belongsTo(models.Comment, {
        onDelete: 'CASCADE',
      });

      Decision.belongsTo(models.User, {
        onDelete: 'SET NULL',
        foreignKey: {
          allowNull: true,
        },
      });

      Decision.belongsTo(models.ModerationRule, {
        onDelete: 'SET NULL',
        foreignKey: {
          allowNull: true,
        },
      });
    },
  },
});
