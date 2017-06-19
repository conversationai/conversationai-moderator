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

import { storiesOf} from '@kadira/storybook';
import { AuthorModelRecord, IAuthorModel } from '../../../models';
import { fakeCommentModel } from '../../../models/fake';
import { BasicBody, LinkedBasicBody } from '../LazyLoadComment';

const author = AuthorModelRecord({
  email: 'name@email.com',
  location: 'NYC',
  name: 'Bridie Skiles V',
  avatar: 'https://s3.amazonaws.com/pimage.example.com/4405/3468/cropped-44053468.jpg',
}) as IAuthorModel;

const comment = fakeCommentModel({
  id: '-1',
  replyId: null,
  isAccepted: true,
  isDeferred: false,
  isModerated: true,
  isHighlighted: false,
  sourceCreatedAt: null,
  authorSourceId: 'author1',
  author,
  flaggedCount: 1,
  recommendedCount: 20,
  text: 'Founded in 1965 by Albert Griffiths, The Gladiators has released some of the most mythical songs of Jamaican reggae. Their first hit, the single Hello Carol, was released in 1968. In 1976, thanks to their signature at Virgin, the trilogy Trenchtown Mix Up, Proverbial Reggae and Naturality has been distributed all around the world and some of the songs of these albums have become classics of the reggae as Mix Up and Roots Natty Roots.',
});

const returnEmpty = () => '';
const returnFalse = () => false;

storiesOf('CommentBody', {})
  .add('Basic', () => {
    return (
      <div>
        <BasicBody
          comment={comment}
          dispatchConfirmedAction={returnFalse}
        />
      </div>
    );
  })
  .add('Linked', () => {
    return (
      <div>
        <LinkedBasicBody
          getLinkTarget={returnEmpty}
          comment={comment}
          dispatchConfirmedAction={returnFalse}
        />
      </div>
    );
  })
  .add('Hide Comment cAtion', () => {
    return (
      <div>
        <BasicBody
          hideCommentAction
          comment={comment}
          dispatchConfirmedAction={returnFalse}
        />
      </div>
    );
  });
