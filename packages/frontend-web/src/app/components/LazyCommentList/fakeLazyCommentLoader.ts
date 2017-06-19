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

import { fakeCommentModel } from '../../../models/fake';

export function fakeLazyCommentLoader(rowsLength: number): any {
  const data: any = [];
  const currentlyLoading: any = {};

  for (let i = 0; i < rowsLength; i++) {
    data.push({
      id: i.toString(),
      type: 'comments',
      hasLoaded: false,
      model: null,
    });
  }

  function getCommentForRow(idx: number): any {
    return data[idx];
  }

  function startLoading(idx: number): Promise<string> {
    const currentData = getCommentForRow(idx);

    if (currentData && currentData.hasLoaded) {
      return Promise.resolve(data[idx].id);
    }

    const currentPromise = currentlyLoading[idx];

    if ('undefined' !== typeof currentPromise) {
      return currentPromise;
    }

    currentlyLoading[idx] = new Promise((resolve) => {
      setTimeout(() => {
        delete currentlyLoading[idx];

        data[idx].hasLoaded = true;
        data[idx].model = fakeCommentModel();

        resolve(data[idx].id);
      }, 600);
    });

    return currentlyLoading[idx];
  }

  return {
    data,
    getCommentForRow,
    startLoading,
  };
}
