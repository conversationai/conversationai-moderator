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

import { ITypeDefinition } from '../styles/typography';

function getFontStyle({ fontWeight, fontSize, fontFamily }: ITypeDefinition): string {
  return `normal normal ${fontWeight} ${fontSize}px ${fontFamily}`;
}

export function setupContext(canvas: any, styles: ITypeDefinition): void {
  const ctx = canvas.getContext('2d');

  ctx.font = getFontStyle(styles);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 0;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 10;
}

export function measureLine(canvas: any, text: string, styles: ITypeDefinition): number {
  const ctx = canvas.getContext('2d');
  setupContext(canvas, styles);

  return ctx.measureText(text).width;
}

export function getTextHeight(lines: Array<string>, _wordWrapWidth: number, styles: ITypeDefinition): number {
  const lineHeight = styles.fontSize * styles.lineHeight;

  return lineHeight + ((lines.length - 1) * lineHeight);
}

export function wordWrap(canvas: any, text: string, wordWrapWidth: number, styles: ITypeDefinition): Array<string> {
  const ctx = canvas.getContext('2d');
  setupContext(canvas, styles);

  let result = '';
  const lines = text
      .split('\n')
      .filter((l) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    let spaceLeft = wordWrapWidth;
    const words = lines[i].split(' ');

    for (let j = 0; j < words.length; j++) {
      const wordWidth = ctx.measureText(words[j]).width;

      const wordWidthWithSpace = wordWidth + ctx.measureText(' ').width;

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
