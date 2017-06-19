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

declare var __DEVELOPMENT__: string;

export const DEVELOPMENT = (typeof __DEVELOPMENT__ !== 'undefined')
    ? __DEVELOPMENT__
    : true;

declare var ENV_API_URL: string;

const ENV_API_URL_VALUE = (typeof ENV_API_URL !== 'undefined')
    ? ENV_API_URL
    : '';

export const API_URL = (
   (window as any)['API_URL'] && ((window as any)['API_URL'] !== '{{API_URL}}')
 ) ? (window as any)['API_URL'] : ENV_API_URL_VALUE;

declare var ENV_APP_NAME: string;

const ENV_APP_NAME_VALUE = (typeof ENV_APP_NAME !== 'undefined')
    ? ENV_APP_NAME
    : 'Moderator';

export const APP_NAME = (
   (window as any)['APP_NAME'] && ((window as any)['APP_NAME'] !== '{{APP_NAME}}')
 ) ? (window as any)['APP_NAME'] : ENV_APP_NAME_VALUE;

declare var ENV_REQUIRE_REASON_TO_REJECT: boolean;

const ENV_REQUIRE_REASON_TO_REJECT_VALUE = (typeof ENV_REQUIRE_REASON_TO_REJECT !== 'undefined')
    ? ENV_REQUIRE_REASON_TO_REJECT
    : false;
export const REQUIRE_REASON_TO_REJECT = (
   (window as any)['REQUIRE_REASON_TO_REJECT'] && ((window as any)['REQUIRE_REASON_TO_REJECT'] !== '{{REQUIRE_REASON_TO_REJECT}}')
 ) ? (window as any)['REQUIRE_REASON_TO_REJECT'] === 'true' : ENV_REQUIRE_REASON_TO_REJECT_VALUE;

declare var ENV_COMMENTS_EDITABLE_FLAG: boolean;

const ENV_COMMENTS_EDITABLE_FLAG_VALUE = (typeof ENV_COMMENTS_EDITABLE_FLAG !== 'undefined')
  ? ENV_COMMENTS_EDITABLE_FLAG
  : true;
export const COMMENTS_EDITABLE_FLAG = (
  (window as any)['COMMENTS_EDITABLE_FLAG'] && ((window as any)['COMMENTS_EDITABLE_FLAG'] !== '{{COMMENTS_EDITABLE_FLAG}}')
) ? (window as any)['COMMENTS_EDITABLE_FLAG'] === 'true' : ENV_COMMENTS_EDITABLE_FLAG_VALUE;
declare var ENV_RESTRICT_TO_SESSION: boolean;

const ENV_RESTRICT_TO_SESSION_VALUE = (typeof ENV_RESTRICT_TO_SESSION !== 'undefined')
    ? ENV_RESTRICT_TO_SESSION
    : false;
export const RESTRICT_TO_SESSION = (
   (window as any)['RESTRICT_TO_SESSION'] && ((window as any)['RESTRICT_TO_SESSION'] !== '{{RESTRICT_TO_SESSION}}')
 ) ? (window as any)['RESTRICT_TO_SESSION'] === 'true' : ENV_RESTRICT_TO_SESSION_VALUE;

declare var ENV_MODERATOR_GUIDELINES_URL: string;
const ENV_MODERATOR_GUIDELINES_URL_VALUE = (typeof ENV_MODERATOR_GUIDELINES_URL !== 'undefined')
    ? ENV_MODERATOR_GUIDELINES_URL
    : '';
export const MODERATOR_GUIDELINES_URL = (
   (window as any)['MODERATOR_GUIDELINES_URL'] && ((window as any)['MODERATOR_GUIDELINES_URL'] !== '{{MODERATOR_GUIDELINES_URL}}')
 ) ? (window as any)['MODERATOR_GUIDELINES_URL'] : ENV_MODERATOR_GUIDELINES_URL_VALUE;

declare var ENV_SUBMIT_FEEDBACK_URL: string;
const ENV_SUBMIT_FEEDBACK_URL_VALUE = (typeof ENV_SUBMIT_FEEDBACK_URL !== 'undefined')
    ? ENV_SUBMIT_FEEDBACK_URL
    : '';
export const SUBMIT_FEEDBACK_URL = (
   (window as any)['SUBMIT_FEEDBACK_URL'] && ((window as any)['SUBMIT_FEEDBACK_URL'] !== '{{SUBMIT_FEEDBACK_URL}}')
 ) ? (window as any)['SUBMIT_FEEDBACK_URL'] : ENV_SUBMIT_FEEDBACK_URL_VALUE;

export const FOCUS_DATA_ATTR = 'data-focus-id';
export const ANNOTATION_THRESHOLD = 0.6;
export const DEFAULT_DRAG_HANDLE_POS1 = 0;
export const DEFAULT_DRAG_HANDLE_POS2 = 0.2;
export const DATE_FORMAT_LONG = 'MMM. D, YYYY h:mm A';
export const DATE_FORMAT_MDY = 'MMM. D, YYYY';
export const DATE_FORMAT_HM = 'h:mm A';
export const COLCOUNT = 100;
