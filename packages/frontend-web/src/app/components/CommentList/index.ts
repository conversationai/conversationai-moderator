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

import { ICommentAction } from '../../../types';
import { IAppDispatch } from '../../appstate';
import { getComment, loadComment } from '../../stores/comments';
import { HEADER_HEIGHT } from '../../styles';
import { ILazyCommentListProps, LazyCommentList } from '../LazyCommentList';
import { ICommentProps } from '../LazyLoadComment';

const DEFAULT_ROW_HEIGHT = 180;
const ROW_PADDING_WITH_TITLE = 200;
const ROW_PADDING = 130;

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
  textSizes: any;
  currentSort: string;
  selectedTag?: any;
  triggerActionToast: any;
} & ILazyCommentListOwnProps;

function mapStateToProps(state: any, ownProps: any): any {
  const {
    commentIds,
    textSizes,
    currentSort,
    selectedTag,
    displayArticleTitle,
    heightOffset,
    width,
  } = ownProps;

  return {
    selectedSort: currentSort,

    selectedTag,

    commentPropsForRow(idx: number): ICommentProps {
      const commentId = commentIds.get(idx);
      const comment = getComment(state, commentId);

      if (!comment) { return null; }

      return {
        comment,
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
  } = ownProps;

  return {
    onRowRender: async (index: number) => {
      const commentId = commentIds.get(index);
      return await dispatch(loadComment(commentId));
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
