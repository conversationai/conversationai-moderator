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

import { config } from '@conversationai/moderator-config';

import * as Sequelize from 'sequelize';

let mysqlConfig = {
  dialect: 'mysql',
  logging: false,
};

if (config.get('database_socket') !== 'nevermind') {
  mysqlConfig = {
    ...mysqlConfig,
    dialectOptions: {
      socketPath: config.get('database_socket'),
    },
  };
} else {
  mysqlConfig = {
    ...mysqlConfig,
    host: config.get('database_host'),
    port: config.get('database_port'),
  };
}

export const sequelize = new Sequelize(
  config.get('database_name'),
  config.get('database_user'),
  config.get('database_password'),
  mysqlConfig,
);
