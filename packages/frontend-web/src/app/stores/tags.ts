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

import { List } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';

import { ITagModel } from '../../models';
import { IAppState } from '../appstate';

export const tagsUpdated = createAction<object>(
  'all-tags/UPDATED',
);

export function getTags(state: IAppState): List<ITagModel> {
  return state.global.tags.items;
}

export function getTaggableTags(state: IAppState) {
  return List(getTags(state).filter((tag: ITagModel) => tag.isTaggable));
}

export interface ITagsState {
  items: List<ITagModel>;
}

const reducer = handleActions<Readonly<ITagsState>, List<ITagModel>>( {
  [tagsUpdated.toString()]: (_state, { payload }: Action<List<ITagModel>>) => ({items: payload}),
}, {
  items: List<ITagModel>(),
});

export { reducer };
