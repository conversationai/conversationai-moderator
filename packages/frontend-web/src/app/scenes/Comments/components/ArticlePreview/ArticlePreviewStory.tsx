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
import { List } from 'immutable';
import { fakeArticleModel, fakeUserModel } from '../../../../../models/fake';
import { ArticlePreview } from './ArticlePreview';

const article = fakeArticleModel({
  title: 'Article Title',
  text: 'Sint rerum quos voluptatem minima earum ut saepe. Quidem accusamus nostrum quisquam architecto excepturi voluptas reprehenderit nisi omnis. Et provident ut voluptate labore omnis aliquid. Rerum qui est dolorem et aliquid et eos dolore sit.',
  url: 'https://example.com',
});

const moderators = List([
  fakeUserModel({
    name: 'Moderator1',
  }),
  fakeUserModel({
    name: 'Moderator2',
  }),
]);

storiesOf('ArticlePreview', {})
    .add('With Title', () => (
      <ArticlePreview
        article={article}
        moderators={moderators}
        onAddModeratorClick={action('add moderator')}
        onClose={action('close preview')}
      />
    ));
