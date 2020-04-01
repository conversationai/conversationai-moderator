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

import { storiesOf } from '@storybook/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { IAuthorModel } from '../../../../../../../models';
import { fakeCommentModel } from '../../../../../../../models/fake';
import { css } from '../../../../../../utilx';
import { ThreadedComment } from './ThreadedComment';

async function doNothing() {/**/}

const author = {
  email: 'name@email.com',
  location: 'NYC',
  name: 'Bridie Skiles IV',
} as IAuthorModel;

const replies = [
  fakeCommentModel({
    isDeferred: true,
    isAccepted: null,
    isModerated: false,
    isHighlighted: false,
    sourceCreatedAt: null,
    authorSourceId: 'author2',
    author,
    unresolvedFlagsCount: 2,
    flagsSummary: new Map([['red', [1, 0, 1]], ['green', [2, 2, 0]]]),
    text: 'First reply comment text is here. This comment is marked Deferred.',
  }),
  fakeCommentModel({
    isHighlighted: true,
    isAccepted: null,
    isDeferred: false,
    isModerated: true,
    sourceCreatedAt: null,
    authorSourceId: 'author3',
    author,
    unresolvedFlagsCount: 1 ,
    flagsSummary: new Map([['red', [1, 0, 0]], ['green', [2, 1, 0]]]),
    text: 'Second reply comment text is here. This comment is marked Highlighted.',
  }),
  fakeCommentModel({
    isAccepted: false,
    isDeferred: false,
    isModerated: true,
    isHighlighted: false,
    sourceCreatedAt: null,
    authorSourceId: 'author4',
    author,
    unresolvedFlagsCount: 20,
    flagsSummary: new Map([
      ['red', [5, 3, 5]],
      ['green', [15, 10, 15]],
      ['blue', [10, 7, 10]],
    ]),
    text: 'Third reply comment text is here. This comment is marked Rejected.',
  }),
  fakeCommentModel({
    isAccepted: null,
    isDeferred: false,
    isModerated: false,
    isHighlighted: false,
    sourceCreatedAt: null,
    authorSourceId: 'author5',
    author,
    unresolvedFlagsCount: 0,
    text: 'Fourth reply comment text is here. This comment has not yet been moderated.',
  }),
];

const comment = fakeCommentModel({
  isAccepted: true,
  isDeferred: false,
  isModerated: true,
  isHighlighted: false,
  sourceCreatedAt: null,
  authorSourceId: 'author1',
  author,
  unresolvedFlagsCount: 1,
  flagsSummary: new Map([['red', [1, 0, 0]], ['green', [2, 1, 2]]]),
  text: 'Originating comment text is here',
  replies: replies.map((r) => r.id),
});

const STORY_STYLES = {
  base: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.1)',
    padding: '20px 0',
  },

  detail: {
    maxWidth: '700px',
    margin: '0 auto',
    background: '#fff',
  },
};

storiesOf('ThreadedComment', module)
  .addDecorator((story) => (
    <MemoryRouter initialEntries={['/']}>{story()}</MemoryRouter>
  ))
  .add('default list', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <div {...css(STORY_STYLES.detail)}>
          <ThreadedComment
            comment={comment}
            handleAssignTagsSubmit={doNothing}
          />
        </div>
      </div>
    );
  });
