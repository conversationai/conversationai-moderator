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

import { List, Map, OrderedMap } from 'immutable';
import { throttle } from 'lodash';
import { Action, createAction, handleActions } from 'redux-actions';

import { IAppDispatch, IAppState, IThunkAction } from '../appstate';

let queuedModelStores = 0;

export type IQueuedResolver = (data?: any) => any;
export type IQueuedDescriptor<T> = [Promise<T>, IQueuedResolver];

export type IQueuedModelState<S, T> = Readonly <{
  queued: OrderedMap<S, IQueuedDescriptor<T>>;
  byKey: Map<S, T>;
}>;

export type ILoadCompletePayload<S, T> = {
  model: T;
  key: S;
};

export function makeQueuedModelStore<S, T>(
  getModelsByKey: (keys: List<S>) => Promise<Map<S, T>>,
  queueFlushThrottleMs: number,
  maxItems: number,
  getStateRecord: (state: IAppState) => IQueuedModelState<S, T>,
) {
  queuedModelStores += 1;

  const clearQueue: () => Action<void> = createAction(`global/CLEAR_QUEUED_MODEL_${queuedModelStores}`);

  type ICancelItemsPayload = {
    keys: List<S>;
  };
  const cancelItems: (payload: ICancelItemsPayload) => Action<ICancelItemsPayload> =
    createAction<ICancelItemsPayload>(`global/CANCEL_QUEUED_MODEL_${queuedModelStores}`);

  type IQueueRequestPayload = {
    key: S;
    promise: Promise<T>;
    resolver: IQueuedResolver;
  };
  const queueRequest: (payload: IQueueRequestPayload) => Action<IQueueRequestPayload> =
    createAction<IQueueRequestPayload>(`global/LOAD_QUEUED_MODEL_START_${queuedModelStores}`);

  const loadComplete: (payload: ILoadCompletePayload<S, T>) => Action<ILoadCompletePayload<S, T>> =
    createAction<ILoadCompletePayload<S, T>>(`global/LOAD_QUEUED_MODEL_COMPLETE_${queuedModelStores}`);

  const initialState = {
    queued: OrderedMap<S, IQueuedDescriptor<T>>(),
    byKey: Map<S, T>(),
  };

  function getModels(state: IAppState) {
    const localState = getStateRecord(state);
    return localState && localState.byKey;
  }

  function getQueued(state: IAppState) {
    const localState = getStateRecord(state);
    return localState && localState.queued;
  }

  function getModel(state: IAppState, key: S): T {
    return getModels(state).get(key);
  }

  function flushQueue(): IThunkAction<void> {
    return async (dispatch, getState): Promise<void> => {
      const state = getState();
      const queued = getQueued(state);

      const allKeys = queued.keySeq().toList();

      const queuedModelKeys = allKeys
          .reverse().slice(0, maxItems) as List<S>;

      const ignoredModelKeys = allKeys.filter((key) => !queuedModelKeys.includes(key)) as List<S>;

      ignoredModelKeys.forEach((key) => {
        const resolver = queued.get(key)[1];
        resolver(undefined);
      });

      dispatch(cancelItems({ keys: ignoredModelKeys }));

      const models = await getModelsByKey(queuedModelKeys);

      models.forEach((model: T, key: S) => {
        const resolver = queued.get(key)[1];

        resolver(model);

        dispatch(loadComplete({ key, model }));
      });
    };
  }

  const throttledFlushQueue = throttle((dispatch: IAppDispatch) => {
    dispatch(flushQueue());
  }, queueFlushThrottleMs);

  function loadModel(key: S): IThunkAction<Promise<T>> {
    return async (dispatch, getState): Promise<T> => {
      const state = getState();
      const loadedComments = getModels(state);
      const queued = getQueued(state);

      if (loadedComments.has(key)) {
        return loadedComments.get(key);
      }

      if (queued.has(key)) {
        const [ promise ] = queued.get(key);

        return await promise;
      }

      let resolver;
      const promise = new Promise<T>((r) => {
        resolver = r;
      });

      dispatch(queueRequest({ key, promise, resolver }));
      throttledFlushQueue(dispatch);

      return await promise;
    };
  }

  const reducer = handleActions<
    IQueuedModelState<S, T>,
    void                 | // clearQueue
    ICancelItemsPayload  | // cancelItems
    IQueueRequestPayload | // queueRequest
    ILoadCompletePayload<S, T>   // loadComplete
  >({
    [clearQueue.toString()]: (state: IQueuedModelState<S, T>) => ({
      ...state,
      queued: state.queued.clear(),
    }),

    [cancelItems.toString()]: (state: IQueuedModelState<S, T>, { payload: { keys } }: Action<ICancelItemsPayload>) => ({
      ...state,
      queued: keys.reduce((sum: OrderedMap<S, IQueuedDescriptor<T>>, key: S) => (sum.remove(key)), state.queued),
    }),

    [queueRequest.toString()]: (state, { payload }: Action<IQueueRequestPayload>) => {
      const { key, promise, resolver } = payload;
      return {
        ...state,
        queued: state.queued.remove(key).set(key, [promise, resolver]),
      };
    },

    [loadComplete.toString()]: (state, { payload }: Action<ILoadCompletePayload<S, T>>) => {
      const { key, model } = payload;
      return {
        queued: state.queued.remove(key),
        byKey: state.byKey.set(key, model),
      };
    },
  }, initialState);

  return {
    reducer,
    loadModel,
    getModel,
    getModels,
    setModel: loadComplete,
  };
}
