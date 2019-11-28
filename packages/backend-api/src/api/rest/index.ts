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

import { createModelRouter } from '../jsonapi';
import { onlyAdminAndServices } from '../util/permissions';
import * as SequelizeHandler from '../util/SequelizeHandler';

export function createRESTRouter(): express.Router {
  const endpoints = [
    'articles',
    'categories',
    'comments',
    'comment_scores',
    'comment_summary_scores',
    'comment_scorers',
    'decisions',
    'moderation_rules',
    'preselects',
    'tags',
    'tagging_sensitivities',
    'users',
  ];

  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  // Only Admin or bots can to writable actions.
  ['post', 'patch', 'delete'].forEach((method) => {
    (router as any)[method]('*', onlyAdminAndServices);
  });

  endpoints.forEach((key) => {
    router.use(
      `/${key}`,
      createModelRouter(
        key,
        SequelizeHandler as any,
        '/rest',
      ),
    );
  });

  return router;
}
