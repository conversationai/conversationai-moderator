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
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { IAppDispatch, IAppStateRecord, IThunkAction } from '../stores';

let queuedModelStores = 0;

export type IQueuedResolver = (data?: any) => any;
export type IQueuedDescriptor<T> = [Promise<T>, IQueuedResolver];

export interface IQueuedModelState<S, T> {
  isFetching: boolean;
  queued: OrderedMap<S, IQueuedDescriptor<T>>;
  byKey: Map<S, T>;
}

export interface IQueuedModelStateRecord<S, T> extends TypedRecord<IQueuedModelStateRecord<S, T>>, IQueuedModelState<S, T> {}

export type ILoadCompletePayload<S, T> = {
  model: T;
  key: S;
};

export function makeQueuedModelStore<S, T>(
  getModelsByKey: (keys: List<S>) => Promise<Map<S, T>>,
  queueFlushThrottleMs: number,
  maxItems: number,
  dataPrefix: Array<string>,
) {
  queuedModelStores += 1;

  const byKeyData = [...dataPrefix, 'byKey'];
  const currentlyLoadingData = [...dataPrefix, 'queued'];

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

  const StateFactory = makeTypedFactory<IQueuedModelState<S, T>, IQueuedModelStateRecord<S, T>>({
    isFetching: false,
    queued: OrderedMap<S, IQueuedDescriptor<T>>(),
    byKey: Map<S, T>(),
  });

  function getModels(state: IAppStateRecord): Map<S, T> {
    return state.getIn(byKeyData);
  }

  function getQueued(state: IAppStateRecord): Map<S, IQueuedDescriptor<T>> {
    return state.getIn(currentlyLoadingData);
  }

  function getModel(state: IAppStateRecord, key: S): T {
    return getModels(state).get(key);
  }

  function flushQueue(): IThunkAction<void> {
    return async (dispatch, getState): Promise<void> => {
      const state = getState();
      const queued = getQueued(state);

      const allKeys = queued.keySeq().toList();

      const queuedModelKeys = allKeys
          .reverse().slice(0, maxItems) as List<S>;

      const ignoredModelKeys = allKeys.filter((key) => !queuedModelKeys.includes(key));

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
    IQueuedModelStateRecord<S, T>,
    void                 | // clearQueue
    ICancelItemsPayload  | // cancelItems
    IQueueRequestPayload | // queueRequest
    ILoadCompletePayload<S, T>   // loadComplete
  >({
    [clearQueue.toString()]: (state: IQueuedModelStateRecord<S, T>) => (
      state
          .set('isFetching', false)
          .update('queued', (q: any) => q.clear())
    ),

    [cancelItems.toString()]: (state: IQueuedModelStateRecord<S, T>, { payload: { keys } }: { payload: ICancelItemsPayload }) => {
      return state.update('queued', (queued: any) => {
        return keys.reduce((sum: any, key: S) => {
          return sum.remove(key);
        }, queued);
      });
    },

    [queueRequest.toString()]: (state, { payload: { key, promise, resolver } }: { payload: IQueueRequestPayload }) => (
      state
          .set('isFetching', true)
          .removeIn(['queued', key])
          .setIn(['queued', key], [promise, resolver])
    ),

    [loadComplete.toString()]: (state, { payload: { model, key } }: { payload: ILoadCompletePayload<S, T> }) => (
      state
          .removeIn(['queued', key])
          .setIn(['byKey', key], model)
    ),
  }, StateFactory());

  return {
    reducer,
    loadModel,
    getModel,
    getModels,
    setModel: loadComplete,
  };
}
