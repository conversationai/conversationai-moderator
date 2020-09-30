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

import { List } from 'immutable';
import { clamp } from 'lodash';
import {
  ICommentDate,
  ICommentListItem,
  ICommentScore,
  ITagModel,
  ModelId,
  TagModel,
} from '../../../../../../models';
import { IAppState } from '../../../../../appstate';
import { COLCOUNT } from '../../../../../config';
import { getTags } from '../../../../../stores/tags';
import { groupByDateColumns } from '../../../../../util';

const dateTag = TagModel({
  id: 'DATE',
  label: 'All Comments by Date',
  key: 'DATE',
  color: '',
});

export function getTagsWithDateAndSummary(state: IAppState): List<ITagModel> {
  return getTags(state).push(dateTag);
}

export function getSelectedTag(state: IAppState, tag?: string): ITagModel | null {
  return tag && getTagsWithDateAndSummary(state).find((t) => t.key === tag);
}

export function getCommentIDsInRange(
  commentScores: Array<ICommentListItem>,
  selectionPosition1: number,
  selectionPosition2: number,
  groupByDate: boolean,
): Array<ModelId> {
  const minPos = Math.min(selectionPosition1, selectionPosition2);
  const maxPos = Math.max(selectionPosition1, selectionPosition2);

  let scores: Array<ICommentListItem>;

  if (groupByDate) {
    const grouped = groupByDateColumns(commentScores as Array<ICommentDate>, COLCOUNT);
    const columnKeys = Object.keys(grouped).sort();

    const pos1Index = clamp(Math.ceil(minPos * (columnKeys.length - 1)), 0, columnKeys.length - 1);
    const pos2Index = clamp(Math.ceil(maxPos * (columnKeys.length - 1)), 0, columnKeys.length - 1);

    const pos1Key = columnKeys[pos1Index];
    const pos2Key = columnKeys[pos2Index];

    const pos1Value = Number(pos1Key);
    const pos2Value = Number(pos2Key);
    scores = commentScores.filter((s: ICommentDate) => (+s.date >= pos1Value) && (+s.date < pos2Value));
  } else {
    scores = commentScores.filter((s: ICommentScore) => (s.score >= minPos) && (s.score < maxPos));
  }

  return scores.map((score) => score.commentId);
}
