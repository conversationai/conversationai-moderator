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

import { HEADER_HEIGHT } from '../../styles';
import { ILazyCommentListProps, LazyCommentList } from '../LazyCommentList';

const DEFAULT_ROW_HEIGHT = 180;
const ROW_PADDING_WITH_TITLE = 200;
const ROW_PADDING = 130;

export type ICommentListOwnPropNames =
  'commentIds' |
  'getLinkTarget' |
  'totalItems' |
  'areAllSelected' |
  'onSelectAllChange' |
  'isItemChecked' |
  'sortOptions' |
  'onSelectionChange' |
  'onSortChange' |
  'onCommentClick' |
  'rowHeight' |
  'hideCommentAction' |
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
  textSizes: any;
  currentSort: string;
  selectedTag?: any;
} & ILazyCommentListOwnProps;

function mapStateToProps(_state: any, ownProps: any): any {
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

export const CommentList: React.ComponentClass<ICommentListProps> = connect(
  mapStateToProps,
)(LazyCommentList);
