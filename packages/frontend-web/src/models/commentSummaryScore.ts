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

import { Record } from 'immutable';
import { TypedRecord } from 'typed-immutable-record';

export interface ICommentSummaryScoreAttributes {
  commentId: string;
  tagId: string;
  score: number;
  isConfirmed: boolean | null;
}

export interface ICommentSummaryScoreModel extends TypedRecord<ICommentSummaryScoreModel>, ICommentSummaryScoreAttributes {}

const CommentSummaryScoreModelRecord = Record({
  commentId: null,
  tagId: null,
  score: null,
  isConfirmed: null,
});

export function CommentSummaryScoreModel(keyValuePairs?: ICommentSummaryScoreAttributes): ICommentSummaryScoreModel {
  return new CommentSummaryScoreModelRecord(keyValuePairs) as ICommentSummaryScoreModel;
}
