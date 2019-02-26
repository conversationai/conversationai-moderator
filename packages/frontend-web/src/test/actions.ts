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

import { approveCommentsRequest } from '../app/platform/dataService';
import { articleData } from './notificationChecks';

export async function approveComment(commentId: string, userId: string) {
  const readyPromise = new Promise<void>((resolve) => {
    articleData.updateHappened = () => {
      resolve();
    };

    approveCommentsRequest([commentId], userId);
  });

  await readyPromise;
}
