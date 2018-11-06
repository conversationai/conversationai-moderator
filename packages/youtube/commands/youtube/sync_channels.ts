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
import * as yargs from 'yargs';

import {IUserInstance, logger} from '@conversationai/moderator-backend-core';

import { authorize } from './authenticate';
import { mapChannelToCategory } from './objectmap';

export const command = 'youtube:channels:sync';
export const describe = 'Sync youtube channels with OSMod categories.';

export function builder(yargs: yargs.Argv) {
  return yargs
    .usage('Usage:\n\n' +
      'Sync channels with YouTube:\n' +
      'node $0 youtube:channels:sync');
}

const service = google.youtube('v3');

async function sync_page_of_channels(owner: IUserInstance, auth: OAuth2Client, pageToken?: string) {
  return new Promise<string | undefined>((resolve, reject) => {
    service.channels.list({
      auth: auth,
      part: 'snippet',
      mine: true,
      maxResults: 50,
      pageToken: pageToken,
    }, (err, response) => {
      if (err) {
        logger.error('The API returned an error: ' + err);
        reject('Google API error');
        return;
      }

      const channels = response!.data.items!;
      const nextPageToken = response!.data.nextPageToken;

      if (channels.length === 0) {
        logger.warn('No channels found.');
        resolve(undefined);
        return;
      }

      (async () => {
        for (const c of channels) {
          await mapChannelToCategory(owner, c);
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
    logger.info('Syncing channels for user %s.', owner.get('email'));

    let next_page;
    do {
      next_page = await sync_page_of_channels(owner, auth, next_page);
    } while (next_page);

    logger.info('Done sync of channels for user %s.', owner.get('email'));
  });
}
