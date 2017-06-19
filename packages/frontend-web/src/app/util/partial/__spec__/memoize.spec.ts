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

import { expect } from 'chai';
import {
  List as ImmutableList,
  Map as ImmutableMap,
  Record as ImmutableRecord,
  Set as ImmutableSet,
} from 'immutable';
import { spy } from 'sinon';
import { memoize } from '../index';

function makeMemoized(useEqualityForMutableObjects = false) {
  const callback = spy();

  const fn = memoize((...args: Array<any>): string => {
    callback(...args);

    return `Value: Args Length = ${args.length}`;
  }, useEqualityForMutableObjects);

  return {
    callback,
    fn,
  };
}

describe('memoize', () => {
  it('should memoize primitives', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    // First run
    fn(1, 'two', true);
    fn(1, 'two', true);

    // Second run
    fn('two', 1, true);
    fn('two', 1, true);

    expect(callback.callCount).to.be.equal(2);
  });

  it('should memoize objects', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    const o1: any = { one: 1 };
    const o2: any = { two: 2 };
    const o3: any = { three: 3 };

    // First run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o1.one = 11;

    // Second run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o2.twoMore = 22;

    // Third run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    delete o3.three;

    // Fourth run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    expect(callback.callCount).to.be.equal(4);
  });

  it('should memoize objects by equality rather than contents', () => {
    const {
      callback,
      fn,
    } = makeMemoized(true);

    const o1: any = { one: 1 };
    const o2: any = { two: 2 };
    const o3: any = { three: 3 };

    // First run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o1.one = 11;

    // Second run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o2.twoMore = 22;

    // Third run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    delete o3.three;

    // Fourth run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    expect(callback.callCount).to.be.equal(1);
  });

  it('should memoize arrays', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    const a1 = [1];
    const a2 = [2];
    const a3 = [3];

    // First run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    a1.push(11);

    // Second run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    a2.push(22);

    // Third run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    a3.splice(0, 1);

    // Fourth run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    expect(callback.callCount).to.be.equal(4);
  });

  it('should memoize arrays by equality rather than contents', () => {
    const {
      callback,
      fn,
    } = makeMemoized(true);

    const a1 = [1];
    const a2 = [2];
    const a3 = [3];

    // First run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    a1.push(11);

    // Second run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    a2.push(22);

    // Third run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    a3.splice(0, 1);

    // Fourth run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    expect(callback.callCount).to.be.equal(1);
  });

  it('should memoize zero arguments functions', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    fn();
    fn();

    expect(callback.callCount).to.be.equal(1);
  });

  it('should memoize variadic functions', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    const o1: any = { one: 1 };
    const o2: any = { two: 2 };
    const o3: any = { three: 3 };

    expect(fn(o1, o2, o3)).to.be.equal('Value: Args Length = 3', '3 arguments');
    expect(fn(o1, o2, o3)).to.be.equal('Value: Args Length = 3', '3 arguments');

    expect(fn(o1, o2)).to.be.equal('Value: Args Length = 2', '2 arguments');
    expect(fn(o1, o2)).to.be.equal('Value: Args Length = 2', '2 arguments');

    expect(fn(o1)).to.be.equal('Value: Args Length = 1', '1 arguments');
    expect(fn(o1)).to.be.equal('Value: Args Length = 1', '1 arguments');

    expect(callback.callCount).to.be.equal(3, '3 callbacks');
  });

  it('should memoize ES6 Maps', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    const o1 = new Map([['one', 1]]);
    const o2 = new Map([['two', 2]]);
    const o3 = new Map([['three', 3]]);

    // First run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o1.set('one', 11);

    // Second run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o2.set('twoMore', 22);

    // Third run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o3.delete('three');

    // Fourth run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    expect(callback.callCount).to.be.equal(4);
  });

  it('should memoize ES6 Sets', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    const s1 = new Set([1]);
    const s2 = new Set([2]);
    const s3 = new Set([3]);

    // First run
    fn(s1, s2, s3);
    fn(s1, s2, s3);

    s1.add(11);

    // Second run
    fn(s1, s2, s3);
    fn(s1, s2, s3);

    s2.add(22);

    // Third run
    fn(s1, s2, s3);
    fn(s1, s2, s3);

    s3.delete(3);

    // Fourth run
    fn(s1, s2, s3);
    fn(s1, s2, s3);

    expect(callback.callCount).to.be.equal(4);
  });

  it('should memoize Immutable Records', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    const Test = ImmutableRecord({ num: null });

    let o1 = Test({ num: 1 });
    let o2 = Test({ num: 2 });
    let o3 = Test({ num: 3 });

    // First run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o1 = o1.set('num', 11);

    // Second run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o2 = o2.set('num', 22);

    // Third run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o3 = o3.delete('num');

    // Fourth run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    expect(callback.callCount).to.be.equal(4);
  });

  it('should memoize Immutable Maps', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    let o1 = ImmutableMap({ one: 1 });
    let o2 = ImmutableMap({ two: 2 });
    let o3 = ImmutableMap({ three: 3 });

    // First run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o1 = o1.set('one', 11);

    // Second run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o2 = o2.set('twoMore', 22);

    // Third run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    o3 = o3.delete('three');

    // Fourth run
    fn(o1, o2, o3);
    fn(o1, o2, o3);

    expect(callback.callCount).to.be.equal(4);
  });

  it('should memoize Immutable Sets', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    let s1 = ImmutableSet([1]);
    let s2 = ImmutableSet([2]);
    let s3 = ImmutableSet([3]);

    // First run
    fn(s1, s2, s3);
    fn(s1, s2, s3);

    s1 = s1.add(11);

    // Second run
    fn(s1, s2, s3);
    fn(s1, s2, s3);

    s2 = s2.add(22);

    // Third run
    fn(s1, s2, s3);
    fn(s1, s2, s3);

    s3 = s3.delete(3);

    // Fourth run
    fn(s1, s2, s3);
    fn(s1, s2, s3);

    expect(callback.callCount).to.be.equal(4);
  });

  it('should memoize Immutable Lists', () => {
    const {
      callback,
      fn,
    } = makeMemoized();

    let a1 = ImmutableList([1]);
    let a2 = ImmutableList([2]);
    let a3 = ImmutableList([3]);

    // First run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    a1 = a1.push(11);

    // Second run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    a2 = a2.push(22);

    // Third run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    a3 = a3.splice(0, 1) as ImmutableList<number>;

    // Fourth run
    fn(a1, a2, a3);
    fn(a1, a2, a3);

    expect(callback.callCount).to.be.equal(4);
  });
});
