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
import { partial } from '../index';

describe('partial', () => {
  it('should return the same function every time', () => {
    function identity(param: any): any {
      return param;
    }

    const callback1 = partial(identity, 'Test');
    const callback2 = partial(identity, 'Test');

    expect(callback1).to.equal(callback2);

    const callback3 = partial(identity, 'Another Test');
    const callback4 = partial(identity, 'Another Test');

    expect(callback3).to.not.equal(callback1);
    expect(callback3).to.equal(callback4);
  });
});
