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

import {
  css as stylesheetToClassNames,
  StyleSheet,
} from 'aphrodite';
import { Map } from 'immutable';
import { CSSProperties } from 'react';

const Prefixer = require('inline-style-prefixer');

import { memoize } from '../util/partial';

const prefixer = new Prefixer({ userAgent: navigator.userAgent });

function prefixStyles(obj: object): object {
  return prefixer.prefix(obj);
}

export interface IStyleProps {
  className?: string;
  style?: CSSProperties;
}

let knownStylesheets = Map();

export function stylesheet<T>(styles: T): T {
  const sheet = StyleSheet.create(styles as any);

  for (const key in sheet) {
    if (sheet.hasOwnProperty(key)) {
      const originalObject = (styles as any)[key];
      knownStylesheets = knownStylesheets.set(originalObject, sheet[key]);
    }
  }

  return styles;
}

function knownStyle(obj: object) {
  return knownStylesheets.get(obj);
}

export interface IStyle { [key: string]: IStyle | string | number; }
export type IPossibleStyle = IStyle | null | undefined;

function flattenStyleReducer(sum: object, style: object): object {
  if (!style) { return sum; }

  return { ...sum, ...style };
}

function flattenStyles(styles: Array<object>): object {
  return styles.reduce(flattenStyleReducer, {});
}

export function originalCSS(...styles: Array<IPossibleStyle>): IStyleProps {
  const fromStylesheet: Array<object> = styles.filter((style: IPossibleStyle) => style && knownStyle(style));
  const notFromStylesheet = styles.filter((style: IPossibleStyle) => style && !knownStyle(style));

  const prefixedInline = notFromStylesheet.map(prefixStyles);
  const classNames = stylesheetToClassNames(fromStylesheet.map(knownStyle));
  const output: IStyleProps = {};

  if (prefixedInline.length > 0) {
    output.style = flattenStyles(prefixedInline);
  }

  if (classNames.length > 0) {
    output.className = classNames;
  }

  return output;
}

export const css = memoize(originalCSS, true);
