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
  getCommentsToResendForScoring,
  resendForScoring,
} from '../../pipeline';
import { handler, IQueueHandler } from '../util';

// Control the processing of comments per heartbeat
const PROCESS_COMMENT_LIMIT = 10;

/**
 * Heartbeat, baby
 *
 * The soundtrack to this worker task:
 *   https://open.spotify.com/track/61h7fpfufg6ZA7kCOtXoZR
 *   https://open.spotify.com/track/24efdUt3KGbZ6wnBLp6j2n
 *   https://open.spotify.com/track/78TnMTAFmWUWWCgNXR7D3K
 *
 */
export const heartbeatTask: IQueueHandler<void> = handler<void>(async (_, logger) => {
  await resendComments(logger);

  logger.info('OSMod Heartbeat Done!');
});

export async function resendComments(logger: any) {
  logger.info('Process checking for comments to re-send for scoring');
  let comments;

  try {
    // See if there are any comments that need to be re-sent for scoring
    comments = await getCommentsToResendForScoring(PROCESS_COMMENT_LIMIT);
  } catch (err) { // Catching just for logging purposes
    logger.error('Heartbeat: Error fetching comments for re-sending for scoring', err);
    throw err;
  }

  if (!comments.length) {
    logger.info('Heartbeat: No comments found to re-send for scoring');

    return;
  }

  logger.info(`Heartbeat: ${comments.length} comments found to re-send for scoring`);

  try {
    for (const comment of comments) {
      await resendForScoring(comment);
    }
  } catch (err) { // Catching just for logging purposes
    logger.error('Heartbeat: Error re-sending comments for scoring', err);
    throw err;
  }
}
