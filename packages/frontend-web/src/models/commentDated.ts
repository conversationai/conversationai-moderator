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

export interface ICommentDatedAttributes {
  date: Date;
  commentId: string;
}

export interface ICommentDatedModel extends TypedRecord<ICommentDatedModel>, ICommentDatedAttributes {}

const CommentDatedModelRecord = Record({
  date: null,
  commentId: null,
});

export function CommentDatedModel(keyValuePairs?: ICommentDatedAttributes): ICommentDatedModel {
  return new CommentDatedModelRecord(keyValuePairs) as ICommentDatedModel;
}

export interface ICommentScoredAttributes {
  score: number;
  commentId: string;
}

export interface ICommentScoredModel extends TypedRecord<ICommentScoredModel>, ICommentScoredAttributes {}

const CommentScoredModelRecord = Record({
  score: null,
  commentId: null,
});

export function CommentScoredModel(keyValuePairs?: ICommentScoredAttributes): ICommentScoredModel {
  return new CommentScoredModelRecord(keyValuePairs) as ICommentScoredModel;
}
