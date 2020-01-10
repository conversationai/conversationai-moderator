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
import { Article, IArticleInstance } from './article';
import { ICommentSummaryScoreInstance } from './comment_summary_score';
import { IBaseAttributes, IBaseInstance } from './constants';
import { IDecisionInstance } from './decision';
import { User } from './user';

export interface IAuthorAttributes {
  name: string;
  email?: string;
  location?: string;
  avatar?: string;
}

export const FLAGS_COUNT = 0;
export const UNRESOLVED_FLAGS_COUNT = 1;
export const RECOMMENDATIONS_COUNT = 2;

export interface IFlagSummary {
  [key: string]: Array<number>;
}

export interface ICommentAttributes extends IBaseAttributes {
  ownerId?: number;
  sourceId: string;
  articleId: number | null;
  replyToSourceId?: string | null;
  replyId?: number | null;
  authorSourceId: string;
  text: string;
  author: IAuthorAttributes;
  isModerated?: boolean;
  isScored?: boolean;
  isAccepted?: boolean | null;
  isDeferred?: boolean | null;
  isHighlighted?: boolean | null;
  isBatchResolved?: boolean | null;
  isAutoResolved?: boolean | null;
  unresolvedFlagsCount?: number;
  flagsSummary?: IFlagSummary | null;
  sourceCreatedAt: Date | null | Sequelize.fn;
  sentForScoring?: Date | null | Sequelize.fn;
  sentBackToPublisher?: Date | null | Sequelize.fn;
  extra?: object | null;
  maxSummaryScore?: number | null;
  maxSummaryScoreTagId?: string | null;
}

export type ICommentInstance = Sequelize.Instance<ICommentAttributes> & ICommentAttributes & IBaseInstance & {
  getArticle: Sequelize.BelongsToGetAssociationMixin<IArticleInstance>;
  getDecisions: Sequelize.HasManyGetAssociationsMixin<IDecisionInstance>;
  getCommentSummaryScores: Sequelize.HasManyGetAssociationsMixin<ICommentSummaryScoreInstance>;
  getReplyTo: Sequelize.BelongsToGetAssociationMixin<ICommentInstance>;
};

/**
 * Comment model
 */
export const Comment = sequelize.define<ICommentInstance, ICommentAttributes>('comment', {
  id: {
   type: Sequelize.INTEGER.UNSIGNED,
   primaryKey: true,
   autoIncrement: true,
  },

  ownerId: {
    type: Sequelize.INTEGER.UNSIGNED,
    references: { model: User, key: 'id' },
    allowNull: true,
  },

  sourceId: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  articleId: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: Article, key: 'id' },
  },

  replyToSourceId: {
    type: Sequelize.CHAR(255),
    allowNull: true,
  },

  replyId: {
    type: Sequelize.INTEGER.UNSIGNED,
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

  unresolvedFlagsCount: {
    type: Sequelize.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  flagsSummary: {
    type: Sequelize.JSON,
    allowNull: true,
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
    type: Sequelize.INTEGER.UNSIGNED,
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
    {
      name: 'comments_text',
      type: 'FULLTEXT',
      fields: ['text'],
    },
  ],
});

Comment.associate = (models) => {
  Comment.belongsTo(models.User, {as: 'owner'});
  Comment.belongsTo(models.Article);

  Comment.hasMany(models.CommentFlag, {
    as: 'commentFlags',
  });

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
};
