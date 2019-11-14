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

import { logger } from '../../logger';
import { CommentScoreRequest } from '../../models';
import { IScoreData } from '../../pipeline/shim';
import {
  enqueueProcessMachineScoreTask,
} from '../../processing';
import { REPLY_SUCCESS } from '../constants';
import { onlyServices } from '../util/permissions';
import { validateRequest } from '../util/validation';
import { scoreSchema } from './schema';

export function createAssistant(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  // Return for score information via Pipeline
  router.post('/scores/:id',
    validateRequest(scoreSchema),
    async (req, res, next) => {
      const { runImmediately, scores, summaryScores } = req.body;
      const { id } = req.params;

      logger.info('Process score data to worker for score request ID ', id, 'Body', req.body);

      const scoreData: IScoreData = {
        scores,
        summaryScores,
      };

      // Obtain information about the score request by ID
      const scoreRequest = await CommentScoreRequest.findById(id);

      if (scoreRequest) {
        await enqueueProcessMachineScoreTask(
          scoreRequest.commentId!,
          scoreRequest.userId!,
          scoreData,
          runImmediately);
        res.json(REPLY_SUCCESS);
        next();
      } else {
        logger.error(`Score request not found for provided id: ${id}`);
        res.status(400).json({
          status: 'error',
          errors: 'Score request not found by provided scoreRequestId',
        });

        return;
      }
    },
  );

  return router;
}

export function createAssistantRouter(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.use('*', onlyServices);

  router.use('/', createAssistant());

  return router;
}
