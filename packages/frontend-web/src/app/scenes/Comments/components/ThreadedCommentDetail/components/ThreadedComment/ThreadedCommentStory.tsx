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

import { AuthorModelRecord, IAuthorModel } from '../../../../../../../models';
import { fakeCommentModel } from '../../../../../../../models/fake';
import { css } from '../../../../../../utilx';
import { ThreadedComment } from './ThreadedComment';
import {List} from 'immutable';

const author = AuthorModelRecord({
  email: 'name@email.com',
  location: 'NYC',
  name: 'Bridie Skiles IV',
}) as IAuthorModel;

const comment = fakeCommentModel({
  isAccepted: true,
  isDeferred: false,
  isModerated: true,
  isHighlighted: false,
  sourceCreatedAt: null,
  authorSourceId: 'author1',
  author,
  flagsCount: 3,
  unresolvedFlagsCount: 1,
  flagsSummary: new Map([['red', List([1, 0])], ['green', List([2, 1])]]),
  text: 'Orginating comment text is here',
});
const replies = [
  fakeCommentModel({
    isDeferred: true,
    isAccepted: null,
    isModerated: false,
    isHighlighted: false,
    sourceCreatedAt: null,
    authorSourceId: 'author2',
    author,
    flagsCount: 3,
    unresolvedFlagsCount: 2,
    flagsSummary: new Map([['red', List([1, 0])], ['green', List([2, 2])]]),
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
    flagsCount: 3,
    unresolvedFlagsCount: 1 ,
    flagsSummary: new Map([['red', List([1, 0])], ['green', List([2, 1])]]),
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
    flagsCount: 30,
    unresolvedFlagsCount: 20,
    flagsSummary: new Map([
      ['red', List([5, 3])],
      ['green', List([15, 10])],
      ['blue', List([10, 7])],
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
    flagsCount: 0,
    unresolvedFlagsCount: 0,
    text: 'Fourth reply comment text is here. This comment has not yet been moderated.',
  }),
];

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
  .add('default list', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <div {...css(STORY_STYLES.detail)}>
          <ThreadedComment
            comment={comment}
            replies={replies}
          />
        </div>
      </div>
    );
  });
