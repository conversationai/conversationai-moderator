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

import {
  HEADLINE_TYPE,
} from '../styles';
import { css } from '../utilx';

export interface ITextNode {
  start: number;
  end: number;
  targetString: string;
}

export function getTextNodes(searchStr: string, str: string) {
  let startIndex = 0;
  const searchStrLen = searchStr.length;
  let index = 0;
  const nodes: Array<ITextNode> = [];
  str = str.toLowerCase();
  searchStr = searchStr.toLowerCase();

  do {
    index = str.indexOf(searchStr, startIndex);
    nodes.push({
      start: index,
      end: index + searchStrLen,
      targetString: searchStr,
    });
    startIndex = index + searchStrLen;
  } while (str.indexOf(searchStr, startIndex) > -1);

  return nodes;
}

function addRange(arr: Array<JSX.Element>, originalString: string, start: number, end: number, shouldHighlight?: boolean) {
  const str = originalString.slice(start, end);

  if (str.length > 0) {
    if (shouldHighlight) {
      arr.push(<span {...css(HEADLINE_TYPE, { fontSize: 15 })}>{str}</span>);
    } else {
      arr.push(<span>{str}</span>);
    }
  }

  return arr;
}

export function highlightText(searchTerm: string, originalString: string) {
  const textNodes = getTextNodes(searchTerm, originalString);
  const sortedNodes = textNodes.sort((a, b) => a.start - b.start);

  let currentIndex = 0;

  let output: Array<JSX.Element> = [];

  sortedNodes.forEach((n) => {
    output = addRange(output, originalString, currentIndex, n.start);
    output = addRange(output, originalString, n.start, n.end, true);
    currentIndex = n.end;
  });

  output = addRange(output, originalString, currentIndex, originalString.length);

  return <div>{output}</div>;
}
