/*
Copyright 2021 Google Inc.

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

import {getInstance, testLocalUpdate, updateLastUpdate} from './models';

interface IInterestListener {
  updateHappened(): Promise<void>;
  partialUpdateHappened(articleId: number): Promise<void>;
}

let interested: Array<IInterestListener> = [];
let intervalHandle: NodeJS.Timer|null = null;

async function partialUpdateHappened(articleId: number) {
  await updateLastUpdate();
  for (const i of interested) {
    await i.partialUpdateHappened(articleId);
  }
}

async function updateHappened() {
  await updateLastUpdate();
  for (const i of interested) {
    await i.updateHappened();
  }
}

export type NotificationObjectType = 'global' | 'category' | 'article' | 'user' | 'comment';
export type NotificationAction = 'create' | 'modify' | 'delete';

export function createSendNotificationHook<T>(
  objectType: NotificationObjectType,
  action: NotificationAction,
  selector: (items: T) => number,
) {
  return async (items: T) => {
    const id = selector(items);
    await sendNotification(objectType, action, id);
  };
}

export async function sendNotification(
  objectType: NotificationObjectType,
  _action?: NotificationAction,
  id?: number | undefined,
) {
  if (objectType === 'article') {
    await partialUpdateHappened(id!);
  } else {
    await updateHappened();
  }
}

export function registerInterest(interestListener: IInterestListener, testing = false) {
  if (!testing && !intervalHandle) {
    // Poll every minute
    intervalHandle = setInterval(maybeNotifyInterested, 60000);
  }

  interested.push(interestListener);
}

export async function maybeNotifyInterested() {
  const instance = await getInstance();
  const lastUpdate = instance.lastUpdate;
  if (testLocalUpdate(lastUpdate)) {
    for (const i of interested) {
      i.updateHappened();
    }
  }
}

export async function clearInterested() {
  interested = [];
  if (intervalHandle) {
    clearInterval(intervalHandle);
  }
}
