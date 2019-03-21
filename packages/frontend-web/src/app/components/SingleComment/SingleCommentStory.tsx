/*
Copyright 2019 Google Inc.

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
import faker from 'faker';
import { fromJS, List } from 'immutable';

import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react';

import { AuthorModelRecord, IAuthorModel, ITagModel } from '../../../models';
import { fakeCommentFlagModel, fakeCommentModel, fakeTagModel } from '../../../models/fake';
import { css } from '../../utilx';
import { SingleComment } from './SingleComment';

const date = new Date(2016, 10, 30);

faker.seed(789);

const author = AuthorModelRecord({
  email: 'name@email.com',
  location: 'NYC',
  name: 'Bridie Skiles IV',
  avatar: 'https://s3.amazonaws.com/pimage.example.com/7778/5652/cropped-77785652.jpg',
}) as IAuthorModel;

const comment = fakeCommentModel({
  authorSourceId: 'test',
  author,
  sourceCreatedAt: date.toString(),
  unresolvedFlagsCount: 2,
  flagsSummary: new Map([['red', List([1, 0, 0])], ['green', List([2, 2, 2])]]),
});

const flags = fromJS([
  fakeCommentFlagModel({label: 'red', isResolved: true, isRecommendation: false}),
  fakeCommentFlagModel({label: 'green', isResolved: false, isRecommendation: true}),
  fakeCommentFlagModel({label: 'green', isResolved: false, isRecommendation: true}),
]);

const availableTags = List<ITagModel>().push(fakeTagModel({}), fakeTagModel({}));

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

storiesOf('SingleComment', module)
  .add('base', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <div {...css(STORY_STYLES.detail)}>
          <SingleComment
            comment={comment}
            flags={flags}
          />
        </div>
      </div>
    );
  })
  .add('has url', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <div {...css(STORY_STYLES.detail)}>
          <SingleComment
            comment={comment}
            flags={flags}
            url="http://www.example.com/"
          />
        </div>
      </div>
    );
  })
  .add('can edit comment', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <div {...css(STORY_STYLES.detail)}>
          <SingleComment
            comment={comment}
            flags={flags}
            commentEditingEnabled
            onUpdateCommentText={action('Updating Comment')}
          />
        </div>
      </div>
    );
  })
  .add('tags to add', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <div {...css(STORY_STYLES.detail)}>
          <SingleComment
            comment={comment}
            flags={flags}
            availableTags={availableTags}
          />
        </div>
      </div>
    );
  })
;
