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
import { IAppDispatch, IAppStateRecord } from '../../../../appstate';
import { getModel } from '../../../../platform/dataService';
import {
  ISingleRecordState,
  makeSingleRecordReducer,
} from '../../../../util';

const COMMENT_DATA = ['scenes', 'commentsIndex', 'threadedCommentDetail', 'comment'];

const loadCommentStart =
  createAction('threaded-comment-detail/LOAD_COMMENT_START');
const loadCommentComplete =
  createAction<object>('threaded-comment-detail/LOAD_COMMENT_COMPLETE');

export async function loadComment(dispatch: IAppDispatch, id: string) {
  await dispatch(loadCommentStart());
  const result = await getModel('comments', id, {include: ['replies']});
  const data = result.response;
  await dispatch(loadCommentComplete(data));
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

export function getComment(state: IAppStateRecord) {
  const commentRecord = state.getIn(COMMENT_DATA) as ISingleRecordState<ICommentModel>;
  return commentRecord && commentRecord.item;
}

export function getIsLoading(state: IAppStateRecord) {
  const commentRecord = state.getIn(COMMENT_DATA) as ISingleRecordState<ICommentModel>;
  return commentRecord && commentRecord.isFetching;
}
