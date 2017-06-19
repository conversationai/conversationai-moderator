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
  focusedElement,
  initialState,
  reducer,
  restoreFocus,
  saveFocus,
  unfocusedElement,
} from '../focus';

describe('focus reducer', () => {
  it('should focus a given element', () => {
    const testState = reducer(initialState, focusedElement('testFocusedElement'));
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testFocusedElement',
    );
  });

  it('should focus a new given element', () => {
    let testState = reducer(initialState, focusedElement('testFocusedElement'));
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testFocusedElement',
    );

    testState = reducer(testState, focusedElement('testNewFocusedElement'));
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testNewFocusedElement',
    );
  });

  it('should unfocus an element', () => {
    let testState = reducer(initialState, focusedElement('testFocusedElement'));
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testFocusedElement',
    );

    testState = reducer(testState, unfocusedElement());
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      null,
    );
  });

  it('should save the focus of an element', () => {
    let testState = reducer(initialState, focusedElement('testFocusedElement'));
    expect(
      testState.getIn(['stack']).size,
    ).to.equal(
      0,
    );

    testState = reducer(testState, saveFocus());
    expect(
      testState.getIn(['stack']).size,
    ).to.equal(
      1,
    );
  });

  it('should save the focus of two elements', () => {
    let testState = reducer(initialState, focusedElement('testFocusedElement'));
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testFocusedElement',
    );

    testState = reducer(testState, saveFocus());
    expect(
      testState.getIn(['stack']).size,
    ).to.equal(
      1,
    );

    testState = reducer(testState, focusedElement('testSecondFocusedElement'));
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testSecondFocusedElement',
    );

    testState = reducer(testState, saveFocus());
    expect(
      testState.getIn(['stack']).size,
    ).to.equal(
      2,
    );
  });

  it('should restore the focus of the previously focused element', () => {
    let testState = reducer(initialState, focusedElement('testFocusedElement'));
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testFocusedElement',
    );

    testState = reducer(testState, saveFocus());
    expect(
      testState.getIn(['stack']).size,
    ).to.equal(
      1,
    );

    testState = reducer(testState, unfocusedElement());
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      null,
    );

    testState = reducer(testState, restoreFocus());
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testFocusedElement',
    );
  });

  it('should restore the focus of the previously focused element after two save states', () => {
    let testState = reducer(initialState, focusedElement('testFocusedElement'));
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testFocusedElement',
    );

    testState = reducer(testState, saveFocus());
    expect(
      testState.getIn(['stack']).size,
    ).to.equal(
      1,
    );

    testState = reducer(testState, focusedElement('testSecondFocusedElement'));
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testSecondFocusedElement',
    );

    testState = reducer(testState, saveFocus());
    expect(
      testState.getIn(['stack']).size,
    ).to.equal(
      2,
    );

    testState = reducer(testState, focusedElement('testThirdFocusedElement'));
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testThirdFocusedElement',
    );

    testState = reducer(testState, restoreFocus());
    expect(
      testState.getIn(['currentlyFocused']),
    ).to.equal(
      'testSecondFocusedElement',
    );
  });
});
