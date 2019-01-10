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
import { isEmpty } from 'lodash';
import { memoize } from '../util/partial';
const Prefixer = require('inline-style-prefixer');
import { DEVELOPMENT } from '../config';

const prefixer = new Prefixer({ userAgent: navigator.userAgent });

function prefixStyles(obj: object): object {
  return prefixer.prefix(obj);
}

export interface IStyleProps {
  className?: string;
  style?: object;
}

let knownStylesheets = Map();

export function stylesheet<T>(styles: T): T {
  const sheet = StyleSheet.create(styles as any);

  for (const key in sheet) {
    const originalObject = (styles as any)[key];
    knownStylesheets = knownStylesheets.set(originalObject, sheet[key]);
  }

  return styles;
}

function knownStyle(obj: object) {
  return knownStylesheets.get(obj);
}

export type IPossibleStyle = object | string | null | undefined | false;

function flattenStyleReducer(sum: object, style: object): object {
  if (!style) { return sum; }

  return { ...sum, ...style };
}

function flattenStyles(styles: Array<object>): object {
  return styles.reduce(flattenStyleReducer, {});
}

export function originalCSS(...styles: Array<IPossibleStyle>): IStyleProps {
  const fromStylesheet: Array<object> = styles.filter((style: IPossibleStyle) => style && typeof style !== 'string' && knownStyle(style)) as Array<object>;
  const notFromStylesheet = styles.filter((style: IPossibleStyle) => style && typeof style !== 'string' && !knownStyle(style)) as Array<object>;
  const fromClassName = styles.filter((style: IPossibleStyle) => style && typeof style === 'string');

  const prefixedInline = notFromStylesheet.map(prefixStyles);

  if (DEVELOPMENT) {
    let gotInlineStyle = false;

    for (const style of styles) {
      if (!style) {
        continue;
      }

      if (typeof style === 'string' || knownStyle(style)) {
        if (gotInlineStyle) {
          throw new Error('Tried to add a class-based style AFTER an inline style. Precedence will be confusing. Please refactor');
        }
      } else {
        gotInlineStyle = true;
      }
    }

    const output: IStyleProps = {};

    const outputStyles = {
      ...flattenStyles(fromStylesheet),
      ...flattenStyles(prefixedInline),
    };

    if (!isEmpty(outputStyles)) {
      output.style = outputStyles;
    }

    if (fromClassName.length > 0) {
      output.className = fromClassName.join(' ');
    }

    return output;
  } else {
    const classNames = fromClassName.concat([
      stylesheetToClassNames(fromStylesheet.map(knownStyle)),
    ]).join(' ');

    const output: IStyleProps = {};

    if (prefixedInline.length > 0) {
      output.style = flattenStyles(prefixedInline);
    }

    if (classNames.length > 0) {
      output.className = classNames;
    }

    return output;
  }
}

export const css = memoize(originalCSS, true);
