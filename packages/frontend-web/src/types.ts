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

export type ServerStates =
  's_connecting' |
  's_unavailable' |
  's_init_oauth' |
  's_init_first_user' |
  's_init_perspective' |
  's_init_check_oauth' |
  's_gtg';
export type AuthenticationStates = 'initialising' | 'check_token' | 'unauthenticated' | 'gtg';
export type WebsocketStates = 'ws_connecting' | 'ws_gtg';
export type SystemStates = ServerStates | AuthenticationStates | WebsocketStates;

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
