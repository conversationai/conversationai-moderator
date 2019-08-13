/*
Copyright 2019 Google Inc.

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

import { combineReducers } from 'redux-immutable';

import { WebsocketStates } from '../../types';
import { logout } from '../auth';
import { connectNotifier, STATUS_RESET, STATUS_UP } from '../platform/websocketService';
import { IAppDispatch, IAppStateRecord } from './appstate';
import { articlesLoaded, articlesUpdated, reducer as articleReducer } from './articles';
import { categoriesLoaded, categoriesUpdated, reducer as categoriesReducer } from './categories';
import { reducer as columnSortsReducer } from './columnSorts';
import { reducer as commentsReducer } from './comments';
import { reducer as commentSummaryScoresReducer } from './commentSummaryScores';
import { assignmentCountUpdated } from './counts';
import { reducer as focusReducer } from './focus';
import { preselectsUpdated, reducer as preselectsReducer } from './preselects';
import { reducer as rulesReducer, rulesUpdated } from './rules';
import {
  reducer as taggingSensitivitiesReducer,
  taggingSensitivitiesUpdated,
} from './taggingSensitivities';
import { reducer as tagsReducer, tagsUpdated } from './tags';
import { reducer as textSizesReducer } from './textSizes';
import {
  scoreReducer as topScoresReducer,
  summaryScoreReducer as topSummaryScoresReducer,
} from './topScores';
import { reducer as usersReducer, usersUpdated } from './users';

export { IAppDispatch, IAppState, IAppStateRecord, IThunkAction } from './appstate';

export const reducer: any = combineReducers<IAppStateRecord>({
  categories: categoriesReducer,
  articles: articleReducer,
  comments: commentsReducer,
  commentSummaryScores: commentSummaryScoresReducer,
  users: usersReducer,
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

export async function initialiseClientModel(
  dispatch: IAppDispatch,
  setState: (state: WebsocketStates) => void,
) {
  setState('ws_connecting');
  connectNotifier(
    (status: string) => {
      if (status === STATUS_UP) {
        setState('ws_gtg');
      }
      else {
        setState('ws_connecting');
        if (status === STATUS_RESET) {
          dispatch(logout());
        }
      }
    },
    (data) => {
      dispatch(usersUpdated(data.users));
      dispatch(tagsUpdated(data.tags));
      dispatch(taggingSensitivitiesUpdated(data.taggingSensitivities));
      dispatch(rulesUpdated(data.rules));
      dispatch(preselectsUpdated(data.preselects));
    },
    (data) => {
      dispatch(categoriesLoaded(data.categories));
      dispatch(articlesLoaded(data.articles));
    },
    (data) => {
      if (data.categories) {
        dispatch(categoriesUpdated(data.categories));
      }
      if (data.articles) {
        dispatch(articlesUpdated(data.articles));
      }
    },
    (data) => {
      dispatch(assignmentCountUpdated(data.assignments));
    },
  );
}
