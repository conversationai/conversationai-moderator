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

import { logger } from '../logger';
import { setTestMode } from '../notification_router';
import { quit } from '../redis';
import { sequelize } from '../sequelize';

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

export async function cleanDatabase() {
  if (!isTestEnv()) {
    throw new Error('Refusing to destroy database if NODE_ENV is not `test`.');
  }

  await sequelize.sync({ force: true });
  setTestMode();
}

export async function dropDatabase() {
  if (!isTestEnv()) {
    throw new Error('Refusing to destroy database if NODE_ENV is not `test`.');
  }
  await sequelize.drop();
  await sequelize.close();
  await quit();
}

before('Clean database before', cleanDatabase);
after(dropDatabase);
