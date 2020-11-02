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

import {
  BelongsToGetAssociationMixin,
  DataTypes,
  HasManyGetAssociationsMixin,
  Model,
} from 'sequelize';

import {sequelize} from '../sequelize';
import {Article} from './article';
import {User} from './user';

declare class Decision extends Model {}

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

export class Comment extends Model {
  id: number;
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
  sourceCreatedAt: Date | null;
  sentForScoring?: Date | null;
  sentBackToPublisher?: Date | null;
  extra?: object | null;
  maxSummaryScore?: number | null;
  maxSummaryScoreTagId?: string | null;

  getArticle: BelongsToGetAssociationMixin<Article>;
  getReplyTo: BelongsToGetAssociationMixin<Comment>;
  getDecisions: HasManyGetAssociationsMixin<Decision>;
  getReplies: HasManyGetAssociationsMixin<Comment>;
}

Comment.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },

  ownerId: {
    type: DataTypes.INTEGER.UNSIGNED,
    references: { model: User, key: 'id' },
    allowNull: true,
  },

  sourceId: {
    type: DataTypes.CHAR(255),
    allowNull: false,
  },

  articleId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    references: { model: Article, key: 'id' },
  },

  replyToSourceId: {
    type: DataTypes.CHAR(255),
    allowNull: true,
  },

  replyId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },

  authorSourceId: {
    type: DataTypes.CHAR(255),
    allowNull: false,
  },

  text: {
    type: DataTypes.TEXT({length: 'long'}),
    allowNull: false,
  },

  author: {
    type: DataTypes.JSON,
    allowNull: false,
  },

  isScored: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  isModerated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  isAccepted: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: null,
  },

  isDeferred: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  isHighlighted: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  isBatchResolved: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  isAutoResolved: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },

  unresolvedFlagsCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },

  flagsSummary: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  sourceCreatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  sentForScoring: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  sentBackToPublisher: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  extra: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  maxSummaryScore: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: true,
  },

  maxSummaryScoreTagId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'comment',
  indexes: [
    {
      name: 'replyToSourceId_index',
      fields: ['replyToSourceId'],
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

Comment.belongsTo(User, {as: 'owner'});
Comment.belongsTo(Article);
Comment.belongsTo(Comment, {
  foreignKey: 'replyId',
  onDelete: 'SET NULL',
  as: 'replyTo',
});

Comment.hasMany(Comment, {
  foreignKey: 'replyId',
  as: 'replies',
});
