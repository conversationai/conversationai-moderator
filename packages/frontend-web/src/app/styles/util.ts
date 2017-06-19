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

export const DEFAULT_OPACITY = 1;
export const MEDIUM_OPACITY = 0.54;
export const LIGHT_OPACITY = 0.12;

// SPACING
export const TEXT_OFFSET_DEFAULT_SPACING = 72;
export const GUTTER_DEFAULT_SPACING = 24;
export const BOX_DEFAULT_SPACING = 10;

export const SHORT_SCREEN_QUERY = '@media (max-height: 769px)';

// ACCESSIBILITY
export const OFFSCREEN = {
  clip: 'rect(1px, 1px, 1px, 1px)',
  display: 'block',
  height: 1,
  margin: 0,
  overflow: 'hidden',
  position: 'absolute',
  width: 1,
};

export const MODAL_DROP_SHADOW = [
  '0px 0px 24px 0px rgba(0,0,0, 0.22)',
  '0px 24px 24px 0px rgba(0,0,0, 0.3)',
].join(', ');

export const INPUT_DROP_SHADOW = [
  '0px 0px 2px 0px rgba(0,0,0, 0.12)',
  '0px 2px 2px 0px rgba(0,0,0, 0.24)',
].join(', ');

export const CENTER_CONTENT = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

export const VISUALLY_HIDDEN = {
  width: 0,
  height: 0,
  position: 'absolute',
  clip: 'rect(1px, 1px, 1px, 1px)',
};
