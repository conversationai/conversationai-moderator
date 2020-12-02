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

export const MODERATION_ACTION_ACCEPT = 'Accept';
export const MODERATION_ACTION_REJECT = 'Reject';
export const MODERATION_ACTION_DEFER = 'Defer';
export const MODERATION_ACTION_HIGHLIGHT = 'Highlight';

export type IResolution = 'Accept' | 'Reject' | 'Defer';

export type IAction = 'Accept' | 'Reject' | 'Defer' | 'Highlight';

export const RESET_COUNTS = {
  allCount: 0,
  unprocessedCount: 0,
  moderatedCount: 0,
  unmoderatedCount: 0,
  highlightedCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  deferredCount: 0,
  flaggedCount: 0,
  batchedCount: 0,
};
