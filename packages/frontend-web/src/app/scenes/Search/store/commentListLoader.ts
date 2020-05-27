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

import { pick } from 'lodash';

import { IAppDispatch } from '../../../appstate';
import { search } from '../../../platform/dataService';
import { loadTextSizesByIds } from '../../../stores/textSizes';
import { storeCommentPagingOptions } from '../../Comments/components/CommentDetail/store';
import { searchLink } from '../../routes';
import { ISearchScope } from '../types';
import { setCurrentPagingIdentifier } from './currentPagingIdentifier';
import { loadAllCommentIdsComplete, loadAllCommentIdsStart } from './searchResults';

export async function loadCommentList(
  dispatch: IAppDispatch,
  scope: ISearchScope,
) {
  dispatch(loadAllCommentIdsStart);
  const { term, params } = scope;
  const commentIds = await search(term, params);
  dispatch(loadAllCommentIdsComplete(commentIds));

  const query = {
    ...pick(params, ['articleId', 'searchByAuthor', 'sort']),
    term,
  };
  const link = searchLink(query);

  const currentPagingIdentifier = await dispatch(storeCommentPagingOptions({
    commentIds,
    fromBatch: true,
    source: `Comment %i of ${commentIds.length} from search for "${term}"`,
    link,
  }));

  dispatch(setCurrentPagingIdentifier({ currentPagingIdentifier }));

  const bodyContentWidth = 696;

  await dispatch(loadTextSizesByIds(commentIds, bodyContentWidth));
}
