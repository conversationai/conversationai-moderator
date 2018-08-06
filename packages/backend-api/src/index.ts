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
import * as expressWs from 'express-ws';
import * as passport from 'passport';

import { googleStrategy, jwtStrategy } from '@conversationai/moderator-backend-core';
import { config } from '@conversationai/moderator-config';

import { createAssistantRouter } from './api/assistant';
import { createPublisherRouter } from './api/publisher';
import { createRESTRouter } from './api/rest';
import { createServicesRouter } from './api/services';
import { createAuthRouter } from './auth/router';
import { createYouTubeRouter } from './auth/youtube';

export function mountAPI(testMode?: boolean): express.Express {
  const app = express();
  expressWs(app);

  app.use((req, _res, next) => {
    (req as any).testMode = testMode;
    next();
  });

  // Initialize auth strategies and Passport
  if (!testMode) {
    passport.use(jwtStrategy);
    passport.use(googleStrategy);

    app.use(passport.initialize());
  }

  // Fully-qualify the links field of responses.
  app.use((_req, _res, next) => {
    let apiPrefix = config.get('api_url');

    if (config.get('httpsLinksOnly')) {
      apiPrefix = apiPrefix.replace('http://', 'https://');
    }

    app.set('json replacer', (key: string, value: any) => {
      if (key === 'links') {
        return Object.keys(value).reduce((sum, k) => {
          sum[k] = value[k] && value[k].replace(/^\//, apiPrefix + '/');

          return sum;
        }, {} as any);
      }

      return value;
    });

    next();
  });

  // Auth routes
  app.use('/', createAuthRouter());

  if (config.get('flavor') === 'youtube') {
    // Connect YouTube Account entrypoints
    // Only the connect entrypoint should be authenticated.
    app.get('/youtube/connect', passport.authenticate('jwt', {session: false}));
    app.use('/youtube', createYouTubeRouter());
  }

  app.use('/', (() => {
    const router = express.Router({
      caseSensitive: true,
      mergeParams: true,
    });

    if (!testMode) {
      // Require tokens for our CRUD endpoints.
      // Not necessary for `options` requests.
      ['get', 'post', 'patch', 'delete'].forEach((method) => {
        (router as any)[method]('*', passport.authenticate('jwt', { session: false }));
      });
    }

    // The REST API provides standard CRUD operations on our database models using
    // the JSONAPI scheme format.
    router.use('/rest', createRESTRouter());

    // The services API provides custom endpoints for our clients which would
    // normally be awkward REST queries or are unrelated to database models.
    router.use('/services', createServicesRouter());

    // The services API provides custom endpoints for publishers to add new database
    // to the system. These are separated from REST because their API will be
    // optimised for specific publishers' data models.
    router.use('/publisher', createPublisherRouter());

    // The assistant API provides callbacks for assistant users to send per-comment
    // scores into OSMOD. These are often, but not always, the result of a scoring
    // request when a new comment is added by the publisher.
    router.use('/assistant', createAssistantRouter());

    return router;
  })());

  return app;
}

export { createArticleIfNonExistant } from './api/publisher/articles';
