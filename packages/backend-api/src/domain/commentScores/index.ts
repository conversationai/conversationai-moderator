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

import * as Bluebird from 'bluebird';
import { maxBy } from 'lodash';

import {
  Comment,
  CommentScore,
  CommentTopScore,
  Tag,
} from '../../models';

/**
 * Describes a top score for a set of comment scores in a tag.
 */
export interface ITopScore {
  start: number;
  end: number;
  commentId: number;
  score: number;
}

/**
 * Describes a set of top scores for each related commentId.
 */
export interface ITopScores {
  [commentId: number]: ITopScore;
}

/**
 * Figure out the top score given an array of scores. Simply uses the max `score`.
 */
export function calculateTopScore(scores: Array<CommentScore>): CommentScore | null {
  const scoresWithRange = scores.filter((s) => {
    return s.annotationStart !== null && s.annotationEnd !== null;
  });

  if (scoresWithRange.length <= 0) { return null; }

  return maxBy(scoresWithRange, (s) => s.score) || null;
}

/**
 * Get all the scores for a set of comments.
 */
export async function calculateTopScores(comments: Array<Comment>, tagId: number): Promise<ITopScores> {
  return Bluebird.reduce(comments, async (sum, comment) => {
    const topScore = await CommentTopScore.findOne({
      where: {
        commentId: comment.id,
        tagId,
      },
    });

    if (!topScore) { return sum; }

    const score = await CommentScore.findByPk(topScore.commentScoreId);

    if (!score) { return sum; }

    sum[comment.id] = {
      commentId: score.commentId,
      score: score.score,
      start: score.annotationStart,
      end: score.annotationEnd,
    };

    return sum;
  }, {} as any);
}

export async function cacheCommentTopScore(comment: Comment, tag: Tag): Promise<CommentScore | null> {
  const scores = await CommentScore.findAll({
    where: {
      commentId: comment.id,
      tagId: tag.id,
    },
  });

  const topScore = calculateTopScore(scores);

  if (topScore) {
    await CommentTopScore.upsert({
      commentId: comment.id,
      tagId: tag.id,
      commentScoreId: topScore.id,
    });
  }

  return topScore;
}

export async function cacheCommentTopScores(comment: Comment) {
  const tags = await Tag.findAll();
  for (const tag of tags) {
    await cacheCommentTopScore(comment, tag);
  }
}
