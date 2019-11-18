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
import { User } from './user';

export interface IUserSocialAuthAttributes extends IBaseAttributes {
  userId?: number;
  socialId: string;
  provider: string;
  extra?: object | null;
}

export type IUserSocialAuthInstance = Sequelize.Instance<IUserSocialAuthAttributes> &
  IUserSocialAuthAttributes & IBaseInstance;

export const UserSocialAuth = sequelize.define<
  IUserSocialAuthInstance,
  IUserSocialAuthAttributes
>('user_social_auth', {
  userId: {
    type: Sequelize.INTEGER.UNSIGNED,
    references: { model: User, key: 'id' },
    allowNull: false,
  },

  socialId: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  provider: {
    type: Sequelize.CHAR(150),
    allowNull: false,
  },

  extra: {
    type: Sequelize.JSON,
    allowNull: true,
  },
}, {
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

UserSocialAuth.associate = (models) => {
  UserSocialAuth.belongsTo(models.User, {
    onDelete: 'CASCADE',
  });
};
