/*
Copyright 2018 Google Inc.

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

import {google} from 'googleapis';
import * as yargs from 'yargs';

import {logger} from '@conversationai/moderator-backend-core';

import {authorize} from './authenticate';
import {foreachPendingDecision, markDecisionExecuted} from './objectmap';

export const command = 'youtube:comments:backsync';
export const describe = 'Backsync comment moderation decisions.';

export function builder(yargs: yargs.Argv) {
  return yargs
    .usage('Usage:\n\n' +
      'Backsync comment moderation decisions:\n' +
      'node $0 youtube:comments:backsync');
}

export async function handler() {
  authorize((auth) => {
    const service = google.youtube('v3');

    foreachPendingDecision((decision, comment) => {
      const sourceId = comment.get('sourceId') as string;
      const status = decision.get('status');

      if (status === 'Defer') {
        logger.info('Not syyncing comment %s:%s - in deferred state', comment.id, sourceId);
        markDecisionExecuted(decision);
        return;
      }

      const moderationStatus = (status === 'Accept') ? 'published' : 'rejected';
      logger.info('Syncing comment %s:%s to %s (%s) ', comment.id, sourceId, moderationStatus, decision.id);
      service.comments.setModerationStatus({
          auth: auth,
          id: sourceId,
          moderationStatus: moderationStatus,
        },
        (err) => {
        if (err) {
          logger.error(`Google API returned an error for comment ${comment.id}: ` + err);
          return;
        }
        markDecisionExecuted(decision);
      });
    });
  });
}
