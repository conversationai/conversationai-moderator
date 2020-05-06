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

import {createAction} from 'redux-actions';

import {ICommentModel, ModelId} from '../../models';

export const commentsUpdated = createAction<Array<ICommentModel>>('global/COMMENTS_UPDATED');

export type ICommentAttributesUpdateDetails = {
  isModerated?: boolean | null;
  isAccepted?: boolean | null;
} & Partial<Pick<ICommentModel,
  'isDeferred' | 'isHighlighted' |'text' | 'author' | 'summaryScores'>>;

export interface ICommentAttributesUpdate {
  commentIds: Array<ModelId>;
  attributes?: ICommentAttributesUpdateDetails;
  resolveFlags?: boolean;
}

export const ATTRIBUTES_HIGHLIGHTED: ICommentAttributesUpdateDetails = {
  isModerated: true,
  isAccepted: true,
  isHighlighted: true,
  isDeferred: false,
};

export const ATTRIBUTES_RESET: ICommentAttributesUpdateDetails = {
  isModerated: null,
  isAccepted: null,
  isHighlighted: false,
  isDeferred: false,
};

export const ATTRIBUTES_APPROVED: ICommentAttributesUpdateDetails = {
  isModerated: true,
  isAccepted: true,
  isHighlighted: false,
  isDeferred: false,
};

export const ATTRIBUTES_REJECTED: ICommentAttributesUpdateDetails = {
  isModerated: true,
  isAccepted: false,
  isHighlighted: false,
  isDeferred: false,
};

export const ATTRIBUTES_DEFERRED: ICommentAttributesUpdateDetails = {
  isModerated: true,
  isAccepted: null,
  isHighlighted: false,
  isDeferred: true,
};

export const commentAttributesUpdated = createAction<ICommentAttributesUpdate>('global/COMMENT_ATTRIBUTES_UPDATED');
