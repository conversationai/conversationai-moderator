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

import {OAuth2Client} from 'google-auth-library';
import {createInterface} from 'readline';
import * as yargs from 'yargs';

import {readCredentials, saveToken, SCOPES} from './authenticate';

export const command = 'youtube:refreshToken';
export const describe = 'Refresh the authentication token.';

export function builder(yargs: yargs.Argv) {
  return yargs
    .usage('Usage:\n\n' +
      'Refresh the YouTube client authentication token:\n' +
      'node $0 youtube:refreshToken');
}

export async function handler() {
  readCredentials((oauth2Client: OAuth2Client) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    console.log('Authorize this app by visiting this url: ', authUrl);
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oauth2Client.getToken(code, (err, token) => {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        saveToken(token);
      });
    });
  });
}
