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
import { IArticleInstance } from './article';
import { ICommentSummaryScoreInstance } from './comment_summary_score';
import { IDecisionInstance } from './decision';

export interface IAuthorAttributes {
  name: string;
  email?: string;
  location?: string;
  avatar?: string;
}

export interface ICommentAttributes {
  id?: number;
  ownerId?: number;
  sourceId: string;
  articleId: number | null;
  replyToSourceId?: string | null;
  replyId?: number | null;
  authorSourceId: string;
  text: string;
  author: string | IAuthorAttributes;
               // TODO:  Actually, this must be an IAuthorAttributes, or client will not be happy.
               //        But current version of Sequelize fetches JSON data as strings that we have to decode
               //        May be able to fix this in a later version of Sequelize
  isModerated?: boolean;
  isScored?: boolean;
  isAccepted?: boolean | null;
  isDeferred?: boolean | null;
  isHighlighted?: boolean | null;
  isBatchResolved?: boolean | null;
  isAutoResolved?: boolean | null;
  flaggedCount?: number;
  recommendedCount?: number;
  sourceCreatedAt: Date | string | null | Sequelize.fn;
  sentForScoring?: string | null | Sequelize.fn;
  sentBackToPublisher?: Date | null | Sequelize.fn;
  extra?: any | null;
  maxSummaryScore?: number | null;
  maxSummaryScoreTagId?: string | null;
}

export interface ICommentInstance extends Sequelize.Instance<ICommentAttributes> {
  id: number;
  createdAt: string;
  updatedAt: string;
  getArticle: Sequelize.BelongsToGetAssociationMixin<IArticleInstance>;
  getDecisions: Sequelize.HasManyGetAssociationsMixin<IDecisionInstance>;
  getCommentSummaryScores: Sequelize.HasManyGetAssociationsMixin<ICommentSummaryScoreInstance>;
  getReplyTo: Sequelize.BelongsToGetAssociationMixin<ICommentInstance>;
}

/**
 * Comment model
 */
export const Comment = sequelize.define<ICommentInstance, ICommentAttributes>('comment', {
  id: {
    type: Sequelize.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  ownerId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
  },

  sourceId: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  articleId: {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: true,
    // references: { model: Article },
  },

  replyToSourceId: {
    type: Sequelize.CHAR(255),
    allowNull: true,
  },

  replyId: {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: true,
  },

  authorSourceId: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  text: {
    type: Sequelize.TEXT('long'),
    allowNull: false,
  },

  author: {
    type: Sequelize.JSON,
    allowNull: false,
  },

  isScored: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  isModerated: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  isAccepted: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: null,
  },

  isDeferred: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  isHighlighted: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  isBatchResolved: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  isAutoResolved: {
    type: Sequelize.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  flaggedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  recommendedCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  sourceCreatedAt: {
    type: Sequelize.DATE,
    allowNull: true,
  },

  sentForScoring: {
    type: Sequelize.DATE,
    allowNull: true,
  },

  sentBackToPublisher: {
    type: Sequelize.DATE,
    allowNull: true,
  },

  extra: {
    type: Sequelize.JSON,
    allowNull: true,
  },

  maxSummaryScore: {
    type: Sequelize.FLOAT.UNSIGNED,
    allowNull: true,
  },

  maxSummaryScoreTagId: {
    type: Sequelize.BIGINT.UNSIGNED,
    allowNull: true,
  },
}, {
  indexes: [
    {
      name: 'replyToSourceId_index',
      fields: ['replyToSourceId'],
    },
    {
      name: 'replyId_index',
      fields: ['replyId'],
    },
    {
      name: 'authorSourceId_index',
      fields: ['authorSourceId'],
    },
    {
      name: 'isAccepted_index',
      fields: ['isAccepted'],
    },
    {
      name: 'isDeferred_index',
      fields: ['isDeferred'],
    },
    {
      name: 'isHighlighted_index',
      fields: ['isHighlighted'],
    },
    {
      name: 'isBatchResolved_index',
      fields: ['isBatchResolved'],
    },
    {
      name: 'isAutoResolved_index',
      fields: ['isAutoResolved'],
    },
    {
      name: 'sentForScoring_index',
      fields: ['sentForScoring'],
    },
    {
      name: 'sentBackToPublisher_index',
      fields: ['sentBackToPublisher'],
    },
    {
      name: 'maxSummaryScore_index',
      fields: ['maxSummaryScore'],
    },
    {
      name: 'maxSummaryScoreTagId_index',
      fields: ['maxSummaryScoreTagId'],
    },
  ],

  classMethods: {
    addFullTextIndex() {
      return sequelize.getQueryInterface().addIndex('comments', ['text'], {
        indicesType: 'FULLTEXT',
      } as any);
    },

    /**
     * Comment relationships
     */
    associate(models: any) {
      Comment.belongsTo(models.User, {as: 'owner'});
      Comment.belongsTo(models.Article);

      Comment.hasMany(models.CommentScore, {
        as: 'commentScores',
      });

      Comment.hasMany(models.CommentSummaryScore, {
        as: 'commentSummaryScores',
      });

      Comment.hasMany(models.Decision, {
        as: 'decisions',
      });

      Comment.hasMany(models.CommentSize, {
        as: 'commentSizes',
      });

      Comment.belongsTo(models.Comment, {
        foreignKey: 'replyId',
        onDelete: 'SET NULL',
        as: 'replyTo',
      });

      Comment.hasMany(models.Comment, {
        foreignKey: 'replyId',
        as: 'replies',
      });

      Comment.belongsToMany(models.Category, {
        through: {
          model: models.Article,
          unique: false,
        },
        foreignKey: 'categoryId',
      });
    },

  },
}) as Sequelize.Model<ICommentInstance, ICommentAttributes> & { addFullTextIndex(): any };
