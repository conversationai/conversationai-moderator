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

import {format, parseISO} from 'date-fns';
import React from 'react';
import {useSelector} from 'react-redux';

import { getSummaryForTag, ITagModel, ModelId } from '../../../../../models';
import { DATE_FORMAT_HM, DATE_FORMAT_MDY } from '../../../../config';
import { useCachedComment } from '../../../../injectors/commentInjector';
import { getTags } from '../../../../stores/tags';
import {
  DARK_SECONDARY_TEXT_COLOR,
} from '../../../../styles';
import { css, IStyle } from '../../../../utilx';

export interface ISortColumnProps extends React.HTMLProps<any> {
  style?: IStyle;
  commentId?: ModelId;
  selectedSort?: string;
  selectedTag?: ITagModel;
}

export function SortColumn(props: ISortColumnProps) {
  const {
    style,
    commentId,
    selectedSort,
    selectedTag,
  } = props;

  const {comment} = useCachedComment(commentId);
  const tags = useSelector(getTags);

  if (['newest', 'oldest', 'updated'].includes(selectedSort)) {
    const dateStr = selectedSort === 'updated' ? comment.updatedAt : comment.sourceCreatedAt;
    const date = dateStr ? parseISO(dateStr) : null;
    const mdy = date ? format(date, DATE_FORMAT_MDY) : '--';
    const hm = date ? format(date, DATE_FORMAT_HM) : '--';
    return (
      <div {...css(style)}>
        <p key="date" {...css({margin: '0px'})}>{mdy}</p>
        <p key="time" {...css({margin: '0px'})}>{hm}</p>
      </div>
    );
  }

  if (selectedSort === 'flagged') {
    return (
      <div {...css(style)}>
        <p key="flags" {...css({margin: '0px'})}>{comment.unresolvedFlagsCount}</p>
      </div>
    );
  }

  if (selectedTag && selectedTag.key !== 'SUMMARY_SCORE') {
    const summary = getSummaryForTag(comment, selectedTag.id);
    if (summary) {
      return (
        <div {...css(style)}>
          <p key="summary" {...css({margin: '0px'})}>{(summary.score * 100.0).toFixed()}%</p>
        </div>
      );
    }
  }

  if (!comment.maxSummaryScore) {
    return (
      <div {...css(style)}>
        <p key="summary" {...css({margin: '0px'})}>Unscored</p>
      </div>
    );
  }

  const maxSummaryScoreTag = tags.find((tag) => tag.id === comment.maxSummaryScoreTagId);
  const tagLabel = maxSummaryScoreTag && maxSummaryScoreTag.label;

  return (
    <div {...css(style)}>
      <p key="summary" {...css({margin: '0px'})}>{(comment.maxSummaryScore * 100.0).toFixed()}%</p>
      <p key="label" {...css({margin: '0px', color: DARK_SECONDARY_TEXT_COLOR})}>{tagLabel}</p>
    </div>
  );
}
