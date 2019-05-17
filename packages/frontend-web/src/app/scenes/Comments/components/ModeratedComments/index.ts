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
import { createStructuredSelector } from 'reselect';
import { ICommentModel } from '../../../../../models';
import { ICommentAction } from '../../../../../types';
import { IAppDispatch, IAppStateRecord } from '../../../../stores';
import { getArticle } from '../../../../stores/articles';
import {
  changeColumnSortGroupDefault,
  getCurrentColumnSort,
} from '../../../../stores/columnSorts';
import { getTaggableTags } from '../../../../stores/tags';
import { getTextSizes } from '../../../../stores/textSizes';
import { IModeratedCommentsProps, ModeratedComments as PureModeratedComments } from './ModeratedComments';
import {
  executeCommentListLoader,
  getAreAllSelected,
  getAreAnyCommentsSelected,
  getCommentListHasLoaded,
  getCommentListIsLoading,
  getCurrentPagingIdentifier,
  getIsItemChecked,
  getModeratedComments,
  parseRoute,
  setCommentsModerationForArticle,
  setCommentsModerationForCategory,
  toggleSelectAll,
  toggleSingleItem,
} from './store';

import {
  approveComments,
  approveFlagsAndComments,
  deferComments,
  highlightComments,
  rejectComments,
  rejectFlagsAndComments,
  resetComments,
  tagCommentSummaryScores,
} from '../../../../stores/commentActions';

type IModeratedCommentsDispatchProps = Pick<
  IModeratedCommentsProps,
  'toggleSelectAll' |
  'toggleSingleItem' |
  'setCommentModerationStatusForArticle' |
  'setCommentModerationStatusForCategory' |
  'changeSort' |
  'loadData' |
  'tagComments' |
  'dispatchAction'
>;

type IModeratedCommentsStateProps = Pick<
  IModeratedCommentsProps,
  'isLoading' |
  'article' |
  'areNoneSelected' |
  'areAllSelected' |
  'isItemChecked' |
  'moderatedComments' |
  'tags' |
  'getCurrentColumnSort' |
  'getLinkTarget' |
  'textSizes'
>;

const mapStateToProps = createStructuredSelector({
  isLoading: (state: IAppStateRecord) => getCommentListIsLoading(state) || !getCommentListHasLoaded(state),

  article: (state: IAppStateRecord, { params }: IModeratedCommentsProps) => {
    if (params.articleId) {
      return getArticle(state, params.articleId);
    }
  },

  areNoneSelected: getAreAnyCommentsSelected,

  areAllSelected: getAreAllSelected,

  isItemChecked: (state: IAppStateRecord) => (id: string) => getIsItemChecked(state, id),

  moderatedComments: (state: IAppStateRecord, { params }: IModeratedCommentsProps) => (
    getModeratedComments(state, params)
  ),

  tags: getTaggableTags,

  getCurrentColumnSort: (state: IAppStateRecord) => {
    return (key: string) => getCurrentColumnSort(state, 'commentsIndexModerated', key);
  },

  getLinkTarget: (state: any, { params }: IModeratedCommentsProps) => {
    const identifier = getCurrentPagingIdentifier(state);

    return (comment: ICommentModel): string => {
      let url: string;

      if (params.articleId) {
        url = `/articles/${params.articleId}/comments/${comment.id}`;
      } else {
        url = `/categories/${params.categoryId}/comments/${comment.id}`;
      }

      if (identifier) {
        url = `${url}?pagingIdentifier=${identifier}`;
      }

      return url;
    };
  },

  textSizes: getTextSizes,
});

function mapDispatchToProps(dispatch: IAppDispatch, ownProps: IModeratedCommentsProps): IModeratedCommentsDispatchProps {
  const {
    isArticleDetail,
    articleId,
    categoryId,
    tag,
  } = parseRoute(ownProps.params);

  const actionMap: {
    [key: string]: (ids: Array<string>, tagId?: string) => any;
  } = {
    highlight: highlightComments,
    approve: tag === 'flagged' ? approveFlagsAndComments : approveComments,
    defer: deferComments,
    reject: tag === 'flagged' ? rejectFlagsAndComments : rejectComments,
    tag: tagCommentSummaryScores,
    reset: tag === 'flagged' ? approveFlagsAndComments : resetComments,
  };

  return {
    loadData: (cId: string, aId: string, t: string) => {
      dispatch(executeCommentListLoader(!!aId, aId, cId, t));
    },

    tagComments: (ids: Array<string>, tagId: string) =>
        dispatch(tagCommentSummaryScores(ids, tagId)),

    dispatchAction: (action: ICommentAction, idsToDispatch: Array<string>) =>
        dispatch(actionMap[action](idsToDispatch)),

    toggleSelectAll: () => dispatch(toggleSelectAll()),

    toggleSingleItem: ({ id }: { id: string }) => dispatch(toggleSingleItem({ id })),

    setCommentModerationStatusForArticle: (commentIds: Array<string>, moderationAction: string, currentModeration: string) =>
        dispatch(setCommentsModerationForArticle(articleId, commentIds, moderationAction, currentModeration)),

    setCommentModerationStatusForCategory: (commentIds: Array<string>, moderationAction: string, currentModeration: string) =>
        dispatch(setCommentsModerationForCategory(categoryId, commentIds, moderationAction, currentModeration)),

    changeSort: async (newSort: string): Promise<void> => {
      await dispatch(changeColumnSortGroupDefault({
        group: 'commentsIndexModerated',
        key: newSort,
      }));

      await dispatch(executeCommentListLoader(
        isArticleDetail,
        articleId,
        categoryId,
        tag,
      ));
    },
  };
}

// Add Redux data.
const ConnectedModeratedComments = connect<IModeratedCommentsStateProps , IModeratedCommentsDispatchProps>(
  mapStateToProps,
  mapDispatchToProps,
)(PureModeratedComments);

// Add `router` prop.
export const ModeratedComments: React.ComponentClass = withRouter(ConnectedModeratedComments);

export * from './store';
