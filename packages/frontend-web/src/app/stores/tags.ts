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
import { Action, createAction } from 'redux-actions';
import { ITagModel } from '../../models';
import { listModels, makeAJAXAction, makeRecordListReducer, IRecordListStateRecord } from '../util';
import { IAppStateRecord, IThunkAction } from './index';

const STATE_ROOT = ['global', 'tags'];
const TAGS_DATA = [...STATE_ROOT, 'items'];
const TAGS_HAS_DATA = [...STATE_ROOT, 'hasData'];
const TAGS_LOADING_STATUS = [...STATE_ROOT, 'isFetching'];

type ILoadTagsStartPayload = void;
const loadTagsStart = createAction<ILoadTagsStartPayload>(
  'all-tags/LOAD_TAGS_START',
);
const loadTagsComplete = createAction<object>(
  'all-tags/LOAD_TAGS_COMPLETE',
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

export function getTagsIsLoading(state: IAppStateRecord): boolean {
  return state.getIn(TAGS_LOADING_STATUS);
}

export function loadTags(forceUpdate?: boolean): IThunkAction<Promise<List<ITagModel>>> {
  return async (dispatch, getState): Promise<List<ITagModel>> => {
    await dispatch(makeAJAXAction(
      () => listModels('tags', {
        page: { limit: -1 },
        filters: {
        },
      }),
      loadTagsStart,
      loadTagsComplete,
      (state: IAppStateRecord) => forceUpdate ? null : state.getIn(TAGS_HAS_DATA) && getTags(state),
    ));

    return getTags(getState());
  };
}

export type ITagsState = List<ITagModel>;

const recordListReducer = makeRecordListReducer<ITagModel>(
  loadTagsStart.toString(),
  loadTagsComplete.toString(),
);

const reducer: (state: IRecordListStateRecord<ITagModel>, action: Action<object|ITagModel>) => IRecordListStateRecord<ITagModel>
  = recordListReducer.reducer;

export { reducer };
