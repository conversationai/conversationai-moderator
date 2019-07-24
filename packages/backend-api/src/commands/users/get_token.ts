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

import * as yargs from 'yargs';

import { logger, User } from '@conversationai/moderator-backend-core';

import { createToken } from '../../auth/tokens';

export const command = 'users:get-token';

export const describe = 'Get a JWT token for a user specified by id or email';

export function builder(args: yargs.Argv) {
  return args
    .usage('Usage:\n\n' +
           'Create token for user by id:\n' +
           'node $0 get-token --id 4\n\n' +
           'Create token for user by email:\n' +
           'node $0 get-token --email name@example.com')
    .number('id')
    .describe('id', 'id user to create token for')
    .string('email')
    .describe('email', 'Email address of user to create token for')
    .check((argv) => {
      if (!argv.id && !argv.email) {
        throw new Error('You must enter a user id or email to generate a token for');
      }

      return true;
    });
}

export async function handler(argv: any) {
  if (!argv.email) {
    const token = await createToken(argv.id);
    logger.info('JWT token for id: %d:\n\n\t%s', argv.id, token);
    process.exit(0);
  }

  try {
    const user = await User.findOne({
      where: { email: argv.email },
    });

    if (!user) {
      logger.error('User not found');
      process.exit(1);
    }
    const token = await createToken(user.id, user.get('email'));
    logger.info('JWT token for "%s" (id: %d):\n\n\t%s', user.get('name'), user.id, user.get('email'), token);
    process.exit(0);
  } catch (err) {
    logger.error('Error creating token for user: ', err.name, err.message);
    logger.error(err.errors);
    process.exit(1);
  }
}
