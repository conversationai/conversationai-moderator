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

  articleId: ModelId;
  replyId?: ModelId;
  replyTo?: ICommentModel;
  replies?: Array<ICommentModel>;

  maxSummaryScore?: number;
  maxSummaryScoreTagId?: ModelId;
}

export type ICommentModel = Readonly<ICommentAttributes>;

export function CommentModel(keyValuePairs?: ICommentAttributes): ICommentModel {
  const author: any = (keyValuePairs as ICommentAttributes).author;

  if (author.user_name) {
    author.name = author.user_name;
  }

  if (author.image_uri) {
    author.avatar = author.image_uri;
  }

  const fsd = keyValuePairs.flagsSummary;
  const flagsSummary = fsd ? new Map(Object.entries(fsd)) : new Map();

  return {...keyValuePairs, author, flagsSummary} as ICommentModel;
}
