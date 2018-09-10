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
import { provideHooks } from 'redial';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import { IArticleModel, ICommentModel } from '../../../../../models';
import { IRedialLocals } from '../../../../../types';
import { ICommentAction } from '../../../../../types';
import { getMyUserId } from '../../../../auth';
import { IAppDispatch, IAppStateRecord } from '../../../../stores';
import {
  changeColumnSortGroupDefault,
  getCurrentColumnSort,
} from '../../../../stores/columnSorts';
import { getComment } from '../../../../stores/comments';
import {
  getSummaryScoresById,
  loadCommentSummaryScores,
} from '../../../../stores/commentSummaryScores';
import { loadPreselects } from '../../../../stores/preselects';
import { loadRules } from '../../../../stores/rules';
import { loadTaggingSensitivities } from '../../../../stores/taggingSensitivities';
import { getTaggableTags, loadTags } from '../../../../stores/tags';
import { getTextSizes } from '../../../../stores/textSizes';
import {
  adjustTabCount,
  getArticle,
  getSummaryScoresAboveThreshold,
  getTaggingSensitivitiesInCategory,
  updateArticleRecord,
  updateArticleStatus,
} from '../../store';
import { NewComments as PureNewComments } from './NewComments';
import {
  executeCommentListLoader,
  getAreAllSelected,
  getAreAnyCommentsSelected,
  getCommentIDsInRange,
  getCommentListHasLoaded,
  getCommentListIsLoading,
  getCommentScores,
  getCurrentPagingIdentifier,
  getDragHandlePosition1,
  getDragHandlePosition2,
  getIsItemChecked,
  getRulesInCategory,
  getSelectedTag,
  parseRouteAndQueryString,
  removeCommentScore,
  resetDragHandleScope,
  toggleSelectAll,
  toggleSingleItem,
} from './store';

import {
  approveComments,
  confirmCommentSummaryScore,
  deferComments,
  highlightComments,
  rejectComments,
  rejectCommentSummaryScore,
  tagCommentSummaryScores,
} from '../../../../stores/commentActions';

import {
  approveComment,
  deferComment,
  highlightComment,
  rejectComment,
} from '../../../../stores/comments';

const actionMap: {
  [key: string]: (ids: Array<string>, userId: string, tagId?: string) => any;
} = {
  highlight: highlightComments,
  approve: approveComments,
  defer: deferComments,
  reject: rejectComments,
  tag: tagCommentSummaryScores,
};

const moderationStatusMap: {
  [key: string]: (ids: Array<string>) => any;
} = {
  highlight: highlightComment,
  approve: approveComment,
  defer: deferComment,
  reject: rejectComment,
};

function mapDispatchToProps(dispatch: IAppDispatch, ownProps: any): any {
  const {
    isArticleDetail,
    articleId,
    category,
    tag,
    pos1,
    pos2,
  } = parseRouteAndQueryString(ownProps.params, ownProps.location.query);

  return {
    resetDragHandleScope: () => dispatch(resetDragHandleScope()),

    tagComments: (ids: Array<string>, tagId: string, userId: string) =>
        dispatch(tagCommentSummaryScores(ids, tagId, userId)),

    confirmCommentSummaryScore: (id: string, tagId: string, userId: string) =>
        dispatch(confirmCommentSummaryScore(id, tagId, userId)),

    rejectCommentSummaryScore: (id: string, tagId: string, userId: string) =>
        dispatch(rejectCommentSummaryScore(id, tagId, userId)),

    dispatchAction: (action: ICommentAction, idsToDispatch: Array<string>, userId: string) =>
        dispatch(actionMap[action](idsToDispatch, userId)),

    setCommentModerationStatus: (commentIds: Array<string>, moderationAction: string) =>
        dispatch(moderationStatusMap[moderationAction](commentIds)),

    removeCommentScore: (idsToDispatch: Array<string>) => dispatch(removeCommentScore(idsToDispatch)),

    adjustTabCount: ({ field, amount }: { field: string, amount: number }) => dispatch(adjustTabCount({ field, amount })),

    toggleSelectAll: () => dispatch(toggleSelectAll()),

    toggleSingleItem: ({ id }: { id: string }) => dispatch(toggleSingleItem({ id })),

    updateArticleStatus: (newArticle: IArticleModel) => {
      dispatch(updateArticleRecord(newArticle));
      updateArticleStatus(newArticle);
    },

    loadScoresForCommentId: async (id: string) => {
      await dispatch(loadCommentSummaryScores(id));
    },

    changeSort: async (newSort: string): Promise<void> => {
      await dispatch(changeColumnSortGroupDefault({
        group: 'commentsIndexNew',
        key: newSort,
      }));

      await dispatch(executeCommentListLoader(
        isArticleDetail,
        articleId,
        category,
        tag,
        pos1,
        pos2,
      ));
    },
  };
}

