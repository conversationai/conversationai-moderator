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

import * as yargs from 'yargs';

import { Comment, CommentTopScore, Tag } from '@conversationai/moderator-backend-core';

import { cacheCommentTopScore } from '../../domain';
import { logger } from '../../logger';

export const command = 'comments:recalculate-top-scores';
export const describe = 'Recalculate comment top scores.';

export function builder(args: yargs.Argv) {
  return args
      .usage('Usage: node $0 comments:recalculate-top-scores');
}

export async function handler() {
  logger.info(`Recalculating comment top scores`);

  try {
    // Clear table.
    await CommentTopScore.destroy({
      truncate: true,
    });

    const comments = await Comment.findAll({
      attributes: ['id'],
    });

    const tags = await Tag.findAll({
      attributes: ['id'],
    });

    for (const tag of tags) {
      for (const comment of comments) {
        await cacheCommentTopScore(comment, tag);
      }
    }
  } catch (err) {
    logger.error('Recalculate comment top scores error: ', err.name, err.message);
    logger.error(err.errors);
    process.exit(1);
  }

  logger.info('Comment top scores successfully recalculated');
  process.exit(0);
}
