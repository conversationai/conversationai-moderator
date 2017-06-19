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
import { createAssignmentsService } from './assignments';
import { createAuthorCountsService } from './authorCounts';
import { createCommentActionsService } from './commentActions';
import { createCommentsByIdService } from './commentsById';
import { createEditCommentTextService } from './editComment';
import { createHistogramScoresService } from './histogramScores';
import { createModeratedCountsService } from './moderatedCounts';
import { createSearchService } from './search';
import { createTextSizesService } from './textSizes';
import { createTopScoresService } from './topScores';

export function createServicesRouter(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.use('/assignments', createAssignmentsService());
  router.use('/search', createSearchService());
  router.use('/commentActions', createCommentActionsService());
  router.use('/histogramScores', createHistogramScoresService());
  router.use('/moderatedCounts', createModeratedCountsService());
  router.use('/authorCounts', createAuthorCountsService());
  router.use('/textSizes', createTextSizesService());
  router.use('/commentsById', createCommentsByIdService());
  router.use('/topScores', createTopScoresService());
  router.use('/editComment', createEditCommentTextService());

  return router;
}
