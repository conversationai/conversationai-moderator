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

import { IAppStateRecord, IThunkAction } from '../stores';

export interface IDataGetter {
  (): Promise<{ response: object }>;
}

export function makeAJAXAction(
  urlOrGetter: IDataGetter,
  startAction: () => any,
  endAction: (data: any) => any,
  fromCache?: (state: IAppStateRecord) => any,
): IThunkAction<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();

    const cached = fromCache && fromCache(state);

    if (cached) {
      return;
    }

    await dispatch(startAction());

    const result = await urlOrGetter();
    const data = result.response;

    await dispatch(endAction(data));
  };
}
