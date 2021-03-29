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

import {createClient, RedisClient} from 'redis';
import {promisify} from 'util';

import {config} from './config';
import {logger} from './logger';
import {publish} from './redis';

const REDIS_NOTIFICATION_CHANNEL = 'update-notification';

export interface INotificationData {
  objectType: NotificationObjectType;
  action?: NotificationAction;
  id?: number;
}

interface IInterestListener {
  processNotification(data: INotificationData): void;
}

let interested: Array<IInterestListener> = [];
let sendDirect = false;

export function setTestMode() {
  sendDirect = true;
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

export function processNotification(data: INotificationData) {
  for (const i of interested) {
    i.processNotification(data);
  }
}

export async function sendNotification(
  objectType: NotificationObjectType,
  action?: NotificationAction,
  id?: number,
) {
  const data: INotificationData = {objectType, action, id};
  if (sendDirect) {
    processNotification(data);
  } else {
    logger.info(`send notification: ${data.objectType} ${data.action || ''} ${data.id || ''}`);
    await publish(REDIS_NOTIFICATION_CHANNEL, JSON.stringify(data));
  }
}

let listening = false;
export async function receiveNotifications() {
  if (listening) {
    return;
  }
  const subscribeClient: RedisClient = createClient(config.get('redis_url'));
  const subscribe = promisify(subscribeClient.subscribe).bind(subscribeClient);
  subscribeClient.on('message', (_channel, message) => {
    const data = JSON.parse(message) as INotificationData;
    logger.info(`processing notification: ${data.objectType} ${data.action || ''} ${data.id || ''}`);
    processNotification(data);
  });
  listening = true;
  await subscribe(REDIS_NOTIFICATION_CHANNEL);
}

// TODO: Need to add an ID so clear can clear correct item.
//     But we only ever have one listener at the moment...
export function registerInterest(interestListener: IInterestListener) {
  interested.push(interestListener);
  if (!sendDirect) {
    receiveNotifications();
  }
}

export function clearInterested() {
  interested = [];
}
