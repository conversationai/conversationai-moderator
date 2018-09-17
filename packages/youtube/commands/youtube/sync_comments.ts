/*
Copyright 2018 Google Inc.

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

import {google} from 'googleapis';
import * as yargs from 'yargs';

import {logger} from '@conversationai/moderator-backend-core';

import {authorize} from './authenticate';
import {foreachActiveChannel, mapCommentThreadToComments} from './objectmap';

export const command = 'youtube:comments:sync';
export const describe = 'Sync youtube comment threads with OSMod comments.';

export function builder(args: yargs.Argv) {
  return args.usage('Usage:\n\n' +
      'Sync youtube comment threads:\n' +
      'node $0 youtube:comments:sync');
}

export async function handler() {
  const service = google.youtube('v3');

  authorize(async (owner, auth) => {
    foreachActiveChannel(owner, async (channelId: string, articleIdMap: Map<string, number>) => {
      return new Promise<void>((resolve, reject) => {
        service.commentThreads.list({
          auth: auth,
          allThreadsRelatedToChannelId: channelId,
          part: 'snippet,replies',
          textFormat: 'plainText',
          // TODO: need to also set maxResults and pageToken to only get new comments.
          // TODO: Set moderationStatus: heldForReview to only get unmoderated comments?
          //
        }, (err: any, response: any) => {
          if (err) {
            logger.error('Google API returned an error: ' + err);
            reject('Google API error');
            return;
          }

          if (response!.data.items.length === 0) {
            logger.info('Couldn\'t find any threads for channel %s.', channelId);
            resolve();
            return;
          }
          (async () => {
            for (const t of response!.data.items) {
              await mapCommentThreadToComments(owner, channelId, articleIdMap, t);
            }
          })().then(() => resolve());
        });
      });
    });
  });
}
