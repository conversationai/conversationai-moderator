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

import { maxBy, minBy } from 'lodash';

export interface IGroupedComments {
  [column: string]: Array<number>;
}

export interface IGroupableComment {
  commentId: string;
  [key: string]: any;
}

export interface ITaggedComment extends IGroupableComment {
  score: number;
}

export interface IDatedComment extends IGroupableComment {
  date: Date;
}

export function groupByKey(comments: Array<IGroupableComment>, key: string, startVal: number, endVal: number, columnCount: number): IGroupedComments {
  const step = (endVal - startVal) / columnCount;
  const columns: IGroupedComments = {};

  for (let i = 0; i < columnCount; i++) {
    const range = startVal + (step * i);
    columns[range.toFixed(2)] = [];
  }

  return comments.reduce((sum, comment) => {
    for (let i = 0; i < columnCount; i++) {
      const start = startVal + (step * i);
      const end = start + step;

      const val = Number(comment[key]);
      if ((val >= start) && (val < end)) {
        sum[start.toFixed(2)].push(parseInt(comment.commentId, 10));
        break;
      }
    }

    return sum;
  }, columns);
}

export function groupByScoreColumns<T extends ITaggedComment>(comments: Array<T>, columnCount: number): IGroupedComments {
  return groupByKey(comments, 'score', 0.0, 1.0, columnCount);
}

export function groupByDateColumns<T extends IDatedComment>(comments: Array<T>, columnCount: number): IGroupedComments {
  const maxDate = maxBy<T>(comments, (c) => c.date);
  const minDate = minBy<T>(comments, (c) => c.date);

  const lowEnd = minDate ? Number(minDate.date) : 0;
  const highEnd = maxDate ? Number(maxDate.date) : 1;

  return groupByKey(comments, 'date', lowEnd, highEnd, columnCount);
}
