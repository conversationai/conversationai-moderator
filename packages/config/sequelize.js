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

const config = require('./index').config;

/**
 * This config file is used by sequelize-cli and this and index.js
 * are JS and not Typescript because sequelize-cli does not support
 * it
 * @type {object}
 */
let mysqlConfig = {
  dialect: 'mysql',
  logging: false,
  database: config.get('database_name'),
  username: config.get('database_user'),
  password: config.get('database_password'),
  // TODO: Convince CLI to use correct character set
};

if (config.get('database_socket') !== 'nevermind') {
  Object.assign(mysqlConfig, {
    dialectOptions: {
      socketPath: config.get('database_socket'),
    },
  });
} else {
  Object.assign(mysqlConfig, {
    host: config.get('database_host'),
    port: config.get('database_port'),
  });
}

module.exports = mysqlConfig;
