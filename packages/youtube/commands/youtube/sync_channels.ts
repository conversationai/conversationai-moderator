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
import {mapChannelToCategory} from './objectmap';

export const command = 'youtube:channels:sync';
export const describe = 'Sync youtube channels with OSMod categories.';

export function builder(yargs: yargs.Argv) {
  return yargs
    .usage('Usage:\n\n' +
      'Sync channels with YouTube:\n' +
      'node $0 youtube:channels:sync');
}

export async function handler() {
  const service = google.youtube('v3');

  authorize(async (owner, auth) => {
    service.channels.list({
      auth: auth,
      part: 'snippet',
      mine: true,
    }, (err, response) => {
      if (err) {
        logger.error('The API returned an error: ' + err);
        return;
      }
      const channels = response!.data.items!;
      if (channels.length === 0) {
        logger.warn('No channels found.');
        return;
      }

      for (const c of channels) {
        mapChannelToCategory(owner, c);
      }
    });
  });
}
