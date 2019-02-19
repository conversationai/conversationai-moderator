/*
Copyright 2019 Google Inc.

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

export interface ICommentFlagAttributes {
  id: string;
  label: string;
  detail?: string;
  commentId: string;
  sourceId?: string;
  authorSourceId?: string;
  isResolved: boolean;

}

export interface ICommentFlagModel extends TypedRecord<ICommentFlagModel>, ICommentFlagAttributes {}

const CommentFlagModelRecord = Record({
  id: null,
  commentId: null,
  label: null,
  detail: null,
  sourceId: null,
  authorSourceId: null,
  isResolved: false,
});

export function CommentFlagModel(keyValuePairs?: ICommentFlagAttributes): ICommentFlagModel {
  return new CommentFlagModelRecord(keyValuePairs) as ICommentFlagModel;
}
