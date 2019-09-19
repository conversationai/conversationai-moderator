/*
Copyright 2019 Google Inc.

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

import * as winston from 'winston';

import {
  sequelize,
} from '@conversationai/moderator-backend-core';

import { logger } from '../logger';

const TEST_ENVS = ['test', 'circle_ci'];

function isTestEnv() {
  return TEST_ENVS.indexOf(process.env.NODE_ENV || '') > -1;
}

logger.configure({
  level: 'error',
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

function cleanDatabase(done: any) {
  if (!isTestEnv()) {
    throw new Error('Refusing to destroy database if NODE_ENV is not `test`.');
  }

  sequelize.sync({ force: true }).then(() => done(), (e) => done(e));
}

function dropDatabase(done: any) {
  if (!isTestEnv()) {
    throw new Error('Refusing to destroy database if NODE_ENV is not `test`.');
  }
  sequelize.drop().then(done(), (e) => done(e));
}

before('Clean database before', cleanDatabase);
after(dropDatabase);
