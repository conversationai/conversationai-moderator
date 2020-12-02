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

import * as opentype from 'opentype.js';
import * as path from 'path';

import {
  CommentSize,
  Comment,
} from '../../models';

const FONT_FAMILY = 'Georgia';
const TYPE_DEF = {
  fontFamily: FONT_FAMILY,
  fontSize: 16,
  fontWeight: 400,
  lineHeight: 1.5,
};

const FONT_FILE = path.join(__dirname, '..', '..', '..', 'fonts', 'Georgia.ttf');

let openTypeFont: any;
opentype.load(FONT_FILE, (err: any, font: any) => {
  if (err) {
    console.error('Font could not be loaded: ' + err);
  } else {
    openTypeFont = font;
  }
});

function getTextHeight(lines: Array<string>, _wordWrapWidth: number, styles: any): number {
  const lineHeight = styles.fontSize * styles.lineHeight;

  return Math.ceil(lineHeight + ((lines.length - 1) * lineHeight));
}

function measureText(word: string): number {
  const openTypePath = openTypeFont.getPath(word, 0, 0, TYPE_DEF.fontSize);
  const bounds = openTypePath.getBoundingBox();

  return Math.ceil(bounds.x2 - bounds.x1);
}

function wordWrap(text: string, wordWrapWidth: number): Array<string> {
  let result = '';
  const lines = text
      .split('\n')
      .filter((l) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    let spaceLeft = wordWrapWidth;
    const words = lines[i].split(' ');

    for (let j = 0; j < words.length; j++) {
      const wordWidth = measureText(words[j]);
      const wordWidthWithSpace = measureText(words[j] + ' ');

      if (j === 0 || wordWidthWithSpace > spaceLeft) {
        // Skip printing the newline if it's the first word of the line that is
        // greater than the word wrap width.
        if (j > 0) {
          result += '\n';
        }

        result += words[j];
        spaceLeft = wordWrapWidth - wordWidth;
      } else {
        spaceLeft -= wordWidthWithSpace;
        result += ` ${words[j]}`;
      }
    }

    if (i < lines.length - 1) {
      result += '\n';
    }
  }

  return result.split(/(?:\r\n|\r|\n)/);
}

export async function calculateTextSize(comment: Comment, width: number): Promise<number> {
  const lines = await wordWrap(comment.text, width);

  return getTextHeight(lines, width, TYPE_DEF);
}

export async function cacheTextSize(comment: Comment, width: number): Promise<number> {
  const height = await calculateTextSize(comment, width);

  await CommentSize.findOrCreate({
    where: {
      commentId: comment.id,
      width,
    },
    defaults: {
      commentId: comment.id,
      width,
      height,
    },
  });

  return height;
}
