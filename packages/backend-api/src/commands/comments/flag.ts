/*
Copyright 2019 Google Inc.

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

import { Op } from 'sequelize';
import * as yargs from 'yargs';

import { denormalizeCommentCountsForArticle, denormalizeCountsForComment } from '../../domain';
import { Comment, CommentFlag } from '../../models';

export const command = 'comments:flag';

export const describe = 'Flag comments.';

export function builder(args: yargs.Argv) {
  return args
    .usage('Usage: node $0 comments:flag --label <label> [ --description <description> ] [ --recommendation ] commentIds...')
    .demandOption('label')
    .string('label')
    .describe('label', `Label to apply.`)
    .string('detail')
    .describe('detail', `Description to use.`)
    .boolean('recommendation')
    .describe('recommendation', `Flag is a recommendation`)
    .demandCommand(1);
}

export async function handler(argv: any) {
  const comments = await Comment.findAll({where: {id: {[Op.in]: [argv._.slice(1)] }}});
  for (const c of comments) {
    console.log(`Flagging ${c.id}`);
    await CommentFlag.create({
      commentId: c.id,
      label: argv.label.toString(),
      detail: argv.detail ? argv.detail.toString() : undefined,
      isRecommendation: argv.recommendation,
      isResolved: false,
      sourceId: 'osmod-cli',
      authorSourceId: 'osmod-cli',
    });

    await denormalizeCountsForComment(c);
    await denormalizeCommentCountsForArticle(await c.getArticle(), false);
  }
}
