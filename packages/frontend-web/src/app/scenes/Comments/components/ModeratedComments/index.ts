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

import { Set } from 'immutable';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { createStructuredSelector } from 'reselect';
import { ICommentModel } from '../../../../../models';
import { ICommentAction } from '../../../../../types';
import { getMyUserId } from '../../../../auth';
import { IAppDispatch, IAppStateRecord } from '../../../../stores';
import { getArticle } from '../../../../stores/articles';
import {
  changeColumnSortGroupDefault,
  getCurrentColumnSort,
} from '../../../../stores/columnSorts';
import {
  getSummaryScoresById,
  loadCommentSummaryScores,
} from '../../../../stores/commentSummaryScores';
import { getTaggableTags } from '../../../../stores/tags';
import { getTextSizes } from '../../../../stores/textSizes';
import {
  adjustTabCount,
  getSummaryScoresAboveThreshold,
  getTaggingSensitivitiesInCategory,
} from '../../store';
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

type IModeratedCommentsRouterProps = Pick<
  IModeratedCommentsProps,
  'params'
>;

type IModeratedCommentsOwnProps = {};

type IModeratedCommentsDispatchWithoutOverwriteProps = Pick<
  IModeratedCommentsProps,
  'adjustTabCount' |
  'toggleSelectAll' |
  'toggleSingleItem' |
  'setCommentModerationStatusForArticle' |
  'setCommentModerationStatusForCategory' |
  'loadScoresForCommentId' |
  'changeSort'
>;

type IModeratedCommentsDispatchWithOverwriteProps = IModeratedCommentsDispatchWithoutOverwriteProps & {
  loadData?(categoryId: string, articleId: string, tag: string): void;
  tagComments(ids: Array<string>, tagId: string, userId: string): any;
  dispatchAction(action: ICommentAction, idsToDispatch: Array<string>, userId: string): any;
};

type IModeratedCommentsDispatchProps = IModeratedCommentsDispatchWithoutOverwriteProps & Pick<
  IModeratedCommentsProps,
  'loadData' |
  'tagComments' |
  'dispatchAction'
>;

type IModeratedCommentsStateProps = Pick<
  IModeratedCommentsProps,
  'commentIds' |
  'allModeratedCommentIds' |
  'isLoading' |
  'article' |
  'areNoneSelected' |
  'areAllSelected' |
  'isItemChecked' |
  'moderatedComments' |
  'urlPrefix' |
  'actionLabel' |
  'tags' |
  'getCurrentColumnSort' |
  'getLinkTarget' |
  'textSizes'
>;

type IModeratedCommentsStatePropsWithUser = {
  userId: string;
};

