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

import { action, storiesOf } from '@kadira/storybook';
import { AuthorModelRecord, IAuthorModel } from '../../../models';
import { fakeCommentModel } from '../../../models/fake';
import { css } from '../../util';
import { SingleComment } from '../SingleComment';

const date = new Date(2016, 10, 30);

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
  flaggedCount: 2,
  recommendedCount: 5,
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

storiesOf('SingleComment', {})
  .add('default list', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <div {...css(STORY_STYLES.detail)}>
          <SingleComment comment={comment} />
        </div>
      </div>
    );
  })
  .add('read only', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <div {...css(STORY_STYLES.detail)}>
          <SingleComment comment={comment} />
        </div>
      </div>
    );
  })
  .add('default moderating', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <div {...css(STORY_STYLES.detail)}>
          <SingleComment comment={comment} />
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
            onUpdateCommentText={action('Updating Comment')}
          />
        </div>
      </div>
    );
  })

  ;
