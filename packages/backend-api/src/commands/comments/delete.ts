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

import {
  Article,
  Comment,
} from '@conversationai/moderator-backend-core';

import { denormalizeCommentCountsForArticle } from '../../domain';
import { logger } from '../../logger';

export const command = 'comments:delete';
export const describe = 'Delete all comments from the database.';

export function builder(args: yargs.Argv) {
  return args
    .usage('Usage: node $0 comments:delete');
}

export async function handler() {
  logger.info(`Deleting comments`);

  try {
    await Comment.destroy({where: {}});
    const articles = await Article.findAll();
    for (const a of articles) {
      logger.info('Denormalizing article ' + a.id);
      denormalizeCommentCountsForArticle(a, false);
    }

  }
  catch (err) {
    logger.error('Delete comments error: ', err.name, err.message);
    logger.error(err.errors);
    process.exit(1);
  }

  logger.info('Comments successfully deleted');
  process.exit(0);
}
