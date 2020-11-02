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

import { config } from './config';

export const dialect = 'mysql';
export const host = config.get('database_host');
export const port = config.get('database_port');
export const database = config.get('database_name');
export const username = config.get('database_user');
export const password = config.get('database_password');
export const logging = false;
const socketPath = config.get('database_socket');
export const dialectOptions = socketPath && { socketPath };

export const mysqlConfig: Sequelize.Options = {
  dialect,
  logging,
  host,
  port,
  define: {
    charset: 'utf8',
    collate: 'utf8_general_ci',
  },
  dialectOptions,
};
