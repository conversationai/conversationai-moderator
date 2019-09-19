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

import * as Bluebird from 'bluebird';
import * as yargs from 'yargs';

import { sequelize } from '@conversationai/moderator-backend-core';

import { logger } from '../../logger';

export const command = 'comments:rebuild-reply-relations';
export const describe = 'Rebuild the join table for comment relations';

export function builder(args: yargs.Argv) {
  return args
      .usage('Usage: node $0 comments:rebuild-reply-relations');
}

export async function handler() {
  logger.info('Rebuilding reply relations');

  try {
    const results = await sequelize.query(
      'SELECT c.id as commentId, c2.id as replyId ' +
      'FROM comments as c ' +
      'LEFT JOIN comments as c2 ON c.sourceId = c2.replyToSourceId ' +
      'WHERE c2.id IS NOT NULL;',
      { type: sequelize.QueryTypes.SELECT },
    );

    logger.info('Found ' + results.length + ' comments with replies');

    await Bluebird.mapSeries(results, async (row: any) => {
      const existing = await sequelize.query(
        'SELECT commentId, replyId FROM comment_replies ' +
        'WHERE commentId = ' + row.commentId + ' AND replyId = ' + row.replyId + ';',
        { type: sequelize.QueryTypes.SELECT },
      );

      if (existing && existing.length > 0) { return Bluebird.resolve(); }

      logger.info('Creating relation for ' + row.commentId + ',' + row.replyId);

      return sequelize.query(
        'INSERT INTO comment_replies (commentId, replyId, createdAt, updatedAt) ' +
        'VALUES(' + row.commentId + ',' + row.replyId + ',NOW(),NOW());',
      );
    });
  } catch (err) {
    logger.error('Rebuild reply relations error: ', err.name, err.message);
    logger.error(err.errors);
    process.exit(1);
  }

  logger.info('Reply relations successfully created');
  process.exit(0);
}
