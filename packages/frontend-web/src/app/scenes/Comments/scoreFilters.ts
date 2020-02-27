/*
Copyright 2020 Google Inc.

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

import { List, Map } from 'immutable';

import {ICommentScoreModel, ITaggingSensitivityModel, ModelId} from '../../../models';
import {ICommentSummaryScoreStateRecord} from '../../stores/commentSummaryScores';

export function getSensitivitiesForCategory(
  categoryId: ModelId,
  taggingSensitivities: List<ITaggingSensitivityModel>,
) {
  return taggingSensitivities.filter((ts: ITaggingSensitivityModel) => (
    ts.categoryId === categoryId || ts.categoryId === null
  )) as List<ITaggingSensitivityModel>;
}

function isSummaryAboveThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  score: ICommentSummaryScoreStateRecord,
): boolean {
  if (score.tagId === null) {
    return false;
  }

  return taggingSensitivities.some((ts) => {
    return (
      (ts.tagId === null || ts.tagId === score.tagId) &&
      (score.score >= ts.lowerThreshold && score.score <= ts.upperThreshold)
    );
  });
}

function isScoreAboveThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  score: ICommentScoreModel,
): boolean {
  if (score.tagId === null) {
    return false;
  }

  return taggingSensitivities.some((ts) => {
    return (
      (ts.tagId === null || ts.tagId === score.tagId) &&
      (score.score >= ts.lowerThreshold && score.score <= ts.upperThreshold)
    );
  });
}

export function getSummaryScoresAboveThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  scores: List<ICommentSummaryScoreStateRecord>): List<ICommentSummaryScoreStateRecord> {
  if (!scores) {
    return;
  }

  return scores.filter((s) => isSummaryAboveThreshold(taggingSensitivities, s))
    .sort((a, b) => b.score - a.score) as List<ICommentSummaryScoreStateRecord>;
}

export function getSummaryScoresBelowThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  scores: List<ICommentSummaryScoreStateRecord>): List<ICommentSummaryScoreStateRecord> {
  if (!scores) {
    return;
  }
  const scoresAboveThreshold = scores.filter(
    (s) => isSummaryAboveThreshold(taggingSensitivities, s),
  ) as List<ICommentSummaryScoreStateRecord>;
  const scoresBelowThreshold = scores.filter((s) =>
    !isSummaryAboveThreshold(taggingSensitivities, s) &&
    !scoresAboveThreshold.find(
      (sa) => sa.tagId === s.tagId),
  ) as List<ICommentSummaryScoreStateRecord>;

  return scoresBelowThreshold.sort(
    (a, b) => b.score - a.score,
  ) as List<ICommentSummaryScoreStateRecord>;
}

function dedupeScoreTypes(scores: Array<ICommentScoreModel>): Array<ICommentScoreModel> {
  return scores
    .reduce((sum, score) => {
      const existingScore = sum.get(score.tagId);

      if (!existingScore || existingScore.score < score.score) {
        return sum.set(score.tagId, score);
      }

      return sum;
    }, Map<string, ICommentScoreModel>())
    .toArray();
}

export function getScoresAboveThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  scores: Array<ICommentScoreModel>,
): Array<ICommentScoreModel> {
  return scores
    .filter((s) => isScoreAboveThreshold(taggingSensitivities, s))
    .sort((a, b) => b.score - a.score);
}

export function getScoresBelowThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  scores: Array<ICommentScoreModel>,
): Array<ICommentScoreModel> {
  const aboveThreshold = scores.filter((s) =>
    isScoreAboveThreshold(taggingSensitivities, s));
  const scoresBelowThreshold = scores.filter((s) =>
    !isScoreAboveThreshold(taggingSensitivities, s) &&
    !aboveThreshold.find((sa) => sa.tagId === s.tagId));

  return scoresBelowThreshold
    .sort((a, b) => b.score - a.score);
}

export function getReducedScoresAboveThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  scores: Array<ICommentScoreModel>,
): Array<ICommentScoreModel> {
  return dedupeScoreTypes(getScoresAboveThreshold(taggingSensitivities, scores));
}

export function getReducedScoresBelowThreshold(
  taggingSensitivities: List<ITaggingSensitivityModel>,
  scores: Array<ICommentScoreModel>,
): Array<ICommentScoreModel> {
  return dedupeScoreTypes(getScoresBelowThreshold(taggingSensitivities, scores));
}
