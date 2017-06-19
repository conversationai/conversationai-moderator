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
  ICommentDatedModel,
  ICommentScoredModel,
  ITagModel,
  TagModel,
} from '../../../../../../models';
import { COLCOUNT } from '../../../../../config';
import { IAppStateRecord } from '../../../../../stores';
import { getTags } from '../../../../../stores/tags';
import { groupByDateColumns } from '../../../../../util';

const dateTag = TagModel({
  label: 'All Comments by Date',
  key: 'DATE',
  color: '',
}).set('id', 'DATE');

export function getTagsWithDateAndSummary(state: IAppStateRecord): List<ITagModel> {
  return getTags(state).push(dateTag);
}

export function getSelectedTag(state: IAppStateRecord, tag?: string): ITagModel | null {
  return tag && getTagsWithDateAndSummary(state).find((t) => t.key === tag);
}

export function parseRouteAndQueryString(
  { articleId, categoryId, tag }: any,
  { pos1, pos2 }: any,
) {
  const isArticleDetail = !!articleId;

  let parsedPos1;
  let parsedPos2;

  if (tag === 'DATE') {
    parsedPos1 = typeof pos1 !== 'undefined' ? parseFloat(pos1) : 0.0;
    parsedPos2 = typeof pos2 !== 'undefined' ? parseFloat(pos2) : 1.0;
  } else {
    parsedPos1 = parseFloat(pos1);
    parsedPos2 = parseFloat(pos2);
  }

  return {
    isArticleDetail,
    articleId,
    category: categoryId,
    tag,
    pos1: parsedPos1,
    pos2: parsedPos2,
  };
}

export function getCommentIDsInRange(
  commentScores: List<ICommentScoredModel | ICommentDatedModel>,
  selectionPosition1: number,
  selectionPosition2: number,
  groupByDate: boolean,
): List<string> {
  const minPos = Math.min(selectionPosition1, selectionPosition2);
  const maxPos = Math.max(selectionPosition1, selectionPosition2);

  let scores: List<ICommentScoredModel | ICommentDatedModel>;

  if (groupByDate) {
    const grouped = groupByDateColumns(commentScores.toArray() as Array<ICommentDatedModel>, COLCOUNT);
    const columnKeys = Object.keys(grouped).sort();

    const pos1Index = clamp(Math.ceil(minPos * (columnKeys.length - 1)), 0, columnKeys.length - 1);
    const pos2Index = clamp(Math.ceil(maxPos * (columnKeys.length - 1)), 0, columnKeys.length - 1);

    const pos1Key = columnKeys[pos1Index];
    const pos2Key = columnKeys[pos2Index];

    const pos1Value = Number(pos1Key);
    const pos2Value = Number(pos2Key);
    scores = commentScores.filter((s: ICommentDatedModel) => (+s.date >= pos1Value) && (+s.date < pos2Value)) as List<ICommentDatedModel>;
  } else {
    scores = commentScores.filter((s: ICommentScoredModel) => (s.score >= minPos) && (s.score < maxPos)) as List<ICommentScoredModel>;
  }

  return List<string>(scores.map((score) => score.commentId));
}
