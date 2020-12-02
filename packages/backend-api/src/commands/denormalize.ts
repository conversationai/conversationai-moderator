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

import { denormalizeCommentCountsForArticle, denormalizeCountsForComment } from '../domain';
import { logger } from '../logger';
import {
  Article,
  Comment,
} from '../models';

export const command = 'denormalize';
export const describe = 'Re-run denormalize counts';

export function builder(args: yargs.Argv) {
  return args.usage('Usage: node $0 denormalize')
              .boolean('articles-only')
              .describe('articles-only', 'Only recalculate counts for articles, not comments');
}

export async function handler(argv: any) {
  if (!argv.articlesOnly) {
    const comments = await Comment.findAll();

    await Bluebird.mapSeries(comments, (c: Comment) => {
      logger.info('Denormalizing comment ' + c.id);

      return denormalizeCountsForComment(c);
    });
  }

  const articles = await Article.findAll();

  await Bluebird.mapSeries(articles, (a: Article) => {
    logger.info('Denormalizing article ' + a.id);

    return denormalizeCommentCountsForArticle(a, false);
  });

  logger.info('Counts denormalized successfully');
  process.exit(0);
}
