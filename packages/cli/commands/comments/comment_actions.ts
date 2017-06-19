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

import { createToken, logger, User } from '@conversationai/moderator-backend-core';
import * as Bluebird from 'bluebird';
import * as requestRaw from 'request';
import * as yargs from 'yargs';
const request = Bluebird.promisify(requestRaw) as any;
Bluebird.promisifyAll(request);

export const command = 'comments:actions';
export const describe = 'Send comments to be approved or rejected at endpoint.';

export function builder(yargs: yargs.Argv) {
  return yargs
      .usage('Usage:\n\n' +
        'Send comment for action by id, or by comma seperated values:\n' +
        'node $0 comments:actions --comment-id=943,950,956\n\n' +
        'Send comment for action with status (accepted or, rejected):\n' +
        'node $0 comments:actions --status=rejected' +
        'Send comment for action with user id:\n' +
        'node $0 send-to-scorer --user-id=1' +
        'Send comment for action with tag id:\n' +
        'node $0 send-to-scorer --tag-id=1' +
        'Complete command requires comment id, user id, and status. If running a tag action, provide tag-id. \n' +
        'node $0 comments:actions --comment-id=943 --status=rejected --user-id=1')
        .string('comment-id')
        .describe('comment-id', 'comment id')
        .string('tag-id')
        .describe('tag-id', 'tag id')
        .string('status')
        .describe('status', 'status must be \'accepted\' or \'rejected\'')
        .check((argv) => {
          if (!argv.commentId && !argv.status && !argv.userId) {
            throw new Error('You must enter a comment id, user id, and status to run this action.');
          }

          return true;
        });
}

export async function handler(argv: any) {
  logger.info('comments:actions');

  const user = await User.findById(argv.userId);

  if (user) {
    const token = createToken(user.get('id'));
    let data = argv.commentId;
    let postData = {
      data : [argv.commentId],
    };

    // Accept comma delimeted comment ids
    if (data.indexOf(',') > 0) {
      postData = {
        data : data = data.split(','),
      };
    }

    // Determine which endpoint. Terminology may be varied.
    let ep = '';
    switch (argv.status) {
      case 'rejected' :
        ep = 'reject';
        break;
      case 'accepted' :
        ep = 'approve';
        break;
      default :
      // defer, highlight
        ep = argv.status;
    }

    // Placeholder for tag
    let tagId = '';
    if (argv.tagId) {
      tagId = argv.tagId;
    }

    logger.info(`http://localhost:8080/services/commentActions/${ ep }/${ tagId }`);

    try {
      const [response, body] = await request.postAsync({
        url: `http://localhost:8080/services/commentActions/${ ep }/${ tagId }`,
        json: true,
        body: postData,
        headers: {
          Authorization: 'JWT ' + token,
        },
      });

      logger.info( 'Endpoint Response :: ', response.statusCode, body ? body : '' );
    } catch (err) {
      logger.error('Error', err);
    }
  }
}
