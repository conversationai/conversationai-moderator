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
import {User} from './user';

export class UserSocialAuth extends Model {
  id: number;
  userId?: number;
  socialId: string;
  provider: string;
  extra?: object | null;
}

UserSocialAuth.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    references: { model: User, key: 'id' },
    allowNull: false,
  },

  socialId: {
    type: DataTypes.CHAR(255),
    allowNull: false,
  },

  provider: {
    type: DataTypes.CHAR(150),
    allowNull: false,
  },

  extra: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  sequelize,
  modelName: 'user_social_auth',
  indexes: [
    {
      name: 'unique_user_provider_index',
      fields: ['provider', 'userId'],
      unique: true,
    },
    {
      name: 'unique_provider_user_index',
      fields: ['provider', 'socialId'],
      unique: true,
    },
  ],
});

UserSocialAuth.belongsTo(User, {
  onDelete: 'CASCADE',
});
