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

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import * as Yargs from 'yargs';

import {
  authorize,
  foreachActiveChannel,
  IUserInstance,
  logger,
  mapCommentThreadToComments,
} from '@conversationai/moderator-backend-core';

export const command = 'youtube:comments:sync';
export const describe = 'Sync youtube comment threads with OSMod comments.';

export function builder(args: Yargs.Argv) {
  return args.usage('Usage:\n\n' +
      'Sync youtube comment threads:\n' +
      'node $0 youtube:comments:sync');
}

const service = google.youtube('v3');

async function sync_page_of_comments(owner: IUserInstance,
                                     auth: OAuth2Client,
                                     channelId: string,
                                     articleIdMap: Map<string, number>,
                                     pageToken?: string) {
  return new Promise<string | undefined>((resolve, reject) => {
    service.commentThreads.list({
      auth: auth,
      allThreadsRelatedToChannelId: channelId,
      part: 'snippet,replies',
      textFormat: 'plainText',
      maxResults: 50,
      pageToken: pageToken,
      // TODO: Set moderationStatus: heldForReview to only get unmoderated comments?
    }, (err: any, response: any) => {
      if (err) {
        logger.error('Google API returned an error: ' + err);
        reject('Google API error');
        return;
      }

      const comments = response!.data.items;
      const nextPageToken = response!.data.nextPageToken;

      if (comments.length === 0) {
        logger.info('Couldn\'t find any threads for channel %s.', channelId);
        resolve(undefined);
        return;
      }

      (async () => {
        for (const t of comments) {
          await mapCommentThreadToComments(owner, channelId, articleIdMap, t);
        }
      })()
        .then(() => {
          resolve(nextPageToken);
        })
        .catch((reason) => reject(reason));
    });
  });
}

export async function handler() {
  authorize(async (owner, auth) => {
    await foreachActiveChannel(owner, async (channelId: string, articleIdMap: Map<string, number>) => {
      logger.info('Syncing comments for channel %s', channelId);

      let next_page;
      do {
        next_page = await sync_page_of_comments(owner, auth, channelId, articleIdMap, next_page);
      } while (next_page);

      logger.info('Done sync of comments for channel %s.', channelId);
    });
  });
}
