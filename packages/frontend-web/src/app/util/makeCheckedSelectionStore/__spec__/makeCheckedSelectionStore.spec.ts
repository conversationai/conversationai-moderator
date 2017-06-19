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
import { Map } from 'immutable';
import { makeCheckedSelectionStore } from '../makeCheckedSelectionStore';

const testMakeCheckedSelectionStore = makeCheckedSelectionStore(['test'], { defaultSelectionState: false });
const testMakeCheckedSelectionStoreWithDefaultSelected = makeCheckedSelectionStore(['test'], { defaultSelectionState: true });

describe('makeCheckedSelectionStore reducer with not selected by default', () => {
  const reducer = testMakeCheckedSelectionStore.reducer;

  it('should toggle all to be selected and their default selection state to be true', () => {
    const testState = reducer(testMakeCheckedSelectionStore.initialState, testMakeCheckedSelectionStore.toggleSelectAll());

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.true;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.true;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle all to be selected and their default selection state to be true and remove all overrides', () => {
    const testOverrides = Map({
      1: true,
      2: false,
    });
    const testInitialState = testMakeCheckedSelectionStore.initialState.set('overrides', testOverrides);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStore.toggleSelectAll());

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.true;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.true;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle all to be not selected and their default selection state to be false', () => {
    const testInitialState = testMakeCheckedSelectionStore.initialState.set('areAllSelected', true);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStore.toggleSelectAll());

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.false;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle all to be not selected and their default selection state to be false and remove all overrides', () => {
    const testOverrides = Map({
      1: true,
      2: false,
    });
    let testInitialState = testMakeCheckedSelectionStore.initialState.set('overrides', testOverrides);
    testInitialState = testInitialState.set('areAllSelected', true);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStore.toggleSelectAll());

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.false;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle a single item and leave all are selected set as false and create an override set to true at id 1', () => {
    const testState = reducer(testMakeCheckedSelectionStore.initialState, testMakeCheckedSelectionStore.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    const overrides = testState.getIn(['overrides']);
    expect(
      overrides.getIn(['1']),
    ).to.be.true;
  });

  it('should toggle a single item and change all are selected from true to be false and create an override set to true at id 1', () => {
    const testInitialState = testMakeCheckedSelectionStore.initialState.set('areAllSelected', true);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStore.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    const overrides = testState.getIn(['overrides']);
    expect(
      overrides.getIn(['1']),
    ).to.be.true;
  });

  it('should toggle a single item and change all are selected from true to be false and create an override set to true at id 1, then toggle back off again', () => {
    const testInitialState = testMakeCheckedSelectionStore.initialState.set('areAllSelected', true);
    let testState = reducer(testInitialState, testMakeCheckedSelectionStore.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    const overrides = testState.getIn(['overrides']);
    expect(
      overrides.getIn(['1']),
    ).to.be.true;

    testState = reducer(testState, testMakeCheckedSelectionStore.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle a single item and change all are selected to be false and remove the override at id 1', () => {
    const testOverrides = Map({
      1: true,
    });
    const testInitialState = testMakeCheckedSelectionStore.initialState.set('overrides', testOverrides);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStore.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle a single item and change all are selected to be false and remove the override at id 1 and leave the override at 2', () => {
    const testOverrides = Map({
      1: true,
      2: false,
    });
    const testInitialState = testMakeCheckedSelectionStore.initialState.set('overrides', testOverrides);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStore.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(1);

    const overrides = testState.getIn(['overrides']);
    expect(
      overrides.getIn(['2']),
    ).to.be.false;
  });

  it('should toggle a single item and change all are selected to be false and remove the override at id 1, then toggle again and add it back', () => {
    const testOverrides = Map({
      1: true,
    });
    const testInitialState = testMakeCheckedSelectionStore.initialState.set('overrides', testOverrides);
    let testState = reducer(testInitialState, testMakeCheckedSelectionStore.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);

    testState = reducer(testState, testMakeCheckedSelectionStore.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    const overrides = testState.getIn(['overrides']);
    expect(
      overrides.getIn(['1']),
    ).to.be.true;
  });
});

describe('makeCheckedSelectionStore reducer with selected by default set to true', () => {
  const reducer = testMakeCheckedSelectionStoreWithDefaultSelected.reducer;

  it('should toggle all to be selected as false and their default selection state to be false', () => {
    const testState = reducer(testMakeCheckedSelectionStoreWithDefaultSelected.initialState, testMakeCheckedSelectionStoreWithDefaultSelected.toggleSelectAll());
    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.false;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle all to be selected and their default selection state to be true and remove all overrides', () => {
    const testOverrides = Map({
      1: true,
      2: false,
    });
    const testInitialState = testMakeCheckedSelectionStoreWithDefaultSelected.initialState.set('overrides', testOverrides);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStoreWithDefaultSelected.toggleSelectAll());

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.false;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle all to be not selected and their default selection state to be false', () => {
    const testInitialState = testMakeCheckedSelectionStoreWithDefaultSelected.initialState.set('areAllSelected', true);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStoreWithDefaultSelected.toggleSelectAll());

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.false;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle all to be not selected and their default selection state to be false and remove all overrides', () => {
    const testOverrides = Map({
      1: true,
      2: false,
    });
    let testInitialState = testMakeCheckedSelectionStoreWithDefaultSelected.initialState.set('overrides', testOverrides);
    testInitialState = testInitialState.set('areAllSelected', true);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStoreWithDefaultSelected.toggleSelectAll());

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.false;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle a single item and leave are selected to be set as false and create an override set to false at id 1 then toggle it again and remove the override', () => {
    let testState = reducer(testMakeCheckedSelectionStoreWithDefaultSelected.initialState, testMakeCheckedSelectionStoreWithDefaultSelected.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.true;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    const overrides = testState.getIn(['overrides']);
    expect(
      overrides.getIn(['1']),
    ).to.be.false;

    testState = reducer(testState, testMakeCheckedSelectionStoreWithDefaultSelected.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.true;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.true;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });

  it('should toggle a single item and change all are selected from true to be false and create an override set to false at id 1', () => {
    const testInitialState = testMakeCheckedSelectionStoreWithDefaultSelected.initialState.set('areAllSelected', true);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStoreWithDefaultSelected.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.true;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.false;

    const overrides = testState.getIn(['overrides']);
    expect(
      overrides.getIn(['1']),
    ).to.be.false;
  });

  it('should toggle a single item and change all are selected to be true and remove the override at id 1', () => {
    const testOverrides = Map({
      1: true,
    });
    const testInitialState = testMakeCheckedSelectionStoreWithDefaultSelected.initialState.set('overrides', testOverrides);
    const testState = reducer(testInitialState, testMakeCheckedSelectionStoreWithDefaultSelected.toggleSingleItem({id: '1'}));

    expect(
      testState.getIn(['defaultSelectionState']),
    ).to.be.true;

    expect(
      testState.getIn(['areAllSelected']),
    ).to.be.true;

    expect(
      testState.getIn(['overrides']).size,
    ).to.equal(0);
  });
});

