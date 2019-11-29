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

import { IAppStateRecord } from './appstate';
import { reducer as articleReducer } from './articles';
import { reducer as categoriesReducer } from './categories';
import { reducer as commentsReducer } from './comments';
import { reducer as commentSummaryScoresReducer } from './commentSummaryScores';
import { reducer as focusReducer } from './focus';
import { reducer as preselectsReducer } from './preselects';
import { reducer as rulesReducer } from './rules';
import { reducer as taggingSensitivitiesReducer } from './taggingSensitivities';
import { reducer as tagsReducer } from './tags';
import { reducer as textSizesReducer } from './textSizes';
import {
  scoreReducer as topScoresReducer,
  summaryScoreReducer as topSummaryScoresReducer,
} from './topScores';
import { reducer as usersReducer } from './users';

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
  textSizes: textSizesReducer,
  topScores: topScoresReducer,
  topSummaryScores: topSummaryScoresReducer,
});
