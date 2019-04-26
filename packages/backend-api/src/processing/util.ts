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

import { logger } from '@conversationai/moderator-backend-core';
import { config } from '@conversationai/moderator-config';
import { createQueue, Job, Queue } from 'kue';

export type IKnownTasks = (
  'processMachineScore' |
  'heartbeat' |
  'processTagAddition' |
  'processTagRevocation' |
  'sendCommentForScoring' |
  'deferComments' |
  'highlightComments' |
  'tagComments' |
  'tagCommentSummaryScores' |
  'acceptComments' |
  'acceptCommentsAndFlags' |
  'rejectComments' |
  'rejectCommentsAndFlags' |
  'resolveFlags' |
  'resetTag' |
  'resetComments' |
  'confirmTag' |
  'confirmCommentSummaryScore' |
  'rejectCommentSummaryScore' |
  'rejectTag' |
  'addTag' |
  'removeTag'
);

/**
 * Creating the job queue before importing tasks as `createQueue`
 * creates a singleton, followed by importing tasks
 */
let queue: Queue;
export function getQueueSingleton(): Queue {
  queue = queue || createQueue({
    redis: config.get('redis_url'),
    jobEvents: false,
  }) as Queue;

  return queue;
}

export const knownTasks: {
  [name: string]: IQueueHandler<any>;
} = {

};

export function enqueue<T>(name: IKnownTasks, data: T, runImmediately = false): Job | Promise<any> {
  if (runImmediately || config.get('worker.run_immediately')) {
    const fn = knownTasks[name];

    return fn(data, logger, true);
  } else {
    const q = getQueueSingleton();
    const job = q.createJob(name, data);

    return job
      .removeOnComplete(config.get('worker.remove_task_on_complete'))
      .ttl(config.get('worker.task_ttl'))
      .save();
  }
}

export interface IJobLogger {
  info(message: string, data?: any): void;
  error(message: string, data?: any): void;
}

export function queueLogger(job: Job): IJobLogger {
  return {
    info: (message: string, data?: any) => {
      if (typeof data === 'undefined') {
        logger.info(message);
      } else {
        logger.info(message, data);
      }
      job.log('Info: ' + message);
    },

    error: (message: string, data?: any) => {
      if (typeof data === 'undefined') {
        logger.error(message);
      } else {
        logger.error(message, data);
      }
      job.log('Error: ' + message);
    },
  };
}

export interface IQueueHandler<T> {
  (data: T, log: IJobLogger, runImmediately?: boolean): Promise<any>;
}

export function registerTask<T>(name: IKnownTasks, fn: IQueueHandler<T>) {
  knownTasks[name] = fn;
}

export function processKnownTasks() {
  for (const key in knownTasks) {
    queue.process(key, 1, async (job: Job, done: (event: any, data?: any) => any) => {
      try {
        const data = await knownTasks[key](job.data, queueLogger(job));
        done(null, data);
      } catch (e) {
        done(e);
      }
    });
  }
}

export function handler<T>(fn: IQueueHandler<T>): IQueueHandler<T> {
  return fn;
}
