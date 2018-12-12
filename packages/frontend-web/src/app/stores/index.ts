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

import { Action as RootAction, Dispatch as ReduxDispatch } from 'redux';
import { Action, createAction, handleActions } from 'redux-actions';
import { combineReducers } from 'redux-immutable';
import { makeTypedFactory, TypedRecord } from 'typed-immutable-record';

import { logout } from '../auth';
import { connectNotifier, STATUS_RESET, STATUS_UP } from '../platform/dataService';
import { IArticleModeratorsStateRecord, reducer as articleModeratorsReducer } from './articleModerators';
import { articlesUpdated, IArticlesState, reducer as articleReducer } from './articles';
import { categoriesUpdated, ICategoriesState, reducer as categoriesReducer } from './categories';
import { assignmentCountUpdated, deferredCountUpdated } from './categories';
import { ICategoryModeratorsStateRecord , reducer as categoryModeratorsReducer } from './categoryModerators';
import { IColumnSortStateRecord, reducer as columnSortsReducer } from './columnSorts';
import { IState as ICommentsState, reducer as commentsReducer } from './comments';
import { ICommentSummaryScoresStateRecord, reducer as commentSummaryScoresReducer } from './commentSummaryScores';
import { IFocusStateRecord, reducer as focusReducer } from './focus';
import { IModeratorsStateRecord, reducer as moderatorsReducer } from './moderators';
import { IPreselectsStateRecord, preselectsUpdated, reducer as preselectsReducer } from './preselects';
import { IRulesStateRecord, reducer as rulesReducer, rulesUpdated } from './rules';
import {
  ITaggingSensitivitiesStateRecord,
  reducer as taggingSensitivitiesReducer,
  taggingSensitivitiesUpdated,
} from './taggingSensitivities';
import { ITagsStateRecord, reducer as tagsReducer, tagsUpdated } from './tags';
import { ITextSizesStateRecord, reducer as textSizesReducer } from './textSizes';
import { IState as ITopScoresState, ISummaryState as ITopSummaryScoresState, scoreReducer as topScoresReducer, summaryScoreReducer as topSummaryScoresReducer } from './topScores';
import { IUsersState, reducer as usersReducer, usersUpdated } from './users';

export interface IWebsocketState {
  isActive: boolean;
}

interface IWebsocketStateRecord extends TypedRecord<IWebsocketStateRecord>, IWebsocketState {}

export interface IAppState {
  websocketState: IWebsocketState;
  categories: ICategoriesState;
  articles: IArticlesState;
  comments: ICommentsState;
  commentSummaryScores: ICommentSummaryScoresStateRecord;
  users: IUsersState;
  moderators: IModeratorsStateRecord;
  articleModerators: IArticleModeratorsStateRecord;
  categoryModerators: ICategoryModeratorsStateRecord;
  tags: ITagsStateRecord;
  rules: IRulesStateRecord;
  preselects: IPreselectsStateRecord;
  taggingSensitivities: ITaggingSensitivitiesStateRecord;
  focus: IFocusStateRecord;
  columnSorts: IColumnSortStateRecord;
  textSizes: ITextSizesStateRecord;
  topScores: ITopScoresState;
  topSummaryScores: ITopSummaryScoresState;
}

export interface IAppStateRecord extends TypedRecord<IAppStateRecord>, IAppState {}

export type IThunkAction<R> = (dispatch: ReduxDispatch<IAppStateRecord>, getState: () => IAppStateRecord) => R;
export type IAction<T> = IThunkAction<T> | RootAction;

export interface IAppDispatch {
  <R>(action: IAction<R>): R;
}

// tslint:disable interface-name
declare module 'redux' {
  export interface Dispatch<S> {
    <R>(action: IAction<R>): R;
  }
}
// tslint:enable interface-name

const WebsocketStateFactory = makeTypedFactory<IWebsocketState, IWebsocketStateRecord>({
  isActive: false,
});

const websocketStateUpdated = createAction<boolean>('global/WEBSOCKET_STATE_CHANGE');

const websocketStateReducer = handleActions<IWebsocketState, boolean>( {
  [websocketStateUpdated.toString()]: (state: IWebsocketStateRecord, { payload }: Action<boolean>) => {
    return (
      state
        .set('isActive', payload)
    );
  },
}, WebsocketStateFactory());

export const reducer: any = combineReducers<IAppStateRecord>({
  websocketState: websocketStateReducer,
  categories: categoriesReducer,
  articles: articleReducer,
  comments: commentsReducer,
  commentSummaryScores: commentSummaryScoresReducer,
  users: usersReducer,
  moderators: moderatorsReducer,
  articleModerators: articleModeratorsReducer,
  categoryModerators: categoryModeratorsReducer,
  tags: tagsReducer,
  rules: rulesReducer,
  preselects: preselectsReducer,
  taggingSensitivities: taggingSensitivitiesReducer,
  focus: focusReducer,
  columnSorts: columnSortsReducer,
  textSizes: textSizesReducer,
  topScores: topScoresReducer,
  topSummaryScores: topSummaryScoresReducer,
});

export async function initialiseClientModel(dispatch: IAppDispatch) {
  connectNotifier(
    (status: string) => {
      if (status === STATUS_UP) {
        dispatch(websocketStateUpdated(true));
      }
      else {
        dispatch(websocketStateUpdated(false));
        if (status === STATUS_RESET) {
          dispatch(logout());
        }
      }
    },
    (data) => {
      dispatch(tagsUpdated(data.tags));
      dispatch(taggingSensitivitiesUpdated(data.taggingSensitivities));
      dispatch(rulesUpdated(data.rules));
      dispatch(preselectsUpdated(data.preselects));
    },
    (data) => {
      dispatch(deferredCountUpdated(data.deferred));
      dispatch(usersUpdated(data.users));
      dispatch(categoriesUpdated(data.categories));
      dispatch(articlesUpdated(data.articles));
    },
    (data) => {
      dispatch(assignmentCountUpdated(data.assignments));
    },
  );
}

export function getWebsocketState(state: IAppStateRecord): boolean {
  return state.getIn(['global', 'websocketState', 'isActive']);
}
