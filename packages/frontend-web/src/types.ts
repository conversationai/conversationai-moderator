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

export interface IRedialLocals {
  path: string;
  getState(): any;
  query: {
    [key: string]: string;
  };
  params: {
    [key: string]: string;
  };
  dispatch(payload: any): any;
}

// These are our representation of the core moderator actions,
// i.e., the things a moderator can do to a comment via one of the action buttons
// They map onto the IRu
export type IModerationAction = 'approve' | 'defer' | 'highlight' | 'reject';

// These are the broader set of actions that can be applied to a comment
export type ICommentAction = IModerationAction | 'tag';

// These are the actions we can do to a comment within the interface
export type IConfirmationAction = ICommentAction | 'reset';

export interface ITopScore {
  start: number;
  end: number;
}
