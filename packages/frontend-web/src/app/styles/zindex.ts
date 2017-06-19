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

let currentMaxIndex = 0;
const nextIndexLevel = () => currentMaxIndex += 5;

export const BASE_Z_INDEX = nextIndexLevel();
export const SELECT_Z_INDEX = nextIndexLevel();
export const TOOLTIP_Z_INDEX = nextIndexLevel();
export const STICKY_Z_INDEX = nextIndexLevel();
export const SCRIM_Z_INDEX = nextIndexLevel();
export const ARTICLE_PREVIEW_Z_INDEX = nextIndexLevel();
export const ACCOUNT_SETTINGS_MENU_Z_INDEX = nextIndexLevel();
