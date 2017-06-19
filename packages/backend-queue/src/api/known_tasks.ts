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

import { logger } from '@conversationai/moderator-backend-core';
import * as express from 'express';
import * as Joi from 'joi';
import { knownTasks } from '../util';

const schema = Joi.object({
  data: Joi.alternatives().try(
    Joi.array(),
    Joi.object(),
  ).required(),
});

/**
 * Task router for starting worker tasks.
 */
export function createKnownTasksRouter(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.post(
    '/',
    async ({ body, params: { taskName }}, res, next) => {
      try {
        const status = Joi.validate(body, schema, { convert: false });

        if (status.error) {
          res.status(422).json({ status: 'error', errors: status.error.details });

          return;
        }

        // Send comments for rescoring.
        if (knownTasks[taskName] === undefined) {
          logger.error(`unknown task name: ${taskName}`);
          res.status(400).json({ status: 'error', error: `unknown task name: ${taskName}`});

          return;
        }

        const task = knownTasks[taskName];
        await task(body.data, logger, true);

        logger.info(`OSMod Task ${task} complete!`);
        res.status(200).json({ status: 'success'});
      } catch (err) {
        logger.error('Task error: ', err.name, err.message);
        next(err);
      }
    },
  );

  return router;
}
