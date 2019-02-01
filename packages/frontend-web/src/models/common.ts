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

import { IModerationAction } from '../types';

export type ModelId = string;

export const SERVER_ACTION_ACCEPT = 'Accept';
export const SERVER_ACTION_REJECT = 'Reject';
export const SERVER_ACTION_DEFER = 'Defer';
export const SERVER_ACTION_HIGHLIGHT = 'Highlight';

export type IServerAction = 'Accept' | 'Reject' | 'Defer' | 'Highlight';

export function convertServerAction(saction: IServerAction): IModerationAction {
  switch (saction) {
    case SERVER_ACTION_ACCEPT:
      return 'approve';
    case SERVER_ACTION_REJECT:
      return 'reject';
    case SERVER_ACTION_DEFER:
      return 'defer';
    case SERVER_ACTION_HIGHLIGHT:
      return 'highlight';
  }
}

export function convertClientAction(action: IModerationAction): IServerAction {
  switch (action) {
    case 'approve':
      return SERVER_ACTION_ACCEPT;
    case 'reject':
      return SERVER_ACTION_REJECT;
    case 'defer':
      return SERVER_ACTION_DEFER;
    case 'highlight':
      return SERVER_ACTION_HIGHLIGHT;
  }
}
