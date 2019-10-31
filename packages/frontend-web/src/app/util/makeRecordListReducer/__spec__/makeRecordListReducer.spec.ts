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
import { createAction } from 'redux-actions';
import { makeRecordListReducer } from '../makeRecordListReducer';

const testStartEvent = createAction<any>('TEST_START_EVENT');
const testEndEvent = createAction<any>('TEST_END_EVENT');

const testMakeRecordListReducer = makeRecordListReducer<any>(testStartEvent.toString(), testEndEvent.toString());
const reducer = testMakeRecordListReducer.reducer;

const testData = Map({
  jsonapi: {
    version: '1.0',
  },
  data: [
    {
      id: '1',
      type: 'categories',
      attributes: {
        label: 'business',
        isActive: true,
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      },
      links: {
        self: '',
      },
      relationships: {
        articles: {
          links: {
            self: '',
            related: '',
          },
        },
        users: {
          links: {
            self: '',
            related: '',
          },
        },
      },
    },
    {
      id: 2,
      type: 'categories',
      attributes: {
        label: 'business',
        isActive: true,
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      },
      links: {
        self: '',
      },
      relationships: {
        articles: {
          links: {
            self: '',
            related: '',
          },
        },
        users: {
          links: {
            self: '',
            related: '',
          },
        },
      },
    },
  ],
  included: [],
  meta: {},
});

describe('makeRecordListReducer reducer', () => {
  it('should detect an event has started', () => {
    const testState = reducer(testMakeRecordListReducer.initialState, testStartEvent(''));
    expect(testState.isFetching).to.be.true;
  });

  it('should detect an event has ended', () => {
    let testState = reducer(testMakeRecordListReducer.initialState, testStartEvent(''));
    expect(testState.isFetching).to.be.true;

    testState = reducer(testState, testEndEvent(testData));
    expect(testState.isFetching).to.be.false;
    expect(testState.hasData).to.be.true;
    expect(testState.items.get(0).id).to.equal(
      testData.getIn(['data'], 0).id,
    );
  });

  it('should add a record', () => {
    const testState = reducer(testMakeRecordListReducer.initialState, testMakeRecordListReducer.addRecord(testData));
    expect(testState.items.size).to.equal(1);
  });

  it('should add a second record', () => {
    let testState = reducer(testMakeRecordListReducer.initialState, testMakeRecordListReducer.addRecord(testData));
    expect(testState.items.size).to.equal(1);

    testState = reducer(testState, testMakeRecordListReducer.addRecord(testData));
    expect(testState.items.size).to.equal(2);
  });

  it('should update a record', () => {
    let testState = reducer(testMakeRecordListReducer.initialState, testMakeRecordListReducer.addRecord(testData));
    expect(testState.items.size).to.equal(1);

    const testRecord = Map({
      id: 3,
      type: 'articles',
      attributes: {
        label: 'business',
        isActive: true,
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      },
      links: {
        self: '',
      },
      relationships: {
        articles: {
          links: {
            self: '',
            related: '',
          },
        },
        users: {
          links: {
            self: '',
            related: '',
          },
        },
      },
    });

    testState = reducer(testState, testMakeRecordListReducer.updateRecord(testRecord));

    let checkedRecord = null;

    testState.items.forEach((item: any) => {
      if (item.get('id') === 3) {
        checkedRecord = item;
      }
    });

    expect(
      testRecord.equals(checkedRecord),
    ).to.be.true;
  });

  it('should remove a record', () => {
    let testState = reducer(testMakeRecordListReducer.initialState, testMakeRecordListReducer.addRecord(testData));
    expect(testState.items.size).to.equal(1);

    const testRecord = Map({
      id: 3,
      type: 'categories',
      attributes: {
        label: 'business',
        isActive: true,
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      },
      links: {
        self: '',
      },
      relationships: {
        articles: {
          links: {
            self: '',
            related: '',
          },
        },
        users: {
          links: {
            self: '',
            related: '',
          },
        },
      },
    });

    testState = reducer(testState, testMakeRecordListReducer.addRecord(testRecord));
    expect(testState.items.size).to.equal(2);

    testState = reducer(testState, testMakeRecordListReducer.removeRecord(testRecord));
    expect(testState.items.size).to.equal(1);
  });

  it('should remove a second record', () => {
    let testState = reducer(testMakeRecordListReducer.initialState, testMakeRecordListReducer.addRecord(testData));
    expect(testState.items.size).to.equal(1);

    const testRecordOne = Map({
      id: 3,
      type: 'categories',
      attributes: {
        label: 'business',
        isActive: true,
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      },
      links: {
        self: '',
        related: '',
      },
      relationships: {
        articles: {
          links: {
            self: '',
            related: '',
          },
        },
        users: {
          links: {
            self: '',
            related: '',
          },
        },
      },
    });

    testState = reducer(testState, testMakeRecordListReducer.addRecord(testRecordOne));
    expect(testState.items.size).to.equal(2);

    const testRecordTwo = Map({
      id: 4,
      type: 'articles',
      attributes: {
        label: 'business',
        isActive: true,
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      },
      links: {
        self: '',
      },
      relationships: {
        articles: {
          links: {
            self: '',
            related: '',
          },
        },
        users: {
          links: {
            self: '',
            related: '',
          },
        },
      },
    });

    testState = reducer(testState, testMakeRecordListReducer.addRecord(testRecordTwo));

    expect(testState.items.size).to.equal(3);

    testState = reducer(testState, testMakeRecordListReducer.removeRecord(testRecordOne));

    expect(testState.items.size).to.equal(2);

    let expectedItem = null;

    testState.items.forEach((item: any) => {
      if (item.get('id') === 4) {
        expectedItem = item;
      }
    });

    expect(
      testRecordTwo.equals(expectedItem),
    ).to.be.true;

    testState = reducer(testState, testMakeRecordListReducer.removeRecord(testRecordTwo));
    expect(testState.items.size).to.equal(1);
  });
});
