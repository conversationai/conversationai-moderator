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

import {
  ENDPOINT_TYPE_API,
  ENDPOINT_TYPE_PROXY,
  logger,
  SERVICE_TYPE_MODERATOR,
  User,
  USER_GROUP_SERVICE,
  USER_GROUPS,
} from '@conversationai/moderator-backend-core';
import * as yargs from 'yargs';

export const command = 'users:create';

export const describe = 'Create new OS Moderator users';

export function builder(yargs: yargs.Argv) {
  return yargs
    .usage('Usage: node $0 create --group general --name "User Name" \\\n' +
           '                                  --email name@example.com\n' +
           '       node $0 create --group service --name "Service Name"\n' +
           '       node $0 create --group service --name "Service Name" \\\n' +
           '                                  --moderator-type <type> [ --endpoint <url> ]\n')
    .demand('group')
    .choices('group', USER_GROUPS)
    .describe('group', 'The user type/group')
    .demand('name')
    .describe('name', 'The user\'s name')
    .string('email')
    .describe('email', 'Email address required for all users not in the "service" group')
    .string('moderator-type')
    .describe('moderator-type', `If this is a moderator service user, the endpoint type: one of ${ENDPOINT_TYPE_API} or ${ENDPOINT_TYPE_PROXY}.`)
    .string('endpoint')
    .describe('endpoint', 'If this is a moderator service user, Endpoint URL for moderator users to post comments to for scoring.');
}

export async function handler(argv: any) {
  // Make user active
  const data: any = {
    group: argv.group,
    name: argv.name,
    email: argv.email,
    isActive: true,
  };

  if (data.group === USER_GROUP_SERVICE) {
    const extra: any = {};
    if (argv.moderatorType) {
      extra.serviceType = SERVICE_TYPE_MODERATOR;
      extra.endpointType = argv.moderatorType;
      if (extra.endpointType !== ENDPOINT_TYPE_API && extra.endpointType !== ENDPOINT_TYPE_PROXY) {
        console.log(`User creation error: unknown moderator-type: ${extra.endpointType}\n`);
        yargs.showHelp();
        return;
      }
      if (argv.endpoint) {
        extra.endpoint = argv.endpoint;
      }
      else {
        extra.endpoint = (extra.endpointType === ENDPOINT_TYPE_API) ?
          'https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1' :
          'https://osmod-assistant.appspot.com/api/score-comment';

        logger.info(`API endpoint: Defaulting URL to ${extra.endpoint}`);
      }
      data.extra = extra;
    }
  }
  else {
    if (argv.moderatorType) {
      console.log('User creation error: Non-service users can\'t have a moderator-type.\n');
      yargs.showHelp();
      return;
    }
    if (!argv.email) {
      console.log('User creation error: Non-service users require an email.\n');
      yargs.showHelp();
      return;
    }
  }

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
