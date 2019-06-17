/*
Copyright 2019 Google Inc.

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

import { logger } from '../../logger';
import { IUserInstance } from '../../models';
import { mapChannelToCategory, saveError, setChannelActive } from './objectmap';

const service = google.youtube('v3');

async function sync_page_of_channels(owner: IUserInstance, auth: OAuth2Client, pageToken?: string) {
  return new Promise<string | undefined>((resolve, reject) => {
    service.channels.list({
      auth: auth,
      part: 'snippet,brandingSettings',
      mine: true,
      maxResults: 50,
      pageToken: pageToken,
    }, async (err, response) => {
      if (err) {
        await saveError(owner, err);
        logger.error('Google API returned an error: ' + err);
        reject('Google API error');
        return;
      }

      const channels = response!.data.items!;
      const nextPageToken = response!.data.nextPageToken;

      if (channels.length === 0) {
        logger.info('No channels found.');
        resolve(undefined);
        return;
      }

      for (const channel of channels) {
        await mapChannelToCategory(owner, channel);
      }
      resolve(nextPageToken);
    });
  });
}

export async function sync_channels(
  owner: IUserInstance,
  auth: OAuth2Client,
) {
  logger.info('Syncing channels for user %s.', owner.get('email'));
  let next_page;
  do {
    next_page = await sync_page_of_channels(owner, auth, next_page);
  } while (next_page);
}

export async function activate_channel(
  owner: IUserInstance,
  auth: OAuth2Client,
  channelId: string,
  activate: boolean,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    service.channels.list({
      auth: auth,
      id: channelId,
      part: 'brandingSettings',
    }, async (err: any, response: any) => {
      if (err) {
        await saveError(owner, err);
        logger.error('Google API returned an error: ' + err);
        reject('Google API error');
        return;
      }

      if (response!.data.items.length === 0) {
        logger.warn('Couldn\'t find channel %s.', channelId);
        reject('Couldn\'t find corresponding youtube channel.');
        return;
      }

      const data = response.data.items[0].brandingSettings;
      data.channel.moderateComments = activate;

      service.channels.update({
        auth: auth,
        part: 'brandingSettings',
        requestBody: {
          id: channelId,
          brandingSettings: data,
        },
      }, async (err2: any, response2: any) => {
        if (err2) {
          await saveError(owner, err);
          logger.error('Google API returned an error: ' + err);
          reject('Google API error');
          return;
        }
        await setChannelActive(owner, channelId, response2.data.brandingSettings);
        resolve();
      });
    });
  });
}

export async function get_playlist_for_channel(owner: IUserInstance, auth: OAuth2Client, channelId: string) {
  return new Promise<string>((resolve, reject) => {
    service.channels.list({
      auth: auth,
      id: channelId,
      part: 'contentDetails',
    }, async (err: any, response: any) => {
      if (err) {
        await saveError(owner, err);
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
