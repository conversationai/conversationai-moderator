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

import { logger, User, USER_GROUPS } from '@conversationai/moderator-backend-core';
import * as yargs from 'yargs';

export const command = 'users:create';

export const describe = 'Create new OS Moderator users';

export function builder(yargs: yargs.Argv) {
  return yargs
    .usage('Usage: node $0 create --group general --name "User Name" --email name@example.com')
    .demand('group')
    .choices('group', USER_GROUPS)
    .demand('name')
    .string('email')
    .describe('email', 'Email address required for all users not in the "service" group')
    .string('endpoint')
    .describe('endpoint', 'Endpoint URL for service users to post comments to for scoring');
}

export async function handler(argv: any) {
  // Make user active
  const data = {
    ...argv,
    isActive: true,
  };

  try {
    const user = await User.create(data);

    logger.info('User successfully created');
    logger.info(user.toJSON());
    process.exit(0);
  } catch (err) {
    logger.error('User creation error: ', err.name, err.message);
    logger.error(err.errors);
    process.exit(1);
  }
}
