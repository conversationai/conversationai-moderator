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

import { kickWorker } from '../worker';
import { createHeartbeatCron } from './heartbeat';
import { createKnownTasksRouter } from './known_tasks';

/*
    The Task API exposes HTTP endpoints for starting asynchronous
    tasks.
*/
export function mountTaskAPI(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.use('/:taskName', createKnownTasksRouter());

  return router;
}

/*
    The Cron API exposes HTTP endpoints for starting cron-like tasks.
*/
export function mountCronAPI(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.use('/heartbeat', createHeartbeatCron());

  return router;
}

export function processingTriggers(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.get('/trigger/:category', async (_req, res, next) => {
    await kickWorker(true);
    res.json({ status: 'ok' });
    next();
  });

  return router;
}

export * from './heartbeat';
export * from './known_tasks';
export * from './permissions';
