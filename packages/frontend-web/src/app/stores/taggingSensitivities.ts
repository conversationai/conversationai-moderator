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

import { ITaggingSensitivityModel } from '../../models';
import { IAppStateRecord } from './index';

const STATE_ROOT = ['global', 'taggingSensitivities'];
const TAGGING_SENSITIVITIES_DATA = [...STATE_ROOT, 'items'];

export const taggingSensitivitiesUpdated = createAction(
  'all-taggingSensitivities/UPDATED',
);

export function getTaggingSensitivities(state: IAppStateRecord): List<ITaggingSensitivityModel> {
  return state.getIn(TAGGING_SENSITIVITIES_DATA);
}

export interface ITaggingSensitivitiesState {
  items: List<ITaggingSensitivityModel>;
}

export interface ITaggingSensitivitiesStateRecord extends TypedRecord<ITaggingSensitivitiesStateRecord>, ITaggingSensitivitiesState {}

const StateFactory = makeTypedFactory<ITaggingSensitivitiesState, ITaggingSensitivitiesStateRecord>({
  items: List<ITaggingSensitivityModel>(),
});

const reducer = handleActions<ITaggingSensitivitiesStateRecord, List<ITaggingSensitivityModel>>( {
  [taggingSensitivitiesUpdated.toString()]: (state: ITaggingSensitivitiesStateRecord, { payload }: Action<List<ITaggingSensitivityModel>>) => {
    return (
      state
        .set('items', payload)
    );
  },
}, StateFactory());

export { reducer };
