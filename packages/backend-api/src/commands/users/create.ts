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

import { logger } from '../../logger';
import {
  ENDPOINT_TYPE_API,
  ENDPOINT_TYPE_PROXY,
  User,
  USER_GROUP_ADMIN,
  USER_GROUP_GENERAL,
  USER_GROUP_MODERATOR,
  USER_GROUP_SERVICE,
  USER_GROUPS,
} from '../../models';

export const command = 'users:create';

export const describe = 'Create new OS Moderator users';

export function builder(args: yargs.Argv) {
  return args
    .usage('Usage: node $0 create --group general --name "User Name" \\\n' +
           '                                  --email name@example.com\n' +
           '       node $0 create --group service --name "Service Name"\n' +
           '       node $0 create --group moderator --name "Service Name" \\\n' +
           '                                  --moderator-type <type> --api-key <key> \\\n' +
           '                                  [--endpoint <url>] [--user-agent <agent>] [--attributes <attributes>]\n')
    .demand('group')
    .choices('group', USER_GROUPS)
    .describe('group', `The user type/group: one of '${USER_GROUP_ADMIN}', '${USER_GROUP_GENERAL}', '${USER_GROUP_MODERATOR}' or '${USER_GROUP_SERVICE}'`)
    .demand('name')
    .describe('name', 'The user\'s name')
    .string('email')
    .describe('email', `The user's email address.  Mandatory for all '${USER_GROUP_ADMIN}' and '${USER_GROUP_GENERAL}' users.`)
    .string('moderator-type')
    .describe('moderator-type', `Specify the moderator type: one of '${ENDPOINT_TYPE_API}' or '${ENDPOINT_TYPE_PROXY}'.`)
    .string('api-key')
    .describe('api-key', `For moderator users: the API key used to access the moderation service.`)
    .string('endpoint')
    .describe('endpoint', 'For moderator users: Endpoint URL for moderator users to post comments for scoring.')
    .string('user-agent')
    .describe('user-agent', 'For ${ENDPOINT_TYPE_API} moderator service users: User agent to use.  Defaults sensibly if not set.')
    .string('attributes')
    .describe('attributes', 'For ${ENDPOINT_TYPE_API} moderator service users: Comma-separated list of attributes to score on.  Defaluts sensibly if not set.');
}

export async function handler(argv: any) {
  // Make user active
  const data: any = {
    group: argv.group,
    name: argv.name,
    email: argv.email,
    isActive: true,
  };

  if (data.group === USER_GROUP_MODERATOR) {
    const extra: any = {};
    extra.endpointType = argv.moderatorType;

    if (extra.endpointType !== ENDPOINT_TYPE_API && extra.endpointType !== ENDPOINT_TYPE_PROXY) {
      console.log(`User creation error: unknown moderator-type: ${extra.endpointType}\n`);
      yargs.showHelp();
      return;
    }

    extra.apiKey = argv.apiKey;
    if (!extra.apiKey) {
      console.log(`User creation error: moderators require an API key.\n`);
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

    if (extra.endpointType === ENDPOINT_TYPE_API) {
      extra.userAgent = argv.userAgent || 'OsmodAssistantV0';
      if (argv.attributes) {
        extra.attributes = {};
        for (const i of argv.attributes.split(',')) {
          extra.attributes[i] = {};
        }
      }
      else {
        extra.attributes = {
          ATTACK_ON_AUTHOR: {},
          ATTACK_ON_COMMENTER: {},
          INCOHERENT: {},
          INFLAMMATORY: {},
          OBSCENE: {},
          OFF_TOPIC: {},
          SPAM: {} ,
          UNSUBSTANTIAL: {},
          LIKELY_TO_REJECT: {},
          TOXICITY: {},
        };
      }
    }

    data.extra = extra;
  }
  else {
    if (argv.moderatorType) {
      console.log('User creation error: Non-moderator users can\'t have a moderator type.\n');
      yargs.showHelp();
      return;
    }
    if (argv.apiKey) {
      console.log('User creation error: Non-moderator users don\'t need an API key.\n');
      yargs.showHelp();
      return;
    }
    if (argv.endpoint) {
      console.log('User creation error: Non-moderator users don\'t need an endpoint.\n');
      yargs.showHelp();
      return;
    }
  }

  if ((argv.group === USER_GROUP_ADMIN || argv.group === USER_GROUP_GENERAL) && !argv.email) {
    console.log('User creation error: Human users require an email.\n');
    yargs.showHelp();
    return;
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
