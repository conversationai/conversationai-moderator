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

import formatDate from 'date-fns/format';
import { List } from 'immutable';
import { isNaN, isNumber } from 'lodash';
import { connect } from 'react-redux';
import { ICommentModel, ICommentScoredModel } from '../../../models';
import { ICommentAction } from '../../../types';
import { DATE_FORMAT_HM, DATE_FORMAT_MDY } from '../../config';
import { IAppDispatch } from '../../stores';
import { getComment, loadComment } from '../../stores/comments';
import { getTags } from '../../stores/tags';
import { getTopScoreForComment, getTopSummaryScoreForComment, loadTopScore, loadTopSummaryScore } from '../../stores/topScores';
import { HEADER_HEIGHT } from '../../styles';
import {
  ILazyCommentListProps,
  LazyCommentList,
} from '../LazyCommentList';
import {
  ICommentProps,
} from '../LazyLoadComment';

const DEFAULT_ROW_HEIGHT = 180;
const ROW_PADDING_WITH_TITLE = 200;
const ROW_PADDING = 130;

function getSortContentByType(commentSortType: string, comment: ICommentModel, commentScores?: List<ICommentScoredModel>, maxSummaryScoreTag?: string): Array<string> {
  switch (commentSortType) {
    case 'newest':
      return [formatDate(comment.sourceCreatedAt, DATE_FORMAT_MDY), formatDate(comment.sourceCreatedAt, DATE_FORMAT_HM)];
    case 'oldest':
      return [formatDate(comment.sourceCreatedAt, DATE_FORMAT_MDY), formatDate(comment.sourceCreatedAt, DATE_FORMAT_HM)];
    case 'relevance':
      return [formatDate(comment.sourceCreatedAt, DATE_FORMAT_MDY), formatDate(comment.sourceCreatedAt, DATE_FORMAT_HM)];
    case 'updated':
      return [formatDate(comment.updatedAt, DATE_FORMAT_MDY), formatDate(comment.updatedAt, DATE_FORMAT_HM)];
    case 'flagged':
      return [comment.unresolvedFlagsCount.toString()];
    default:
      const score = commentScores && commentScores.find((s) => s.commentId === comment.id);

      if (!score || !isNumber(score.score) || isNaN(score.score)) {
        return ['unscored'];
      }

      const scoreString = `${(score.score * 100.0).toFixed()}%`;

      return maxSummaryScoreTag ? [scoreString, maxSummaryScoreTag] : [scoreString];
  }
}

export type ICommentListOwnPropNames =
  'getLinkTarget' |
  'totalItems' |
  'areAllSelected' |
  'onSelectAllChange' |
  'isItemChecked' |
  'sortOptions' |
  'onSelectionChange' |
  'onSortChange' |
  'onCommentClick' |
  'commentBody' |
  'rowHeight' |
  'hideCommentAction' |
  'updateCounter' |
  'scrollToRow' |
  'ownerHeight' |
  'width' |
  'heightOffset' |
  'dispatchConfirmedAction' |
  'displayArticleTitle' |
  'handleAssignTagsSubmit' |
  'onTableScroll' |
  'searchTerm';

export type ILazyCommentListOwnProps = {
  [P in ICommentListOwnPropNames]?: ILazyCommentListProps[P];
};

export type ICommentListProps = {
  commentIds: any;
  commentScores?: any;
  textSizes: any;
  getCurrentSort(): string;
  selectedTag?: any;
  triggerActionToast: any;
} & ILazyCommentListOwnProps;

function mapStateToProps(state: any, ownProps: any): any {
  const {
    commentIds,
    commentScores,
    textSizes,
    getCurrentSort,
    selectedTag,
    displayArticleTitle,
    heightOffset,
    width,
  } = ownProps;

  return {
    selectedSort: getCurrentSort(),

    selectedTag,

    commentPropsForRow(idx: number): ICommentProps {
      const commentId = commentIds.get(idx);
      const comment = getComment(state, commentId);

      if (!comment) { return null; }
      const currentSort = getCurrentSort();
      let sort;
      // Date does not have highest/lowest scores so we need to force switch the sort
      if (selectedTag && selectedTag.key === 'DATE' && (currentSort === 'highest' || currentSort === 'lowest')) {
        sort = 'newest';
      } else {
        sort = currentSort;
      }

      let maxSummaryScoreTagLabel: string = null;
      if (selectedTag && selectedTag.key === 'SUMMARY_SCORE') {
        const maxSummaryScoreTag = getTags(state).find((tag) => tag.id === comment.maxSummaryScoreTagId);
        maxSummaryScoreTagLabel = maxSummaryScoreTag && maxSummaryScoreTag.label;
      }

      const sortContent = getSortContentByType(
        sort,
        comment,
        commentScores,
        maxSummaryScoreTagLabel,
      );

      let topScore = null;

      switch (selectedTag && selectedTag.key) {
        case undefined:
          break;
        case 'DATE':
          break;
        case 'SUMMARY_SCORE':
          topScore = getTopSummaryScoreForComment(state, commentId);
          break;
        default:
          topScore = getTopScoreForComment(state, commentId, selectedTag.id);
      }

      return {
        comment,
        sortContent,
        topScore,
      };
    },

    rowHeightGetter(idx: number): number {
      const commentId = commentIds.get(idx);
      const padding = displayArticleTitle ? ROW_PADDING_WITH_TITLE : ROW_PADDING;

      return commentId && textSizes
          ? textSizes.get(commentId) + padding
          : DEFAULT_ROW_HEIGHT;
    },

    heightOffset: heightOffset || HEADER_HEIGHT,

    width: width || window.innerWidth,

  };
}

export type ILazyCommentListDispatchProps = Pick<
  ILazyCommentListProps,
  'onRowRender' |
  'dispatchConfirmedAction'
>;

function mapDispatchToProps(dispatch: IAppDispatch, ownProps: ICommentListProps): ILazyCommentListDispatchProps {
  const {
    commentIds,
    triggerActionToast,
    dispatchConfirmedAction,
    selectedTag,
  } = ownProps;

  return {
    onRowRender: async (index: number) => {
      const commentId = commentIds.get(index);
      const comment: ICommentModel = await dispatch(loadComment(commentId));

      switch (selectedTag && selectedTag.key) {
        case undefined:
          break;
        case 'DATE':
          break;
        case 'SUMMARY_SCORE':
          await dispatch(loadTopSummaryScore(commentId));
          break;
        default:
          await dispatch(loadTopScore(commentId, selectedTag.id));
      }

      return comment;
    },

    dispatchConfirmedAction: (action: ICommentAction, ids: Array<string>, shouldTriggerToast?: boolean) => {
      if (!shouldTriggerToast) {
        return dispatchConfirmedAction(action, ids);
      }

      return triggerActionToast(
        action,
        ids.length,
        () => dispatchConfirmedAction(action, ids),
      );
    },
  };
}

export const CommentList: React.ComponentClass<ICommentListProps> = connect(
  mapStateToProps,
  mapDispatchToProps,
)(LazyCommentList);
