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

// Config from webpack
declare const __DEVELOPMENT__: boolean;
declare const ENV_API_URL: string;
declare const ENV_APP_NAME: string;
declare const ENV_REQUIRE_REASON_TO_REJECT: boolean;
declare const ENV_COMMENTS_EDITABLE_FLAG: boolean;
declare const ENV_RESTRICT_TO_SESSION: boolean;
declare const ENV_MODERATOR_GUIDELINES_URL: string;
declare const ENV_SUBMIT_FEEDBACK_URL: string;
// End config from webpack

// Config from HTML template

function get_config() {
  if (typeof(window) !== 'undefined') {
    return (window as any)['osmod_config'];
  }
  return (global as any)['osmod_config'];
}

function getString(key: string, fallback: string): string {
  const osmod_config = get_config();
  if (typeof osmod_config === 'undefined' || !(key in osmod_config)) {
    return fallback;
  }
  const val = osmod_config[key] as string;

  if (typeof val === 'undefined') {
    return fallback;
  }

  if (val.startsWith('{{') || val.length === 0) {
    return fallback;
  }

  return val;
}

function getBoolean(key: string, fallback: boolean): boolean {
  const osmod_config = get_config();
  if (typeof osmod_config === 'undefined' || !(key in osmod_config)) {
    return fallback;
  }

  const val = osmod_config[key] as string;

  if (typeof val === 'undefined') {
    return fallback;
  }

  if (val.startsWith('{{') || val.length === 0) {
    return fallback;
  }

  return val === 'true';
}

// End config from HTML template

// Turn externally defined config into exports
export const DEVELOPMENT = (typeof __DEVELOPMENT__ !== 'undefined') ? __DEVELOPMENT__  : true;
export const API_URL = getString('API_URL', (typeof ENV_API_URL !== 'undefined') ? ENV_API_URL : '');
export const APP_NAME = getString('APP_NAME', (typeof ENV_APP_NAME !== 'undefined') ? ENV_APP_NAME : 'Moderator');
export const REQUIRE_REASON_TO_REJECT = getBoolean('REQUIRE_REASON_TO_REJECT', (typeof ENV_REQUIRE_REASON_TO_REJECT !== 'undefined') ? ENV_REQUIRE_REASON_TO_REJECT : false);
export const COMMENTS_EDITABLE_FLAG = getBoolean('COMMENTS_EDITABLE_FLAG', (typeof ENV_COMMENTS_EDITABLE_FLAG !== 'undefined') ? ENV_COMMENTS_EDITABLE_FLAG : true);
export const RESTRICT_TO_SESSION = getBoolean('RESTRICT_TO_SESSION', (typeof ENV_RESTRICT_TO_SESSION !== 'undefined') ? ENV_RESTRICT_TO_SESSION : false);
export const MODERATOR_GUIDELINES_URL = getString('MODERATOR_GUIDELINES_URL', (typeof ENV_MODERATOR_GUIDELINES_URL !== 'undefined') ? ENV_MODERATOR_GUIDELINES_URL : '');
export const SUBMIT_FEEDBACK_URL = getString('SUBMIT_FEEDBACK_URL', (typeof ENV_SUBMIT_FEEDBACK_URL !== 'undefined') ? ENV_SUBMIT_FEEDBACK_URL : '');
export const DEFAULT_DRAG_HANDLE_POS1 = 0;
export const DEFAULT_DRAG_HANDLE_POS2 = 0.2;
export const DATE_FORMAT_LONG = 'MMM. d, yyyy h:mm a';
export const DATE_FORMAT_MDY = 'MMM. d, yyyy';
export const DATE_FORMAT_HM = 'h:mm a';
export const COLCOUNT = 100;
