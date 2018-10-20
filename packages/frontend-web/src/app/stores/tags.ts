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
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';

import { ITagModel } from '../../models';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'tags'];
const TAGS_DATA = [...STATE_ROOT, 'items'];

export const tagsUpdated = createAction<object>(
  'all-tags/UPDATED',
);

export function getTags(state: IAppStateRecord): List<ITagModel> {
  return state.getIn(TAGS_DATA);
}

export function getTagsWithoutSummary(state: IAppStateRecord): List<ITagModel> {
  return state.getIn(TAGS_DATA).filter((tag: ITagModel) => tag.key !== 'SUMMARY_SCORE');
}

export function getTaggableTags(state: IAppStateRecord): List<ITagModel> {
  return state.getIn(TAGS_DATA).filter((tag: ITagModel) => tag.isTaggable);
}

export interface ITagsState {
  items: List<ITagModel>;
}

export interface ITagsStateRecord extends TypedRecord<ITagsStateRecord>, ITagsState {}

const StateFactory = makeTypedFactory<ITagsState, ITagsStateRecord>({
  items: List<ITagModel>(),
});

const reducer = handleActions<ITagsStateRecord, List<ITagModel>>( {
  [tagsUpdated.toString()]: (state: ITagsStateRecord, { payload }: Action<List<ITagModel>>) => {
    return (
      state
        .set('items', payload)
    );
  },
}, StateFactory());

export { reducer };