const mapStateToProps = createStructuredSelector({
  article: (state: IAppStateRecord) => getArticle(state),

  isArticleDetail: (_: any, { params: { articleId } }: any) => !!articleId,

  commentIds: (state: IAppStateRecord, { params: { tag }}: any) => (
    getCommentIDsInRange(
      getCommentScores(state),
      getDragHandlePosition1(state),
      getDragHandlePosition2(state),
      tag === 'DATE',
    )
  ),

  getComment: (state: IAppStateRecord) => (id: string) => (getComment(state, id)),

  commentScores: getCommentScores,

  isLoading: (state: IAppStateRecord) => getCommentListIsLoading(state) || !getCommentListHasLoaded(state),

  areNoneSelected: getAreAnyCommentsSelected,

  areAllSelected: getAreAllSelected,

  isItemChecked: (state: IAppStateRecord) => (id: string) => getIsItemChecked(state, id),

  textSizes: getTextSizes,

  tags: getTaggableTags,

  getTagIdsAboveThresholdByCommentId: (state: IAppStateRecord, ownProps: any) => (id: string): Set<string> => {
    if (!id) {
      return;
    }

    return getSummaryScoresAboveThreshold(
      getTaggingSensitivitiesInCategory(state, ownProps.categoryId),
      getSummaryScoresById(state, id),
    ).map((score) => score.tagId).toSet();
  },

  selectedTag: (state: IAppStateRecord, { params: { tag }}: any) => {
    return getSelectedTag(state, tag);
  },

  rulesInCategory: (state: IAppStateRecord, { params }: any) => getRulesInCategory(state, params.categoryId).toArray(),

  pos1: getDragHandlePosition1,

  pos2: getDragHandlePosition2,

  getCurrentColumnSort: (state: IAppStateRecord) => {
    return (key: string) => getCurrentColumnSort(state, 'commentsIndexNew', key);
  },

  getLinkTarget: (state: IAppStateRecord, { params }: any) => {
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

  areAutomatedRulesApplied: (state: IAppStateRecord) => {
    const article = getArticle(state);

    return article && article.isAutoModerated;
  },
  userId: (state: IAppStateRecord) => getMyUserId(state),
});

const mergeProps = (stateProps: any, dispatchProps: any, ownProps: any) => {
  return {
      ...ownProps,
      ...stateProps,
      ...dispatchProps,
      dispatchAction: (action: ICommentAction, idsToDispatch: Array<string>) =>
          dispatchProps.dispatchAction(action, idsToDispatch, stateProps.userId),
      tagComments: (ids: Array<string>, tagId: string) =>
          dispatchProps.tagComments(ids, tagId, stateProps.userId),
      confirmCommentSummaryScore: (id: string, tagId: string) =>
          dispatchProps.confirmCommentSummaryScore(id, tagId, stateProps.userId),
      rejectCommentSummaryScore: (id: string, tagId: string) =>
          dispatchProps.rejectCommentSummaryScore(id, tagId, stateProps.userId),
  };
};

export const NewComments = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps) as any,
  provideHooks<IRedialLocals>({
    fetch: async ({ params, query, dispatch }) => {
      await Promise.all([
        dispatch(loadTags()),
        dispatch(loadRules()),
        dispatch(loadPreselects()),
        dispatch(loadTaggingSensitivities()),
      ]);

      const {
        isArticleDetail,
        articleId,
        category,
        tag,
        pos1,
        pos2,
      } = parseRouteAndQueryString(params, query);

      await dispatch(executeCommentListLoader(
        isArticleDetail,
        articleId,
        category,
        tag,
        pos1,
        pos2,
      ));
    },
  }),
)(PureNewComments) as any;

export * from './store';
