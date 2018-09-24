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
  identity,
  isArray,
  isPlainObject,
  isUndefined,
  partial as lodashPartial,
} from 'lodash';

import { Map as ImmutableMap } from 'immutable';

interface INode<T> {
  children: ImmutableMap<any, INode<T>> | null;
  value: T | undefined;
}

function makeNode<T>(): INode<T> {
  const o = Object.create(null);

  o.children = ImmutableMap<any, INode<T>>();
  o.value = undefined;

  return o;
}

const mutableObjectCache = new Map<object | Array<any>, string>();

function stringifyIfNecessary(o: any, useEqualityForMutableObjects: boolean): boolean | number | string {
  if (
    isArray(o) ||
    isPlainObject(o) ||
    o instanceof Map ||
    o instanceof Set
  ) {
    if (useEqualityForMutableObjects) {
      const stringKey = mutableObjectCache.get(o);

      if (stringKey) {
        return stringKey;
      }

      const nextStringKey = mutableObjectCache.size.toString();
      mutableObjectCache.set(o, nextStringKey);

      return nextStringKey;
    } else {
      if (
        o instanceof Map ||
        o instanceof Set
      ) {
        return JSON.stringify(Array.from(o));
      } else {
        return JSON.stringify(o);
      }
    }
  }

  return o;
}

class Cache<T> {
  root = makeNode<T>();
  useEqualityForMutableObjects = false;

  constructor(useEqualityForMutableObjects: boolean) {
    this.useEqualityForMutableObjects = useEqualityForMutableObjects;
  }

  has(args: Array<any>): boolean {
    return !isUndefined(this.get(args));
  }

  get(args: Array<any>): T | undefined {
    let previousNode = this.root;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const key = stringifyIfNecessary(arg, this.useEqualityForMutableObjects);

      // Found in tree, continue
      if (previousNode.children.has(key)) {
        const node = previousNode.children.get(key);
        previousNode = node;
      } else {
        return undefined;
      }
    }

    return previousNode.value;
  }

  set(args: Array<any>, value: T): void {
    let previousNode = this.root;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const key = stringifyIfNecessary(arg, this.useEqualityForMutableObjects);

      let node;

      // Found in tree, continue
      if (previousNode.children.has(key)) {
        node = previousNode.children.get(key);
      } else {
        node = makeNode<T>();
        previousNode.children = previousNode.children.set(key, node);
      }

      previousNode = node;
    }

    previousNode.value = value;
  }

  toJS(): object {
    function serialize(data: any): any {
      if (ImmutableMap.isMap(data)) {
        const d = data.reduce((sum: any, v: any, k: any) => {
          sum[k.toString()] = serialize(v);

          return sum;
        }, {} as {
          [key: string]: any;
        });

        return d;
      }

      if (isArray(data)) {
        return data.map(serialize);
      }

      if (isPlainObject(data)) {
        return Object.keys(data).reduce((sum, k: string) => {
          sum[k] = serialize(data[k]);

          return sum;
        }, {} as {
          [key: string]: any;
        });
      }

      if (data && data.toJS) {
        return data.toJS();
      }

      return data;
    }

    return serialize(this.root);
  }

  toString() {
    return JSON.stringify(this.toJS(), undefined, 2);
  }
}

export function memoize<T extends Function>(fn: T, useEqualityForMutableObjects = false): T {
  const cache = new Cache<Function>(useEqualityForMutableObjects);

  function memoized(...args: Array<any>) {
    if (cache.has(args)) {
      return cache.get(args);
    }

    const result = fn(...args);

    cache.set(args, result);

    return result;
  }

  return memoized as any;
}

export const partial:typeof lodashPartial = memoize(lodashPartial);

export function maybeCallback<T>(fn?: T | null) {
  return fn || identity;
}

export function basicAlways<T>(value: T): () => T {
  return () => value;
}

export const always = memoize(basicAlways);

export { identity };
