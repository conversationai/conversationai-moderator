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

import { fromJS, List, Map } from 'immutable';
import { Action, createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';

import { IMultipleResponse } from '../platform/dataService';
import { IAppDispatch, IAppStateRecord, IThunkAction } from '../stores';
import { makeAJAXAction } from './makeAJAXAction';
import { convertArrayFromJSONAPI } from './makeRecordListReducer';

let pagedRecordListStores = 0;

export interface ISinglePageState<T> {
  hasData: false;
  isFetching: false;
  items: List<T>;
}

export interface ISinglePageStateRecord<T> extends TypedRecord<ISinglePageStateRecord<T>>, ISinglePageState<T> {}

export interface IPagedRecordState<T, S> {
  hasData: boolean;
  scope: null | S;
  isFetching: boolean;
  totalItems: number;
  pages: Map<number, ISinglePageStateRecord<T>>;
  perPage: number;
}

export interface IPagedRecordStateRecord<T, S> extends TypedRecord<IPagedRecordStateRecord<T, S>>, IPagedRecordState<T, S> {}

// Return will be infered
export function makePagedRecordStore<T extends { id: string; }, S extends Map<any, any>>(
  statePath: Array<string>,
  perPage: number,
  getURL: (scope: null | S, page: number, getState: () => IAppStateRecord, dispatch: any) => Promise<IMultipleResponse<T>>,
  onStart?: (dispatch: IAppDispatch) => any,
  onEnd?: (dispatch: IAppDispatch, payload: any) => any,
) {
  pagedRecordListStores += 1;

  const pageStatePath = [...statePath, 'pages'];
  const totalItemsPath = [...statePath, 'totalItems'];
  const isFetchingPath = [...statePath, 'isFetching'];
  const hasDataPath = [...statePath, 'hasData'];
  const scopePath = [...statePath, 'scope'];

  type IChangeScopeStatePayload = {
    scope: null | S;
  };
  const changeScopeState = createAction<IChangeScopeStatePayload>(
    `paged-record-store-${pagedRecordListStores}/CHANGE_SCOPE_STATE`,
  );

  type IInternalStartPayload = {
    page: number;
  };
  const internalStartEvent = createAction<IInternalStartPayload>(
    `paged-record-store-${pagedRecordListStores}/START`,
  );

  type IInternalEndPayload = {
    page: number;
    data: Array<object>;
    included?: Array<object>;
    total: number;
  };
  const internalEndEvent = createAction<IInternalEndPayload>(
    `paged-record-store-${pagedRecordListStores}/END`,
  );

  type IRemoveItemsEventPayload = Array<string>;
  const removeItemsEvent = createAction<IRemoveItemsEventPayload>(
    `paged-record-store-${pagedRecordListStores}/REMOVE_ITEM`,
  ) as any;

  const StateFactory = makeTypedFactory<IPagedRecordState<T, S>, IPagedRecordStateRecord<T, S>>({
    hasData: false,
    scope: null,
    isFetching: false,
    totalItems: 0,
    pages: Map<number, ISinglePageStateRecord<T>>(),
    perPage,
  });

  const initialState = StateFactory();

  function isScopeDifferent(a: S, b: S): boolean {
    if (
      (('number' === typeof a) || ('number' === typeof b)) ||
      (('string' === typeof a) || ('string' === typeof b)) ||
      ((a === null) || (b === null))
    ) {
      return a !== b;
    }

    return !a.equals(b);
  }

  const reducer = handleActions<
    IPagedRecordStateRecord<T, S>,
    IChangeScopeStatePayload | // changeScopeState
    IInternalStartPayload    | // internalStartEvent
    IInternalEndPayload      | // internalEndEvent
    IRemoveItemsEventPayload   // removeItemsEvent
  >({
    [changeScopeState.toString()]: (state, { payload: { scope } }: Action<IChangeScopeStatePayload>) => {
      const cleanScope = (scope && 'function' === typeof scope.toJS)
          ? scope.toJS()
          : scope;

      const immutableScope = fromJS(cleanScope);

      if (immutableScope.equals(state.get('scope'))) {
        return state;
      }

      return initialState
          .set('scope', immutableScope)
          .set('hasData', false);
    },

    [internalStartEvent.toString()]: (state, { payload: { page } }: Action<IInternalStartPayload>) => (
      state.setIn(['pages', page, 'isFetching'], true)
    ),

    [internalEndEvent.toString()]: (state, { payload }: Action<IInternalEndPayload>) => {
      const { page, data, included, total } = payload;
      return state
          .set('totalItems', total)
          .set('isFetching', false)
          .set('hasData', true)
          .setIn(['pages', page, 'hasData'], true)
          .setIn(['pages', page, 'isFetching'], false)
          .setIn(['pages', page, 'items'], convertArrayFromJSONAPI<T>(
            fromJS({ data, included }),
          ));
    },

    [removeItemsEvent.toString()]: (state, { payload }: Action<IRemoveItemsEventPayload>) => {
      const pages = state.get('pages');
      const totalItems = state.get('totalItems');
      const newPages = pages.map((page: ISinglePageStateRecord<T>) => (
        page.set('items', page.get('items').filter((item: T) => payload.indexOf(item.id) === -1))
      ));

      return state
          .set('pages', newPages)
          .set('totalItems', totalItems - payload.length);
    },
  }, initialState);

  let loadingPromises: {
    [key: string]: Promise<any>;
  } = {};

  function changeScope(scope: S, onBeforeChange?: () => any): IThunkAction<Promise<boolean>> {
    return async (dispatch, getState): Promise<boolean> => {
      const state = getState();

      const cleanScope = (scope && 'function' === typeof scope.toJS)
          ? scope.toJS()
          : scope;

      const immutableScope = fromJS(cleanScope);

      const hasScopeChanged =
          isScopeDifferent(state.getIn([...statePath, 'scope']), immutableScope);

      if (hasScopeChanged) {
        loadingPromises = {};

        if (onBeforeChange) {
          onBeforeChange();
        }
        await dispatch(changeScopeState({ scope: cleanScope }));
        await dispatch(loadPage(0));

        return true;
      }

      return false;
    };
  }

  function loadIndex(index: number): IThunkAction<void> {
    return async (dispatch, getState) => {
      const state = getState();

      const pageNumber = Math.floor(index / perPage);
      const pageData = state.getIn([...pageStatePath, pageNumber]);
      if (pageData &&
          pageData.get('hasData') &&
          !pageData.get('isFetching')) {
        return Promise.resolve();
      } else {
        return dispatch(loadPage(pageNumber));
      }
    };
  }

  function onLoadComplete(page: number, options: any) {
    const {
      data,
      included,
      meta: { page: { total }, topScores, allCommentIds },
    } = options;

    return {
      page,
      data,
      included,
      total,
      topScores,
      allCommentIds,
    };
  }

  function loadPage(page: number): IThunkAction<Promise<void>> {
    return async (dispatch, getState): Promise<any> => {
      const key = page.toString();

      const state = getState();
      const scope = state.getIn([...statePath, 'scope']);

      if (loadingPromises[key]) {
        return loadingPromises[key];
      }

      const promise = getURL(scope, page, getState, dispatch);
      const urlGetter = () => promise;

      const action = makeAJAXAction(
        urlGetter,
        internalStartEvent.bind(null, { page }),
        (res) => {
          const payload = onLoadComplete(page, res);

          if (onEnd) {
            onEnd(dispatch, payload);
          }

          return dispatch(internalEndEvent(payload));
        },
      );

      loadingPromises[key] = dispatch(action);

      if (onStart) {
        onStart(dispatch);
      }

      // Clear cache
      loadingPromises[key].then(() => delete loadingPromises[key]);

      await loadingPromises[key];
    };
  }

  function removeItems(ids: Array<number>): IThunkAction<void> {
    return async (dispatch): Promise<void> =>
        dispatch(removeItemsEvent(ids));
  }

  function getTotalItems(state: IAppStateRecord): number {
    return state.getIn(totalItemsPath);
  }

  function getIsFetching(state: IAppStateRecord): boolean {
    return state.getIn(isFetchingPath);
  }

  function getHasData(state: IAppStateRecord): boolean {
    return state.getIn(hasDataPath);
  }

  function getScope(state: IAppStateRecord): S {
    return state.getIn(scopePath);
  }

  return {
    reducer,
    loadIndex,
    loadPage,
    changeScope,
    getTotalItems,
    getIsFetching,
    getHasData,
    getScope,
    removeItems,
  };
}
