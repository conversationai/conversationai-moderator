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

import { Comment } from '@conversationai/moderator-backend-core';

import { calculateTextSize } from '../../domain';
import { logger } from '../../logger';

export const command = 'comments:calculate-text-size';
export const describe = 'Using node-canvas, calculate a single comment height at a given width.';

export function builder(args: yargs.Argv) {
  return args
      .usage('Usage: node $0 comments:calculate-text-size')
      .demand('comment-id')
      .number('comment-id')
      .describe('comment-id', 'The comment id')
      .demand('width')
      .number('width')
      .describe('width', 'The text width');
}

export async function handler(argv: any) {
  const width = argv.width;
  const commentId = argv.commentId;
  logger.info(`Calculating comment (${commentId}) text size at ${width}`);

  try {
    const comment = await Comment.findById(commentId, {
      attributes: ['id', 'text'],
    });

    if (!comment) {
      logger.error(`No such comment: ${commentId}`);
      return;
    }

    const height = await calculateTextSize(comment, width);
    console.log(`Height in pixels`, height);
  } catch (err) {
    logger.error('Calculate comment text size error: ', err.name, err.message);
    logger.error(err.errors);
    process.exit(1);
  }

  process.exit(0);
}
