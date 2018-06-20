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

import {readFile, writeFile} from 'fs';
import {OAuth2Client} from 'google-auth-library';
import {google} from 'googleapis';

const OAuth2 = google.auth.OAuth2;

export const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];

// TODO: Store stuff in the database
const CLIENT_SECRET_FILE = 'client_secret.json';
const TOKEN_FILE = 'token.json';

export function readCredentials(callback: (client: OAuth2Client) => void) {
  readFile(CLIENT_SECRET_FILE, (err, content) => {
    if (err) {
      console.log('Error loading client secret file: ' + err);
      return;
    }
    const credentials = JSON.parse(content.toString());
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];

    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

    callback(oauth2Client);
  });
}

export function saveToken(token: any) {
  writeFile(TOKEN_FILE, JSON.stringify(token), (err) => {
    if (err) {
      throw err;
    }
  });
  console.log('Token stored to ' + TOKEN_FILE);
}

export function authorize(callback: (client: OAuth2Client) => void) {
  readCredentials((oauth2Client: OAuth2Client) => {
    readFile('token.json', (err, token) => {
      if (err) {
        console.log('Error loading token file: ' + err);
        return;
      }
      oauth2Client.credentials = JSON.parse(token.toString());
      callback(oauth2Client);
    });
  });
}
