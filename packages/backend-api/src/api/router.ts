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

import { createAuthConfigRouter } from '../auth/router';
import { createAssistantRouter } from './assistant';
import { createServicesRouter } from './services';

export function createApiRouter(authenticator: any) {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  if (authenticator) {
    // Require tokens for our CRUD endpoints.
    // Not necessary for `options` requests.
    ['get', 'post', 'patch', 'delete'].forEach((method) => {
      (router as any)[method]('*', authenticator);
    });
  }

  router.use('/', createAuthConfigRouter());

  // The services API provides custom endpoints for our clients which would
  // normally be awkward REST queries or are unrelated to database models.
  router.use('/services', createServicesRouter());

  // The assistant API provides callbacks for assistant users to send per-comment
  // scores into OSMOD. These are often, but not always, the result of a scoring
  // request when a new comment is added by the publisher.
  router.use('/assistant', createAssistantRouter());

  return router;
}
