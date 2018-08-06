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

import {Category, logger} from '@conversationai/moderator-backend-core';

import {authorize} from './authenticate';
import {mapPlaylistItemToArticle} from './objectmap';

export const command = 'youtube:videos:sync';
export const describe = 'Sync youtube videos with OSMod articles for each active channel/category.';

export function builder(yargs: yargs.Argv) {
  return yargs
    .usage('Usage:\n\n' +
      'Sync videos with YouTube:\n' +
      'node $0 youtube:videos:sync');
}

export async function handler() {
  const service = google.youtube('v3');

  authorize(async (auth) => {

    const categories = await Category.findAll({
      where: {
        sourceId: {ne: null},
        isActive: true,
      },
    });

    for (const category of categories) {
      const categoryId = category.get('id');
      const channelId = category.get('sourceId');

      service.channels.list({
        auth: auth,
        id: channelId,
        part: 'snippet,contentDetails',
      }, (err: any, response: any) => {
        if (err) {
          logger.error('Google API returned an error: ' + err);
          return;
        }
        if (response!.data.items.length === 0) {
          logger.warn('Couldn\'t find channel %s.', channelId);
          return;
        }

        const playlist = response!.data.items[0].contentDetails.relatedPlaylists.uploads;

        logger.info('Syncing channel %s (%s/%s)', category.get('label'), channelId, playlist);

        service.playlistItems.list({
          auth: auth,
          playlistId: playlist,
          part: 'snippet',
          // TODO: need to also set maxResults and pageToken to only get new videos.
        }, (err: any, response: any) => {
          if (err) {
            logger.error('Google API returned an error: ' + err);
            return;
          }

          if (response!.data.items.length === 0) {
            logger.info('Couldn\'t find any more videos in playlist %s.', playlist);
            return;
          }

          for (const item of response.data.items) {
            mapPlaylistItemToArticle(categoryId, item);
          }
        });
      });
    }
  });
}
