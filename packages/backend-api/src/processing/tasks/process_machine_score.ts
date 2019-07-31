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

import {
  completeMachineScoring,
  processMachineScore,
} from '../../pipeline';
import { IScoreData } from '../../pipeline/shim';
import { getIsDoneScoring } from '../../pipeline/state';

export { IScoreData };
export interface IProcessMachineScoreData {
  commentId: number;
  userId: number;
  scoreData: IScoreData;
  runImmediately?: boolean;
}

/**
 * Worker wrapper for machine score processing
 *
 * Usage:
 *
 *    import { queue } from './worker/queue';
 *
 *    queue
 *      .create('processMachineScore', {
 *        commentId: 43,
 *        userId: 8,
 *        scoreData: {
 *          'scores': {
 *            ...
 *          }
 *        }
 *      })
 *      .save();
 *
 */
export async function processMachineScoreTask(data: IProcessMachineScoreData) {
  await processMachineScore(
    data.commentId,
    data.userId,
    data.scoreData,
  );

  const isDoneScoring = await getIsDoneScoring(data.commentId);

  if (isDoneScoring) {
    await completeMachineScoring(data.commentId);
  }
}
