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

import { ModelId } from './common';

export type ICommentListItem = Readonly<{
  commentId: ModelId;
}>;

export type ICommentDate = Readonly<{
  date: Date;
}> & ICommentListItem;

export type ICommentScore = Readonly<{
  score: number;
}> & ICommentListItem;

export interface IAuthorAttributes {
  email: string;
  location: string;
  avatar: string;
  name: string;
  approvalRating?: string;
  isSubscriber: boolean;
}

export type IAuthorModel = Readonly<IAuthorAttributes>;

export interface IAuthorCountsAttributes {
  approvedCount: number;
  rejectedCount: number;
}

export type IAuthorCountsModel = Readonly<IAuthorCountsAttributes>;

export interface ITopScore {
  score: number;
  start: number;
  end: number;
}

export interface ICommentSummaryScoreAttributes {
  tagId: ModelId;
  score: number;
  topScore: ITopScore;
}

export type ICommentSummaryScoreModel = Readonly<ICommentSummaryScoreAttributes>;

export const FLAGS_COUNT = 0;
export const UNRESOLVED_FLAGS_COUNT = 1;
export const RECOMMENDATIONS_COUNT = 2;

export interface ICommentAttributes {
  id: ModelId;
  sourceId: string;
  authorSourceId?: string;
  replyToSourceId?: string;
  author: IAuthorModel;
  text: string;

  isScored: boolean;
  isModerated: boolean;
  isAccepted?: boolean;
  isDeferred: boolean;
  isHighlighted: boolean;
  isBatchResolved: boolean;
  isAutoResolved: boolean;

  sourceCreatedAt: string;
  updatedAt: string;
  sentForScoring: string;

  unresolvedFlagsCount: number;
  flagsSummary?: Map<string, Array<number>>;

  categoryId?: ModelId;
  articleId: ModelId;
  replyId?: ModelId;
  replies?: Array<ModelId>;

  summaryScores?: Array<ICommentSummaryScoreModel>;
  maxSummaryScore?: number;
  maxSummaryScoreTagId?: ModelId;
}

export type ICommentModel = Readonly<ICommentAttributes>;

export function CommentModel(commentData: ICommentAttributes): ICommentModel {
  const author: any = commentData.author;

  if (author) {
    if (author.user_name) {
      author.name = author.user_name;
    }

    if (author.image_uri) {
      author.avatar = author.image_uri;
    }
  }

  const fsd = commentData.flagsSummary;
  const flagsSummary = fsd ? new Map(Object.entries(fsd)) : new Map();

  return {...commentData, author, flagsSummary} as ICommentModel;
}

export function getTopScore(comment: ICommentModel) {
  return getTopScoreForTag(comment, comment.maxSummaryScoreTagId);
}

export function getSummaryForTag(comment: ICommentModel, tagId: ModelId): ICommentSummaryScoreModel | undefined {
  if (!comment.summaryScores) {
    return undefined;
  }
  return comment.summaryScores.find((s) => s.tagId === tagId);
}

export function getTopScoreForTag(comment: ICommentModel, tagId?: ModelId) {
  if (!comment.summaryScores || !tagId) {
    return null;
  }
  for (const summary of comment.summaryScores) {
    if (summary.tagId === tagId) {
      return summary.topScore;
    }
  }
  return null;
}
