/*
Copyright 2017 Google Inc.

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

import * as express from 'express';
import {google} from 'googleapis';

import { config } from '@conversationai/moderator-config';

import { saveYouTubeUserToken } from './users';
import { generateServerCSRF, getClientCSRF } from './utils';

let apiPrefix = config.get('api_url');

if (config.get('httpsLinksOnly')) {
  apiPrefix = apiPrefix.replace('http://', 'https://');
}

export function createYouTubeRouter(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.get(
    '/connect',
    async (req, res, next) => {
      const serverCSRF = await generateServerCSRF(req, res, next);

      if (res.headersSent) {
        return;
      }

      const oauth2Client = new google.auth.OAuth2(config.get('google_client_id'), config.get('google_client_secret'), `${apiPrefix}/youtube/callback`);
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope:  ['profile', 'email', 'https://www.googleapis.com/auth/youtube.force-ssl'],
        state: serverCSRF,
        prompt: 'consent',
      });
      res.redirect(authUrl);
      next();
    },
  );

  router.get(
    '/callback',
    async (req, res) => {
      const {clientCSRF, errorMessage} = await getClientCSRF(req);

      const params: any = {
        csrf: clientCSRF,
      };

      if (req.query.error) {
        params['errorMessage'] = `Login rejected: ${req.query.error}`;
      }
      else if (errorMessage) {
        params['errorMessage'] = errorMessage;
      }

      const oauth2Client = new google.auth.OAuth2(config.get('google_client_id'), config.get('google_client_secret'), `${apiPrefix}/youtube/callback`, );
      const tokenRsp = await oauth2Client.getToken(req.query.code);
      const token = tokenRsp.tokens;
      oauth2Client.setCredentials(token);
      const service = google.oauth2('v2');
      const uiRsp = await service.userinfo.get({auth: oauth2Client});
      saveYouTubeUserToken({name: uiRsp.data.name || 'Youtube user', email: uiRsp.data.email || 'youtube@user'}, token);

      const frontend_url = config.get('frontend_url');
      res.redirect(`${frontend_url}/settings`);
    });

  return router;
}
