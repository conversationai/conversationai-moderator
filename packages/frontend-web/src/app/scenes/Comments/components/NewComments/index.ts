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
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';
import { ICommentModel } from '../../../../../models';
import { ICommentAction } from '../../../../../types';
import { IAppDispatch, IAppStateRecord } from '../../../../stores';
import { getArticle } from '../../../../stores/articles';
import { getComment } from '../../../../stores/comments';
import {
  getSummaryScoresById,
  loadCommentSummaryScores,
} from '../../../../stores/commentSummaryScores';
import { getPreselects } from '../../../../stores/preselects';
import { getRules } from '../../../../stores/rules';
import { getTaggableTags } from '../../../../stores/tags';
import { getTextSizes } from '../../../../stores/textSizes';
import {
  getSummaryScoresAboveThreshold,
  getTaggingSensitivitiesInCategory,
} from '../../store';
import {
  INewCommentsProps,
  NewComments as PureNewComments,
} from './NewComments';
import {
  executeCommentListLoader,
  getAreAllSelected,
  getAreAnyCommentsSelected,
  getCommentListHasLoaded,
  getCommentListIsLoading,
  getCommentScores,
  getCurrentPagingIdentifier,
  getIsItemChecked,
  getSelectedTag,
  removeCommentScore,
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
  [key: string]: (ids: Array<string>, tagId?: string) => any;
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

function mapDispatchToProps(dispatch: IAppDispatch): any {
  return {
    tagComments: (ids: Array<string>, tagId: string) =>
        dispatch(tagCommentSummaryScores(ids, tagId)),

    confirmCommentSummaryScore: (id: string, tagId: string) =>
        dispatch(confirmCommentSummaryScore(id, tagId)),

    rejectCommentSummaryScore: (id: string, tagId: string) =>
        dispatch(rejectCommentSummaryScore(id, tagId)),

    dispatchAction: (action: ICommentAction, idsToDispatch: Array<string>) =>
        dispatch(actionMap[action](idsToDispatch)),

    setCommentModerationStatus: (commentIds: Array<string>, moderationAction: string) =>
        dispatch(moderationStatusMap[moderationAction](commentIds)),

    removeCommentScore: (idsToDispatch: Array<string>) => dispatch(removeCommentScore(idsToDispatch)),

    toggleSelectAll: () => dispatch(toggleSelectAll()),

    toggleSingleItem: ({ id }: { id: string }) => dispatch(toggleSingleItem({ id })),

    loadScoresForCommentId: async (id: string) => {
      await dispatch(loadCommentSummaryScores(id));
    },

    loadData: async (
      categoryId: string | null,
      articleId: string | null,
      tag: string,
      pos1: number,
      pos2: number,
      sort: string,
    ): Promise<void> => {
      await dispatch(executeCommentListLoader(
        articleId,
        categoryId,
        tag,
        pos1,
        pos2,
        sort,
      ));
    },
  };
}

const mapStateToProps = createStructuredSelector({
  article: (state: IAppStateRecord, { params }: INewCommentsProps) => {
    if (params.articleId) {
      return getArticle(state, params.articleId);
    }
  },

  preselects: getPreselects,

  getComment: (state: IAppStateRecord) => (id: string) => (getComment(state, id)),

  commentScores: getCommentScores,

  isLoading: (state: IAppStateRecord) => getCommentListIsLoading(state) || !getCommentListHasLoaded(state),

  areNoneSelected: getAreAnyCommentsSelected,

  areAllSelected: getAreAllSelected,

  isItemChecked: (state: IAppStateRecord) => (id: string) => getIsItemChecked(state, id),

  textSizes: getTextSizes,

  tags: getTaggableTags,

  getTagIdsAboveThresholdByCommentId: (state: IAppStateRecord, { params }: INewCommentsProps) => (id: string): Set<string> => {
    if (!id) {
      return;
    }

    return getSummaryScoresAboveThreshold(
      getTaggingSensitivitiesInCategory(state, params.categoryId, params.articleId),
      getSummaryScoresById(state, id),
    ).map((score) => score.tagId).toSet();
  },

  selectedTag: (state: IAppStateRecord, { params }: INewCommentsProps) => {
    return getSelectedTag(state, params.tag);
  },

  rules: getRules,

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
});

export const NewComments = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(PureNewComments) as any;

export * from './store';
