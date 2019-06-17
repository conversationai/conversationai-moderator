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

import { config } from '@conversationai/moderator-config';

import { logger } from '../../logger';
import { IUserInstance, User, USER_GROUP_YOUTUBE } from '../../models';

export const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];

export async function for_one_youtube_user(
  user: IUserInstance,
  callback: (owner: IUserInstance, client: OAuth2Client) => Promise<void>,
) {
  const oauth2Client = new google.auth.OAuth2(config.get('google_client_id'), config.get('google_client_secret'));
  logger.info(`Youtube: Authenticating as: ${user.id}:${user.get('email')} (${user.get('name')})`);
  const extra = JSON.parse(user.get('extra'));
  oauth2Client.setCredentials(extra.token);
  await callback(user, oauth2Client);
}

export async function for_all_youtube_users(
  callback: (owner: IUserInstance, client: OAuth2Client) => Promise<void>,
) {
  const users = await User.findAll({where: {group: USER_GROUP_YOUTUBE, isActive: true}});
  for (const user of users) {
    await for_one_youtube_user(user, callback);
  }
}
