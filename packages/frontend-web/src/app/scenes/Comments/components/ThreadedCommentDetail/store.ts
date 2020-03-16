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

import { combineReducers } from 'redux';
import { Action, createAction } from 'redux-actions';

import {
  ICommentModel,
} from '../../../../../models';
import { IAppDispatch, IAppState } from '../../../../appstate';
import { getComment as getCommentSvc } from '../../../../platform/dataService';
import {
  ISingleRecordState,
  makeSingleRecordReducer,
} from '../../../../util';

const loadCommentStart =
  createAction('threaded-comment-detail/LOAD_COMMENT_START');
const loadCommentComplete =
  createAction<object>('threaded-comment-detail/LOAD_COMMENT_COMPLETE');

export async function loadComment(dispatch: IAppDispatch, id: string) {
  await dispatch(loadCommentStart());
  const comment = await getCommentSvc(id, {include: ['replies']});
  await dispatch(loadCommentComplete(comment));
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

export type IThreadedCommentDetailState = Readonly<{
  comment: ISingleRecordState<ICommentModel>;
}>;

export const reducer = combineReducers<IThreadedCommentDetailState>({
  comment: commentReducer,
});

export function getComment(state: IAppState) {
  return state.scenes.comments.threadedCommentDetail.comment.item;
}

export function getIsLoading(state: IAppState) {
  return state.scenes.comments.threadedCommentDetail.comment.isFetching;
}
