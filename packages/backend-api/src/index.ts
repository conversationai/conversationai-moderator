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

import * as express from 'express';
import * as expressWs from 'express-ws';
// TODO: Passport seems to be a dead project.  Keep an eye on what is happening
//     And consider replacing it with passport-next or something else.
import * as passport from 'passport';

import { config } from '@conversationai/moderator-config';

import { createApiRouter } from './api/router';
import { getOAuthConfiguration } from './auth/config';
import { getGoogleStrategy, getJwtStrategy } from './auth/providers';
import {
  createAuthConfigRouter,
  createAuthRouter,
  createHealthcheckRouter,
} from './auth/router';
import { createYouTubeRouter } from './auth/youtube';

export async function mountAPI(testMode?: boolean): Promise<express.Express> {
  const app = express();
  expressWs(app);

  app.use((req, _res, next) => {
    (req as any).testMode = testMode;
    next();
  });

  // Initialize auth strategies and Passport
  // (Authenticator doesn't have a well-defined type...)
  let jwtAuthenticator: any;
  const oauthConfig = await getOAuthConfiguration();
  const oauthOk = oauthConfig != null && !oauthConfig.knownBad;

  if (!testMode) {
    passport.use(await getJwtStrategy());
    if (oauthConfig) {
      passport.use(getGoogleStrategy(oauthConfig));
    }
    app.use(passport.initialize());
    jwtAuthenticator = passport.authenticate('jwt', { session: false });
  }

  // Fully-qualify the links field of responses.
  app.use((_req, _res, next) => {
    app.set('json replacer', (key: string, value: any) => {
      if (key === 'links') {
        return Object.keys(value).reduce((sum, k) => {
          sum[k] = value[k] && value[k].replace(/^\//, config.get('api_url') + '/');

          return sum;
        }, {} as any);
      }

      return value;
    });

    next();
  });

  app.use('/', createHealthcheckRouter(oauthConfig));

  if (!testMode && !oauthOk) {
    console.log('*** Starting in bootstrap mode ***');
    app.use('/', createAuthConfigRouter());
  }

  app.use('/', createAuthRouter());
  if (oauthOk) {
    app.use('/', createYouTubeRouter(oauthConfig!, jwtAuthenticator));
  }
  app.use('/', createApiRouter(jwtAuthenticator));

  return app;
}

export { createArticleIfNonExistant } from './api/publisher/articles';
