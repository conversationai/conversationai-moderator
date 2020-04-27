/*
Copyright 2020 Google Inc.

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
import { connect, useSelector } from 'react-redux';
import { RouteComponentProps } from 'react-router';

import { ModelId } from '../../models';
import { IAppState } from '../appstate';
import { ICommentDetailsPathParams } from '../scenes/routes';
import { getCachedComment, ICommentCacheProps } from './commentFetchQueue';

export interface ICommentInjectorInputProps {
  commentId: ModelId;
}

function getCommentFromCommentId(state: IAppState, {commentId}: ICommentInjectorInputProps): ICommentCacheProps {
  return getCachedComment(state, commentId);
}

export const commentInjector = connect(getCommentFromCommentId);

function getCommentFromRoute(state: IAppState, props: RouteComponentProps<ICommentDetailsPathParams>): ICommentCacheProps {
  return getCachedComment(state, props.match.params.commentId);
}

export const commentFromRouteInjector = connect(getCommentFromRoute);

export function useCachedComment(commentId: ModelId): ICommentCacheProps {
  return useSelector((state: IAppState) => getCachedComment(state, commentId));
}