const mapStateToProps = createStructuredSelector({
  commentIds: (state: IAppStateRecord, { params }: IModeratedCommentsRouterProps) => {
    return getModeratedComments(state, params).get(params.tag);
  },

  allModeratedCommentIds: (state: IAppStateRecord, { params }: IModeratedCommentsRouterProps) => {
    return getModeratedComments(state, params)
      .reduce((sum, tagList) => sum.union(tagList.toSet()), Set())
      .toList();
  },

  isLoading: (state: IAppStateRecord) => getCommentListIsLoading(state) || !getCommentListHasLoaded(state),

  article: (state: IAppStateRecord, { params }: IModeratedCommentsRouterProps) => {
    if (params.articleId) {
      return getArticle(state, params.articleId);
    }
  },

  areNoneSelected: getAreAnyCommentsSelected,

  areAllSelected: getAreAllSelected,

  isItemChecked: (state: IAppStateRecord) => (id: string) => getIsItemChecked(state, id),

  moderatedComments: (state: IAppStateRecord, { params }: IModeratedCommentsRouterProps) => (
    getModeratedComments(state, params)
  ),

  urlPrefix: (_: any, { params }: IModeratedCommentsRouterProps) => {
    return !!params.articleId
        ? `/articles/${params.articleId}/moderated`
        : `/categories/${params.categoryId}/moderated`;
  },

  actionLabel: (_: any, { params }: IModeratedCommentsRouterProps) => params.tag,

  tags: getTaggableTags,

  getTagIdsAboveThresholdByCommentId: (state: IAppStateRecord, { params }: IModeratedCommentsRouterProps) => (id: string): Set<string> => {
    if (!id) {
      return;
    }

    const scores = getSummaryScoresAboveThreshold(
      getTaggingSensitivitiesInCategory(state, params.categoryId, params.articleId),
      getSummaryScoresById(state, id),
    );

    return scores && scores.map((score) => score.tagId).toSet();
  },

  getCurrentColumnSort: (state: IAppStateRecord) => {
    return (key: string) => getCurrentColumnSort(state, 'commentsIndexModerated', key);
  },

  getLinkTarget: (state: any, { params }: IModeratedCommentsRouterProps) => {
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

  userId: (state: IAppStateRecord) => getMyUserId(state),
}) as (state: IAppStateRecord, ownProps: IModeratedCommentsOwnProps) => IModeratedCommentsStateProps & IModeratedCommentsStatePropsWithUser;

function mapDispatchToProps(dispatch: IAppDispatch, ownProps: IModeratedCommentsOwnProps & IModeratedCommentsRouterProps): IModeratedCommentsDispatchWithOverwriteProps {
  const {
    isArticleDetail,
    articleId,
    categoryId,
    tag,
  } = parseRoute(ownProps.params);

  const actionMap: {
    [key: string]: (ids: Array<string>, userId: string, tagId?: string) => any;
  } = {
    highlight: highlightComments,
    approve: tag === 'flagged' ? approveFlagsAndComments : approveComments,
    defer: deferComments,
    reject: tag === 'flagged' ? rejectFlagsAndComments : rejectComments,
    tag: tagCommentSummaryScores,
    reset: resetComments,
  };

  return {
    loadData: (cId: string, aId: string, t: string) => {
      dispatch(executeCommentListLoader(!!aId, aId, cId, t));
    },

    tagComments: (ids: Array<string>, tagId: string, userId: string) =>
        dispatch(tagCommentSummaryScores(ids, userId, tagId)),

    dispatchAction: (action: ICommentAction, idsToDispatch: Array<string>, userId: string) =>
        dispatch(actionMap[action](idsToDispatch, userId)),

    toggleSelectAll: () => dispatch(toggleSelectAll()),

    adjustTabCount: ({ field, amount }: { field: string, amount: number }) => dispatch(adjustTabCount({ field, amount })),

    toggleSingleItem: ({ id }: { id: string }) => dispatch(toggleSingleItem({ id })),

    setCommentModerationStatusForArticle: (commentIds: Array<string>, moderationAction: string, currentModeration: string) =>
        dispatch(setCommentsModerationForArticle(articleId, commentIds, moderationAction, currentModeration)),

    setCommentModerationStatusForCategory: (commentIds: Array<string>, moderationAction: string, currentModeration: string) =>
        dispatch(setCommentsModerationForCategory(categoryId, commentIds, moderationAction, currentModeration)),

    loadScoresForCommentId: async (id: string) => {
      await dispatch(loadCommentSummaryScores(id));
    },

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

function mergeProps(
  stateProps: IModeratedCommentsStateProps & IModeratedCommentsStatePropsWithUser,
  dispatchProps: IModeratedCommentsDispatchWithOverwriteProps,
  ownProps: IModeratedCommentsOwnProps,
): IModeratedCommentsStateProps & IModeratedCommentsStatePropsWithUser & IModeratedCommentsDispatchProps {
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    dispatchAction: (action: ICommentAction, idsToDispatch: Array<string>) =>
        dispatchProps.dispatchAction(action, idsToDispatch, stateProps.userId),
    tagComments: (ids: Array<string>, tagId: string) =>
        dispatchProps.tagComments(ids, tagId, stateProps.userId),
  };
}

// Add Redux data.
const ConnectedModeratedComments = connect<IModeratedCommentsStateProps , IModeratedCommentsDispatchProps | IModeratedCommentsDispatchWithOverwriteProps, IModeratedCommentsOwnProps>(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(PureModeratedComments);

// Add `router` prop.
export const ModeratedComments: React.ComponentClass = withRouter(ConnectedModeratedComments);

export * from './store';
