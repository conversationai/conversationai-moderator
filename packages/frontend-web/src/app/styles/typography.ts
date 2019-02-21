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

export type ITypeStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
};

function makeTypeStyle(
  fontFamily: string,
  fontSize: number,
  fontWeight = 400,
  lineHeight = 1.5,
): ITypeStyle {
  return {
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
  };
}

const BODY_FONT_STACK = 'Georgia, serif';

// Franklin Gothic Medium
export const LOGIN_TITLE_TYPE =
  makeTypeStyle('LibreFranklin-Medium, sans-serif', 60, 400);

// Franklin Gothic Medium
export const HEADLINE_TYPE =
  makeTypeStyle('LibreFranklin-Medium, sans-serif', 20, 400);

export const SEMI_BOLD_TYPE =
  makeTypeStyle(BODY_FONT_STACK, 20, 600);

// Cheltenham Book
export const ARTICLE_HEADLINE_TYPE =
  makeTypeStyle('LibreFranklin-Medium, sans-serif', 16, 400);

// Franklin Gothic Book
export const BODY_TEXT_TYPE =
  makeTypeStyle(BODY_FONT_STACK, 16, 400);

export const COMMENT_DETAIL_BODY_TEXT_TYPE =
  makeTypeStyle(BODY_FONT_STACK, 16, 400, 1.7);

  // Franklin Gothic Bold
export const BODY_TEXT_BOLD_TYPE =
  makeTypeStyle(BODY_FONT_STACK, 16, 800);

// FRANKLIN GOTHIC MEDIUM
export const ARTICLE_CATEGORY_TYPE =
  makeTypeStyle('LibreFranklin-Medium, sans-serif', 14, 400);

export const COMMENT_DETAIL_DATE_TYPE =
  makeTypeStyle('LibreFranklin-Medium, sans-serif', 14, 400);

// Franklin Gothic Medium
export const BUTTON_LINK_TYPE =
  makeTypeStyle('LibreFranklin-Medium, sans-serif', 14, 400);

// Franklin Gothic Medium
export const COMMENT_DETAIL_TAG_LIST_BUTTON_TYPE =
  makeTypeStyle('LibreFranklin-Medium, sans-serif', 14, 400);

// Franklin Gothic Medium
export const ARTICLE_CAPTION_TYPE =
  makeTypeStyle('LibreFranklin-Medium, sans-serif', 14, 400);

// Franklin Gothic Bold
export const CAPTION_TYPE =
  makeTypeStyle('LibreFranklin-Medium, sans-serif', 12, 400);

// Franklin Gothic Medium
export const HANDLE_LABEL_TYPE =
  makeTypeStyle('LibreFranklin-Medium, sans-serif', 12, 400, 1);
