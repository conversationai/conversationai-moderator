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

import { getOAuthConfiguration } from '../../auth/config';
import { logger } from '../../logger';
import { IIntegrationExtra, User, USER_GROUP_YOUTUBE } from '../../models';

export const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];

export async function for_one_youtube_user(
  user: User,
  callback: (owner: User, client: OAuth2Client) => Promise<void>,
) {
  const oauthConfig = await getOAuthConfiguration();
  if (!oauthConfig) {
    return;
  }

  const oauth2Client = new google.auth.OAuth2(oauthConfig.id, oauthConfig.secret);
  logger.info(`Youtube: Authenticating as: ${user.id}:${user.email} (${user.name})`);
  const extra = user.extra as IIntegrationExtra;
  oauth2Client.setCredentials(extra.token);
  await callback(user, oauth2Client);
}

export async function for_all_youtube_users(
  callback: (owner: User, client: OAuth2Client) => Promise<void>,
) {
  const users = await User.findAll({where: {group: USER_GROUP_YOUTUBE, isActive: true}});
  for (const user of users) {
    await for_one_youtube_user(user, callback);
  }
}
