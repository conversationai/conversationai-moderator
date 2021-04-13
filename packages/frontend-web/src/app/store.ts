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

import { applyMiddleware, combineReducers, compose, createStore, Store } from 'redux';
import thunk from 'redux-thunk';

import { reducer as scenesReducer } from './scenes/store';
import { reducer as globalReducer } from './stores';

export const reducers = combineReducers({
  scenes: scenesReducer,
  global: globalReducer,
});
export const store = createStore(
  reducers,
  {},
  compose(
    applyMiddleware(thunk),
    // TODO: Make this toggle based on environment
    // (window as any)['devToolsExtension'] ? (window as any)['devToolsExtension']() : (f: any) => f,
  ),
) as Store;
