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

export interface ICommentFlagAttributes {
  id: string;
  label: string;
  detail?: string;
  isRecommendation: boolean;
  commentId: string;
  sourceId?: string;
  authorSourceId?: string;
  isResolved: boolean;
  resolvedById?: string;
  resolvedAt?: string;
}

export type ICommentFlagModel = Readonly<ICommentFlagAttributes>;

export function CommentFlagModel(flagData?: ICommentFlagAttributes): ICommentFlagModel {
  return flagData as ICommentFlagModel;
}
