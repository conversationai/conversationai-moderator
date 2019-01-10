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

import { Action, createAction } from 'redux-actions';
import { combineReducers } from 'redux-immutable';
import {
  ICommentModel,
} from '../../../../../models';
import { getModel } from '../../../../platform/dataService';
import { IAppStateRecord, IThunkAction } from '../../../../stores';
import {
  makeAJAXAction,
  makeSingleRecordReducer,
} from '../../../../util';

const DATA_PREFIX = ['scenes', 'commentsIndex', 'threadedCommentDetail', 'comment'];
const COMMENT_DATA = [...DATA_PREFIX, 'item'];
const LOADING_STATUS = [...DATA_PREFIX, 'isFetching'];

const loadCommentStart =
  createAction('threaded-comment-detail/LOAD_COMMENT_START');
const loadCommentComplete =
  createAction<object>('threaded-comment-detail/LOAD_COMMENT_COMPLETE');

export function loadComment(id: string): IThunkAction<void> {
  return makeAJAXAction(
    () => getModel('comments', id, { include: ['replies'] }),
    loadCommentStart,
    loadCommentComplete,
  );
}

// need to make an update replies store thinger

const {
  reducer: commentReducer,
  updateRecord: updateCommentRecord,
} = makeSingleRecordReducer<ICommentModel>(
  loadCommentStart.toString(),
  loadCommentComplete.toString(),
);

export const updateComment: (payload: ICommentModel) => Action<ICommentModel> = updateCommentRecord;

export const reducer: any = combineReducers({
  comment: commentReducer,
});

export function getComment(state: IAppStateRecord): ICommentModel {
  return state.getIn(COMMENT_DATA);
}

export function getIsLoading(state: IAppStateRecord): boolean {
  return state.getIn(LOADING_STATUS);
}
