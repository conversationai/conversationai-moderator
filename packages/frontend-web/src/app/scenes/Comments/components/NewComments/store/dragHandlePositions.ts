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

import { List, Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { TypedRecord } from 'typed-immutable-record';

import {
  IArticleModel,
  IPreselectModel,
  IRuleModel,
} from '../../../../../../models';
import {
  DEFAULT_DRAG_HANDLE_POS1,
  DEFAULT_DRAG_HANDLE_POS2,
} from '../../../../../config';
import { IAppStateRecord, IThunkAction } from '../../../../../stores';
import { getArticle } from '../../../../../stores/articles';
import { getPreselects } from '../../../../../stores/preselects';
import { getRules } from '../../../../../stores/rules';
import { DATA_PREFIX } from './reduxPrefix';

const DRAG_HANDLE_POSITIONS_DATA = [...DATA_PREFIX, 'dragHandlePositions'];

// Store functions for getting and setting batch view drag handle positions
type ISetDragHandlePositionsPayload = {
  pos1: number;
  pos2: number;
};

const setDragHandlePositions = createAction<ISetDragHandlePositionsPayload>('drag-handle/SET_POSITION');

type ISetDragHandleScopePayload = {
  scope: Map<any, any>;
};

const setDragHandleScope = createAction<ISetDragHandleScopePayload>('drag-handle/SET_SCOPE');
export const resetDragHandleScope: () => Action<void> = createAction('drag-handle/RESET_SCOPE');

export interface IDragHandleState {
  pos1: number | null;
  pos2: number | null;
  scope: Map<any, any>;
}

export interface IDragHandleStateRecord extends TypedRecord<IDragHandleStateRecord>, IDragHandleState {}

const initialDragHandleState = Map({
  pos1: null,
  pos2: null,
  scope: Map(),
}) as IDragHandleStateRecord;

const dragHandlePositionsReducer = handleActions<
  IDragHandleStateRecord,
  ISetDragHandlePositionsPayload | // setDragHandlePositions
  ISetDragHandleScopePayload     | // setDragHandleScope
  void                             // resetDragHandleScope
>({
  [setDragHandlePositions.toString()]: (state, { payload: { pos1, pos2 } }: Action<ISetDragHandlePositionsPayload>) => (
    state
        .set('pos1', pos1)
        .set('pos2', pos2)
  ),

  [setDragHandleScope.toString()]: (state, { payload: { scope } }: Action<ISetDragHandleScopePayload>) => state.set('scope', scope),
  [resetDragHandleScope.toString()]: () => initialDragHandleState,
}, initialDragHandleState);

function setDefaultDragHandlesIfScopeChange(pos1: number, pos2: number, scope: Map<string, any>): IThunkAction<{ pos1: number, pos2: number }> {
  return (dispatch, getState): { pos1: number, pos2: number } => {
    const state = getState();
    const currentScope = getDragHandlePositions(state).get('scope');
    if (currentScope.size === 0 && !!pos2 || scope.equals(currentScope) && !!pos2) {
      dispatch(setDragHandlePositions({ pos1, pos2 }));

      return { pos1, pos2 };
    }

    const article = scope.get('articleId') ? getArticle(state, scope.get('articleId')) : null;
    const preselects = getPreselectForCategory(article, getPreselects(state), scope.get('tagId'));
    const preselectPos1 = preselects ? preselects.lowerThreshold : DEFAULT_DRAG_HANDLE_POS1;
    const preselectPos2 = preselects ? preselects.upperThreshold : DEFAULT_DRAG_HANDLE_POS2;
    dispatch(setDragHandlePositions({pos1: preselectPos1, pos2: preselectPos2}));
    dispatch(setDragHandleScope({scope}));

    return { pos1: preselectPos1, pos2: preselectPos2 };
  };
}

function getDragHandlePositions(state: IAppStateRecord): Map<string, any> {
  return state.getIn(DRAG_HANDLE_POSITIONS_DATA);
}

function getDragHandlePosition1(state: IAppStateRecord): number {
  return getDragHandlePositions(state).get('pos1');
}

function getDragHandlePosition2(state: IAppStateRecord): number {
  return getDragHandlePositions(state).get('pos2');
}

function getPreselectForCategory(article: IArticleModel | null, preselects: List<IPreselectModel>, tagId: string): IPreselectModel | null {
  if (!article) {
    return null;
  }

  const categoryId = article ? article.category.id : null;

  let preselectsByCategory;
  const byCategoryId = (preselect: IPreselectModel) => preselect.categoryId === categoryId;
  if (preselects.find(byCategoryId)) {
    preselectsByCategory = preselects.filter(byCategoryId);
  } else {
    preselectsByCategory = preselects.filter((preselect) => preselect.categoryId === null);
  }

  if (!preselectsByCategory) {
    return null;
  }

  let preselectsByTag;
  const byTagId = (rule: IRuleModel) => rule.tagId === tagId;
  if (preselectsByCategory.find(byTagId)) {
    preselectsByTag = preselectsByCategory.filter(byTagId);
  } else {
    preselectsByTag = preselectsByCategory.filter((rule) => rule.tagId === null);
  }

  return preselectsByTag.first();
}

export function getRulesInCategory(state: IAppStateRecord, categoryId?: string, articleId?: string): List<IRuleModel> {
  const rules = getRules(state);

  if (categoryId) {
    if (categoryId === 'all') {
      return rules.filter((rule: IRuleModel) => rule.categoryId === null) as List<IRuleModel>;
    } else {
      categoryId = categoryId;
    }
  }
  else {
    const article = getArticle(state, articleId);
    categoryId = article.category.id;
  }

  return rules
      .filter((rule: IRuleModel) => rule.categoryId === categoryId || rule.categoryId === null) as List<IRuleModel>;
}

export {
  dragHandlePositionsReducer,
  setDefaultDragHandlesIfScopeChange,
  getDragHandlePositions,
  getDragHandlePosition1,
  getDragHandlePosition2,
};
