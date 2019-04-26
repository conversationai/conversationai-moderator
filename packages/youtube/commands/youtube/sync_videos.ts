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

import {
  authorize,
  Category,
  ICategoryInstance,
  IUserInstance,
  logger,
  mapPlaylistItemToArticle,
} from '@conversationai/moderator-backend-core';

export const command = 'youtube:videos:sync';
export const describe = 'Sync youtube videos with OSMod articles for each active channel/category.';

export function builder(args: yargs.Argv) {
  return args
    .usage('Usage:\n\n' +
      'Sync videos with YouTube:\n' +
      'node $0 youtube:videos:sync');
}

const service = google.youtube('v3');

async function get_playlist_for_channel(auth: OAuth2Client, channelId: string) {
  return new Promise<string>((resolve, reject) => {
    service.channels.list({
      auth: auth,
      id: channelId,
      part: 'contentDetails',
    }, (err: any, response: any) => {
      if (err) {
        logger.error('Google API returned an error: ' + err);
        reject('Google API error');
        return;
      }
      if (response!.data.items.length === 0) {
        logger.warn('Couldn\'t find channel %s.', channelId);
        reject('Couldn\'t find corresponding youtube channel.');
        return;
      }
      resolve(response!.data.items[0].contentDetails.relatedPlaylists.uploads);
    });
  });
}

async function sync_page_of_videos(owner: IUserInstance,
                                   auth: OAuth2Client,
                                   category: ICategoryInstance,
                                   playlist: string,
                                   pageToken?: string) {
  return new Promise<string | undefined>((resolve, reject) => {
    service.playlistItems.list({
      auth: auth,
      playlistId: playlist,
      part: 'snippet',
      maxResults: 50,
      pageToken: pageToken,
    }, (err: any, response: any) => {
      if (err) {
        logger.error('Google API returned an error: ' + err);
        reject('Google API error');
        return;
      }

      const videos = response!.data.items;
      const nextPageToken = response!.data.nextPageToken;

      if (videos.length === 0) {
        logger.info('Couldn\'t find any videos in playlist %s.', playlist);
        resolve(undefined);
        return;
      }

      (async () => {
        for (const item of response.data.items) {
          await mapPlaylistItemToArticle(owner, category.id, item);
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
    logger.info('Syncing videos for user %s.', owner.get('email'));

    const categories = await Category.findAll({
      where: {
        ownerId: owner.id,
        sourceId: {ne: null},
        isActive: true,
      },
    });

    for (const category of categories) {
      const channelId = category.get('sourceId');

      const playlist = await get_playlist_for_channel(auth, channelId);
      logger.info('Syncing channel %s (%s/%s)', category.get('label'), channelId, playlist);

      let next_page;
      do {
        next_page = await sync_page_of_videos(owner, auth, category, playlist, next_page);
      } while (next_page);

      logger.info('Done sync of %s.', category.get('label'));
    }
  });
}
