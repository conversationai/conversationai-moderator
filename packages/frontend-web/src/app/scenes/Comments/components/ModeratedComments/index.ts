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

import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { IAppDispatch, IAppState } from '../../../../appstate';
import { contextInjector, IContextInjectorProps } from '../../../../injectors/contextInjector';
import { getTaggableTags } from '../../../../stores/tags';
import { getTextSizes, getTextSizesIsLoading } from '../../../../stores/textSizes';
import { IModeratedCommentsPathParams, IModeratedCommentsQueryParams } from '../../../routes';
import {
  IModeratedCommentsProps,
  ModeratedComments as PureModeratedComments,
} from './ModeratedComments';
import {
  getAreAllSelected,
  getAreAnyCommentsSelected,
  getCurrentPagingIdentifier,
  getIsItemChecked,
  getIsLoading,
  getModeratedComments,
  loadCommentList,
  setCommentsModerationStatus,
  toggleSelectAll,
  toggleSingleItem,
} from './store';

type IModeratedCommentsDispatchProps = Pick<
  IModeratedCommentsProps,
  'toggleSelectAll' |
  'toggleSingleItem' |
  'setCommentModerationStatus' |
  'loadData'
>;

const mapStateToProps = createStructuredSelector({
  isLoading: (state: IAppState) => (getIsLoading(state) || getTextSizesIsLoading(state)),

  areNoneSelected: getAreAnyCommentsSelected,

  areAllSelected: getAreAllSelected,

  isItemChecked: (state: IAppState) => (id: string) => getIsItemChecked(state, id),

  moderatedComments: (state: IAppState, props: IModeratedCommentsProps) => (
    getModeratedComments(state, props.match.params)
  ),

  tags: getTaggableTags,

  pagingIdentifier: getCurrentPagingIdentifier,

  textSizes: getTextSizes,
});

function mapDispatchToProps(dispatch: IAppDispatch): IModeratedCommentsDispatchProps {
  return {
    loadData: (params: IModeratedCommentsPathParams, query: IModeratedCommentsQueryParams) => {
      dispatch(loadCommentList(params, query));
    },

    toggleSelectAll: () => dispatch(toggleSelectAll()),

    toggleSingleItem: ({ id }: { id: string }) => dispatch(toggleSingleItem({ id })),

    setCommentModerationStatus: (
      iprops: IContextInjectorProps,
      commentIds: Array<string>,
      moderationAction: string,
      currentModeration: string,
    ) =>
        setCommentsModerationStatus(dispatch, iprops, commentIds, moderationAction, currentModeration),
  };
}

// Add Redux data.
export const ModeratedComments: React.ComponentClass = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withRouter,
  contextInjector,
)(PureModeratedComments);

export * from './store';
