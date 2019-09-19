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
/**
 * This file provides the framework for the worker process.
 * This is designed to run long-duration background tasks,
 * e.g., synchronising with an external data source.
 *
 * It does 2 things:
 *  - Every ${WORKER_POLL_INTERVAL} it kicks into action and runs all registered tasks sequentially.
 *  - When a task set is running, it ensures that no new task sets are initiated.
 *
 * Each task item is passed the current tick count.  (Approximately the number of minutes that have
 * passed since the process started.)  It can use that to decide which tasks to run.
 *
 * To register a task item, create a suitable async function.  Then, within startWorker,  call
 * registerWorkItem with that function as an argument.
 *
 * Any process can call kickWorker to start the next tick immediately.  Pass "true" to this function
 * to reset the tick to 0.  This is used to indicate to the task items that all tasks should be run.
 */

import { createClient, RedisClient } from 'redis';
import { promisify } from 'util';

import { config } from '@conversationai/moderator-config';

import { logger } from '../logger';

// a minute in milliseconds
const WORK_POLL_INTERVAL = 60 * 1000;
const REDIS_WORK_TRIGGER_CHANNEL = 'work_trigger';
export type REDIS_WORK_TRIGGER_TYPE = 'kick' | 'start' | 'reset' | 'stop';

const redisClient: RedisClient = createClient(config.get('redis_url'));
const publish = promisify(redisClient.publish).bind(redisClient);

const workItems = new Map<string, (tick: number) => Promise<void>>();

export function registerWorkItem(itemName: string, item: (tick: number) => Promise<void>) {
  logger.info(`Registering work item ${itemName}`);
  workItems.set(itemName, item);
}

let tick = 0;
let lastTick: number | null = null;

async function processWorkItems() {
  if (lastTick !== null) {
    // Still actively processing
    return;
  }

  lastTick = -1;
  while (true) {
    if (tick === lastTick) {
      break;
    }

    logger.info(`Processing tick ${tick}.`);
    for (const i of workItems.values()) {
      await i(tick);
    }
    lastTick = tick;
  }

  lastTick = null;
}

let intervalId: NodeJS.Timer;

async function startWorking() {
  logger.info('Start processing ticks');
  intervalId = setInterval(() => {
    kickWorker('kick');
  }, WORK_POLL_INTERVAL);
}

async function stopWorking() {
  logger.info('Stop processing ticks');
  clearInterval(intervalId);
}

export async function startWorker() {
  const subscribeClient: RedisClient = createClient(config.get('redis_url'));
  const subscribe = promisify(subscribeClient.subscribe).bind(subscribeClient);
  subscribeClient.on('message', (_channel, message) => {
    switch (message as REDIS_WORK_TRIGGER_TYPE) {
      case 'start':
        startWorking();
        return;
      case 'stop':
        stopWorking();
        return;
      case 'reset':
        tick = 0;
    }
    processWorkItems();
    tick++;
  });
  await subscribe(REDIS_WORK_TRIGGER_CHANNEL);

  startWorking();
}

export async function kickWorker(type: REDIS_WORK_TRIGGER_TYPE) {
  publish(REDIS_WORK_TRIGGER_CHANNEL, type);
}

export async function runTask(task: string) {
  const item = workItems.get(task);
  if (item) {
    await item(0);
  }
}
