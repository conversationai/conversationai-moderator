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

import { Comment, sequelize } from '../index';

const TEST_ENVS = ['test', 'circle_ci'];

function isTestEnv() {
  return TEST_ENVS.indexOf(process.env.NODE_ENV || '') > -1;
}

function cleanDatabase(done: any) {
  if (!isTestEnv()) {
    throw new Error('Refusing to destroy database if NODE_ENV is not `test`.');
  }

  sequelize.query('SET GLOBAL FOREIGN_KEY_CHECKS = 0', { raw: true })
      .then(() => sequelize.sync({ force: true }))
      .then(() => Comment.addFullTextIndex())
      .then(() => sequelize.query('SET GLOBAL FOREIGN_KEY_CHECKS = 1', { raw: true }))
      .then(() => done(), (e) => done(e));
}

before('Clean database before', cleanDatabase);
