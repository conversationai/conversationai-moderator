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

import { fromJS, List, Record } from 'immutable';
import { TypedRecord } from 'typed-immutable-record';
import { IArticleModel } from './article';

export interface IAuthorAttributes {
  email: string;
  location: string;
  avatar: string;
  name: string;
}

export interface IAuthorModel extends TypedRecord<IAuthorModel>, IAuthorAttributes {}

export interface IAuthorCountsAttributes {
  approvedCount: number;
  rejectedCount: number;
}

export interface IAuthorCountsModel extends TypedRecord<IAuthorCountsModel>, IAuthorCountsAttributes {}

export interface ICommentAttributes {
  id: string;
  sourceId: string | number;
  replyToSourceId: string | number | undefined;
  replyId: string | undefined;
  replyTo?: ICommentModel;
  authorSourceId: string | number;
  text: string;
  author: IAuthorModel;
  isScored: boolean;
  isModerated: boolean;
  isAccepted: boolean;
  isDeferred: boolean;
  isHighlighted: boolean;
  isBatchResolved: boolean;
  isAutoResolved: boolean;
  sourceCreatedAt: string;
  updatedAt: string;
  unresolvedFlagsCount: number;
  flagsSummary?: Map<string, List<number>>;
  sentForScoring: boolean;
  articleId: string;
  article: IArticleModel;
  replies?: Array<ICommentModel>;
  maxSummaryScore?: number;
  maxSummaryScoreTagId?: string;
}

export interface ICommentModel extends TypedRecord<ICommentModel>, ICommentAttributes {}

const CommentModelRecord = Record({
  id: null,
  sourceId: null,
  replyToSourceId: null,
  replyId: null,
  replyTo: null,
  authorSourceId: null,
  text: null,
  author: null,
  isScored: null,
  isModerated: null,
  isAccepted: null,
  isDeferred: null,
  isHighlighted: null,
  isBatchResolved: null,
  isAutoResolved: null,
  unresolvedFlagsCount: null,
  flagsSummary: null,
  sourceCreatedAt: null,
  updatedAt: null,
  sentForScoring: null,
  articleId: null,
  article: null,
  replies: null,
  commentScores: null,
  maxSummaryScore: null,
  maxSummaryScoreTagId: null,
});

export const AuthorModelRecord = Record({
  avatar: null,
  email: null,
  location: null,
  name: null,
});

export function CommentModel(keyValuePairs?: ICommentAttributes): ICommentModel {
  let immutableKeyValuePairs = fromJS(keyValuePairs);

  if (typeof immutableKeyValuePairs.get('author') === 'string') {
    immutableKeyValuePairs = immutableKeyValuePairs.update('author', (author: any) => {
      const parsedAuthor = JSON.parse(author);

      if (parsedAuthor.user_name) {
        parsedAuthor.name = parsedAuthor.user_name;
      }

      if (parsedAuthor.image_uri) {
        parsedAuthor.avatar = parsedAuthor.image_uri;
      }

      return AuthorModelRecord(parsedAuthor) as IAuthorModel;
    });
  }

  return new CommentModelRecord(immutableKeyValuePairs) as ICommentModel;
}
