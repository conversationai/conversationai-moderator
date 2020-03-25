/*
Copyright 2020 Google Inc.

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

import React from 'react';
import {useSelector} from 'react-redux';

import {ICommentSummaryScoreModel} from '../../../../models';
import {getTags} from '../../../stores/tags';
import {
  BOX_DEFAULT_SPACING,
  BUTTON_RESET,
  COMMENT_DETAIL_TAG_LIST_BUTTON_TYPE,
  DARK_TERTIARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING, PALE_COLOR,
} from '../../../styles';
import {css, stylesheet} from '../../../utilx';

const COMMENT_STYLES = stylesheet({
  tag: {
    ...BUTTON_RESET,
    ...COMMENT_DETAIL_TAG_LIST_BUTTON_TYPE,
    color: DARK_TERTIARY_TEXT_COLOR,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
    marginBottom: `${GUTTER_DEFAULT_SPACING / 4}px`,
    display: 'flex',
    cursor: 'pointer',
    ':focus': {
      outline: 0,
      background: PALE_COLOR,
    },
  },

  label: {
    marginRight: `${BOX_DEFAULT_SPACING / 2}px`,
  },
});

export interface ISummaryScoreProps {
  score: ICommentSummaryScoreModel;
  withColor?: boolean;
  onScoreClick?(score: ICommentSummaryScoreModel): void;
}

export function SummaryScore(props: ISummaryScoreProps) {
  const {score, withColor, onScoreClick} = props;
  const tags = useSelector(getTags);

  const tag = tags.find((t) => (t.get('id') === score.tagId));
  if (!tag) {
    return;
  }
  function onClick() {
    onScoreClick && onScoreClick(score);
  }

  return (
    <button
      {...css(COMMENT_STYLES.tag, withColor ? { color : tag.color } : {})}
      key={score.tagId}
      onClick={onClick}
    >
      <div {...css(COMMENT_STYLES.label)}>{tag.label}</div>
      <div>{(score.score * 100).toFixed()}%</div>
    </button>
  );
}
