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
import { contextInjector } from '../../../../injectors/contextInjector';
import { getPreselects } from '../../../../stores/preselects';
import { getRules } from '../../../../stores/rules';
import { getTaggableTags } from '../../../../stores/tags';
import { getTextSizes, getTextSizesIsLoading } from '../../../../stores/textSizes';
import {
  INewCommentsPathParams,
} from '../../../routes';
import {
  INewCommentsProps,
  NewComments as PureNewComments,
} from './NewComments';
import {
  getAreAllSelected,
  getAreAnyCommentsSelected,
  getCommentScores,
  getCurrentPagingIdentifier,
  getIsItemChecked,
  getIsLoading,
  getSelectedTag,
  loadCommentList,
  removeCommentScore,
  toggleSelectAll,
  toggleSingleItem,
} from './store';

function mapDispatchToProps(dispatch: IAppDispatch): Partial<INewCommentsProps> {
  return {
    removeCommentScore: (idsToDispatch: Array<string>) => dispatch(removeCommentScore(idsToDispatch)),

    toggleSelectAll: () => dispatch(toggleSelectAll()),

    toggleSingleItem: ({ id }: { id: string }) => dispatch(toggleSingleItem({ id })),

    loadData: async (params: INewCommentsPathParams, pos1: number, pos2: number, sort: string): Promise<void> => {
      await dispatch(loadCommentList(params, pos1, pos2, sort));
    },
  };
}

const mapStateToProps = createStructuredSelector({
  preselects: getPreselects,

  commentScores: getCommentScores,

  isLoading: (state: IAppState) => getIsLoading(state) || getTextSizesIsLoading(state),

  areNoneSelected: getAreAnyCommentsSelected,

  areAllSelected: getAreAllSelected,

  isItemChecked: (state: IAppState) => (id: string) => getIsItemChecked(state, id),

  textSizes: getTextSizes,

  tags: getTaggableTags,

  selectedTag: (state: IAppState, { match: { params }}: INewCommentsProps) => {
    return getSelectedTag(state, params.tag);
  },

  rules: getRules,

  pagingIdentifier: getCurrentPagingIdentifier,
});

export const NewComments = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  contextInjector,
)(PureNewComments) as any;

export * from './store';
