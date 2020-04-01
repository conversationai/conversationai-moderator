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

import { List, Map as IMap} from 'immutable';
import { omit } from 'lodash';
import { Action, createAction, handleActions } from 'redux-actions';

import { ICommentModel, ModelId } from '../../models';
import { IAppDispatch, IAppState, IThunkAction } from '../appstate';
import { getComments } from '../platform/dataService';
import { ILoadCompletePayload, IQueuedModelState, makeQueuedModelStore } from '../util';

const queueModelStore = makeQueuedModelStore<string, ICommentModel>(
  async (commentIds: List<string>) => {
    const comments = await getComments(commentIds.toArray());

    return comments.reduce((sum: IMap<string, ICommentModel>, comment: ICommentModel) => {
      return sum.set(comment.id, comment);
    }, IMap<string, ICommentModel>());
  },
  300,
  12,
  (state: IAppState) => state.global.comments,
);

const {
  reducer,
  loadModel: loadComment,
} = queueModelStore;

const getComment: (state: IAppState, key: string) => ICommentModel = queueModelStore.getModel;
const setComment: (payload: ILoadCompletePayload<string, ICommentModel>) => Action<ILoadCompletePayload<string, ICommentModel>> = queueModelStore.setModel;

export type ICommentsState = IQueuedModelState<string, ICommentModel>;

async function updateComment(dispatch: IAppDispatch, comment: ICommentModel) {
  await dispatch(setComment({ key: comment.id, model: comment }));
}

function approveComment(commentIds: Array<string>): IThunkAction<void> {
  return async (dispatch, getState) => {
    const state = getState();
    commentIds.forEach((commentId) => {
      const comment = getComment(state,  commentId);
      if (!comment) {
        return;
      }
      const updatedComment = {
        ...comment,
        isAccepted: true,
        isModerated: true,
        isDeferred: false,
        updatedAt: new Date().toISOString(),
      };

      dispatch(setComment({ key: commentId, model: updatedComment }));
    });
  };
}

function highlightComment(commentIds: Array<string>): IThunkAction<void> {
  return async (dispatch, getState) => {
    const state = getState();
    commentIds.forEach((commentId) => {
      const comment = getComment(state,  commentId);
      if (!comment) {
        return;
      }
      const updatedComment = {
        ...comment,
        isAccepted: true,
        isHighlighted: true,
        updatedAt: new Date().toString(),
      };

      dispatch(setComment({ key: commentId, model: updatedComment }));
    });
  };
}

function rejectComment(commentIds: Array<string>): IThunkAction<void> {
  return async (dispatch, getState) => {
    const state = getState();
    commentIds.forEach((commentId) => {
      const comment = getComment(state,  commentId);
      if (!comment) {
        return;
      }
      const updatedComment = {
        ...comment,
        isAccepted: false,
        isModerated: true,
        isDeferred: false,
      };

      dispatch(setComment({ key: commentId, model: updatedComment }));
    });
  };
}

function deferComment(commentIds: Array<string>): IThunkAction<void> {
  return async (dispatch, getState) => {
    const state = getState();
    commentIds.forEach((commentId) => {
      const comment = getComment(state,  commentId);
      if (!comment) {
        return;
      }
      const updatedComment = omit({
        ...comment,
        isModerated: true,
        isDeferred: true,
        updatedAt: new Date().toISOString(),
      }, 'isAccepted');

      dispatch(setComment({ key: commentId, model: updatedComment }));
    });
  };
}

function resetComment(commentIds: Array<string>): IThunkAction<void> {
  return async (dispatch, getState) => {
    const state = getState();
    commentIds.forEach((commentId) => {
      const comment = getComment(state,  commentId);
      if (!comment) {
        return;
      }
      const updatedComment = omit({
        ...comment,
        isModerated: false,
        isHighlighted: false,
        isDeferred: false,
        updatedAt: new Date().toISOString(),
      }, 'isAccepted');

      dispatch(setComment({ key: commentId, model: updatedComment }));
    });
  };
}

export {
  reducer,
  loadComment,
  getComment,
  setComment,
  approveComment,
  highlightComment,
  rejectComment,
  updateComment,
  deferComment,
  resetComment,
};

export const commentsUpdated = createAction<Array<ICommentModel>>('global/COMMENTS_UPDATED');

export interface INewCommentsState {
  index: Map<ModelId, ICommentModel>;
}

export const newReducer = handleActions<Readonly<INewCommentsState>, Array<ICommentModel>>( {
  [commentsUpdated.toString()]: (state, { payload }: Action<Array<ICommentModel>>) => {
    const index = state.index;
    for (const comment of payload) {
      index.set(comment.id, comment);
    }
    return {index};
  },
}, {index: new Map()});