describe('makeCheckedSelectionStore getItemCheckedState', () => {
  it('should return any overrides of a given id found in state', () => {
    const testOverrides = Map({
      1: true,
      2: false,
    });

    const testItemCheckedState = testMakeCheckedSelectionStore.getItemCheckedState(testOverrides, '1', false);

    expect(
      testItemCheckedState,
    ).to.equal(
      true,
    );
  });

  it('should return false if no overrides matching a given id are found and isCheckedByDefault is false', () => {
    const testOverrides = Map({
      1: true,
      2: false,
    });

    const testItemCheckedState = testMakeCheckedSelectionStore.getItemCheckedState(testOverrides, '3', false);

    expect(
      testItemCheckedState,
    ).to.equal(
      false,
    );
  });

  it('should return true if no overrides matching a given id are found and isCheckedByDefault is true', () => {
    const testOverrides = Map({
      1: true,
      2: false,
    });

    const testItemCheckedState = testMakeCheckedSelectionStore.getItemCheckedState(testOverrides, '3', true);

    expect(
      testItemCheckedState,
    ).to.equal(
      true,
    );
  });

  it('should return false if no overrides are provided and isCheckedByDefault is false', () => {
    const testItemCheckedState = testMakeCheckedSelectionStore.getItemCheckedState(undefined, '1', false);

    expect(
      testItemCheckedState,
    ).to.equal(
      false,
    );
  });

  it('should return true if no overrides are provided and isCheckedByDefault is true', () => {
    const testItemCheckedState = testMakeCheckedSelectionStore.getItemCheckedState(undefined, '1', true);

    expect(
      testItemCheckedState,
    ).to.equal(
      true,
    );
  });
});
