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
  Article,
  Comment,
  logger,
  sendToScorer,
  User,
} from '@conversationai/moderator-backend-core';
import * as Bluebird from 'bluebird';
import * as yargs from 'yargs';

export const command = 'comments:send-to-scorer';
export const describe = 'Send comments to Endpoint of user object to get scored.';

export function builder(yargs: yargs.Argv) {
  return yargs
      .usage('Usage:\n\n' +
        'Send comment for scoring by id:\n' +
        'node $0 comments:send-to-scorer --comment-id=4\n\n' +
        'Send comment for scoring with user id:\n' +
        'node $0 comments:send-to-scorer --user-id=1' +
        'Complete command requires both comment id and user id.\n' +
        'node $0 comments:send-to-scorer --comment-id=4 --user-id=1')
        .string('comment-id')
        .describe('comment-id', 'comment id. To run all, use \'all\'.')
        .number('user-id')
        .describe('user-id', 'user id (must be service user)')
        .check((argv) => {
          if (!argv.commentId && !argv.userId) {
            throw new Error('You must enter a comment id and user id to have scored.');
          }

          return true;
        });
}

export async function handler(argv: any) {
  const conditions = {
    include: [Article],
  } as any;

  if (argv.commentId !== 'all') {
    conditions['where'] = {
      id: argv.commentId,
    };
  }

  try {
    const user = await User.findById(argv.userId);
    if (!user) {
      logger.error(`No such user: ${argv.userId}`);
      return;
    }

    const comments = await Comment.findAll(conditions);

    await Bluebird.mapSeries(comments, (c) => {
      logger.info('Comment id ', c.id);
      sendToScorer(c, user, true);
    });

    logger.info('Processing Completed.');
    process.exit(0);
  } catch (err) {
    logger.info('failure', err);
    process.exit(1);
  }
}
