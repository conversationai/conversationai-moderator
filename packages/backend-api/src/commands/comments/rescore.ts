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

import { logger } from '../../logger';
import { Comment } from '../../models';
import { resendForScoring } from '../../pipeline';

export const command = 'comments:rescore';
export const describe = 'Rescore comment.';

export function builder(args: yargs.Argv) {
  return args
      .usage('Usage: node $0 comments:rescore');
}

export async function handler() {
  logger.info(`Rescoring comments`);

  try {
    // Clear tables
    const comments = await Comment.findAll({
      attributes: ['id'],
      where: {
        isModerated: false,
      },
    });

    for (const c of comments) {
      const comment = (await Comment.findById(c.id))!;
      await resendForScoring(comment);

      logger.info(`Rescored comment ${c.id}`);
    }
  } catch (err) {
    logger.error('Rescore comments error: ', err.name, err.message);
    logger.error(err.errors);
    process.exit(1);
  }

  logger.info('Comments successfully rescored');
  process.exit(0);
}
