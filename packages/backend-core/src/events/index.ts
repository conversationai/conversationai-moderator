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

import { EventEmitter } from 'events';
import { logger } from '../logger';
import { IArticleInstance, ICommentInstance, IDecisionInstance } from '../models';

export type IEventCallback<T> = (args: T) => any;
export type IEventWithMapCallback<T, S> = (args: T) => Promise<S>;

export type IKnownEvents =
    'api.publisher.pullArticle' |
    'api.publisher.highlightComment' |
    'api.publisher.unhighlightComment' |
    'api.publisher.sendDecisionToPublisher' |
    'api.publisher.editComment';

export interface IEventPublisherPullArticleArgs {
  articleId: string | number;
}

export interface IEventPublisherHighlightCommentArgs {
  comment: ICommentInstance;
}

export interface IEventPublisherUnhighlightCommentArgs {
  comment: ICommentInstance;
}

export interface IEventPublisherDecisionToPublisherArgs {
  decision: IDecisionInstance;
}

export interface IEventPublisherEditCommentArgs {
  comment: ICommentInstance;
}

export type IEventPublisherPullArticleReturns = IArticleInstance;

export interface IEventPipelineScoreCommentArgs {
  comment: ICommentInstance;
}

let emitter: EventEmitter;

export function getEventEmitterSingleton(): EventEmitter {
  emitter = emitter || new EventEmitter();

  return emitter;
}

function subscribe(pluginName: string, eventName: 'api.publisher.pullArticle', callback: IEventCallback<IEventPublisherPullArticleArgs>): void;
function subscribe(pluginName: string, eventName: 'api.publisher.highlightComment', callback: IEventCallback<IEventPublisherHighlightCommentArgs>): void;
function subscribe(pluginName: string, eventName: 'api.publisher.unhighlightComment', callback: IEventCallback<IEventPublisherUnhighlightCommentArgs>): void;
function subscribe(pluginName: string, eventName: 'api.publisher.sendDecisionToPublisher', callback: IEventCallback<IEventPublisherDecisionToPublisherArgs>): void;
function subscribe(pluginName: string, eventName: 'api.publisher.editComment', callback: IEventCallback<IEventPublisherEditCommentArgs>): void;

function subscribe<T, S, R>(pluginName: string, eventName: T, callback: IEventCallback<S> | IEventWithMapCallback<S, R>): void {
  const e = getEventEmitterSingleton();

  logger.info(`Event subscription: ${pluginName} is listening to ${eventName}`);

  e.addListener(eventName.toString(), callback);
}

function unsubscribe(pluginName: string, eventName: 'api.publisher.pullArticle', callback: IEventCallback<IEventPublisherPullArticleArgs>): void;
function unsubscribe(pluginName: string, eventName: 'api.publisher.highlightComment', callback: IEventCallback<IEventPublisherHighlightCommentArgs>): void;
function unsubscribe(pluginName: string, eventName: 'api.publisher.unhighlightComment', callback: IEventCallback<IEventPublisherUnhighlightCommentArgs>): void;
function unsubscribe(pluginName: string, eventName: 'api.publisher.sendDecisionToPublisher', callback: IEventCallback<IEventPublisherDecisionToPublisherArgs>): void;
function unsubscribe(pluginName: string, eventName: 'api.publisher.editComment', callback: IEventCallback<IEventPublisherEditCommentArgs>): void;

function unsubscribe<T, S, R>(pluginName: string, eventName: T, callback: IEventCallback<S> | IEventWithMapCallback<S, R>): void {
  const e = getEventEmitterSingleton();

  logger.info(`Event unsubscription: ${pluginName} is no longer listening to ${eventName}`);

  e.removeListener(eventName.toString(), callback);
}

function trigger<T>(name: T, args: object) {
  const e = getEventEmitterSingleton();

  logger.info(`Triggering event: ${name}`);

  e.emit(name.toString(), args);
}

function triggerMap(name: 'api.publisher.pullArticle', args: IEventPublisherPullArticleArgs): Promise<Array<IEventPublisherPullArticleReturns>>;
async function triggerMap<T, S, R>(name: T, args: S): Promise<Array<R>> {
  const e = getEventEmitterSingleton();

  const listeners = e.listeners(name.toString());

  logger.info(`Mapping event: ${name} across ${listeners.length} listeners`);

  return await Promise.all(
    listeners.map((l) => l(args)),
  );
}

function triggerMapFirst(name: 'api.publisher.pullArticle', args: IEventPublisherPullArticleArgs): Promise<IEventPublisherPullArticleReturns>;
async function triggerMapFirst<T, S, R>(name: T, args: S): Promise<R> {
  logger.info(`Mapping first event: ${name}`);

  const data = await triggerMap(name as any, args as any);

  return (data as Array<any>)[0];
}

export { subscribe, unsubscribe, trigger, triggerMap, triggerMapFirst };
