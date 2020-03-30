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

import React, {Fragment, useState} from 'react';
import {useSelector} from 'react-redux';

import {ICommentModel, ICommentSummaryScoreModel2} from '../../../../models';
import {
  getSensitivitiesForCategory,
  getSummaryScoresAboveThreshold,
  getSummaryScoresBelowThreshold,
} from '../../../scenes/Comments/scoreFilters';
import {getTaggingSensitivities} from '../../../stores/taggingSensitivities';
import {getTags} from '../../../stores/tags';
import {
  BOX_DEFAULT_SPACING, BUTTON_LINK_TYPE,
  BUTTON_RESET,
  COMMENT_DETAIL_TAG_LIST_BUTTON_TYPE,
  DARK_TERTIARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING, MEDIUM_COLOR, PALE_COLOR,
} from '../../../styles';
import {css, stylesheet} from '../../../utilx';

const STYLES = stylesheet({
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

  tags: {
    display: 'flex',
    flexWrap: 'wrap',
  },

  label: {
    marginRight: `${BOX_DEFAULT_SPACING / 2}px`,
  },

  scoresLink: {
    ...BUTTON_RESET,
    ...BUTTON_LINK_TYPE,
    color: MEDIUM_COLOR,
    cursor: 'pointer',
    textAlign: 'left',
    marginTop: `${GUTTER_DEFAULT_SPACING}px`,
    marginBottom: `${GUTTER_DEFAULT_SPACING}px`,
    borderBottom: `2px solid transparent`,
    alignSelf: 'flex-start',
    ':focus': {
      outline: 0,
      borderBottom: `2px solid ${MEDIUM_COLOR}`,
    },
  },
});

export interface ISummaryScoreProps {
  score: ICommentSummaryScoreModel2;
  withColor?: boolean;
  onScoreClick?(score: ICommentSummaryScoreModel2): void;
}

function SummaryScore(props: ISummaryScoreProps) {
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
      {...css(STYLES.tag, withColor ? { color : tag.color } : {})}
      key={score.tagId}
      onClick={onClick}
    >
      <div {...css(STYLES.label)}>{tag.label}</div>
      <div>{(score.score * 100).toFixed()}%</div>
    </button>
  );
}

export interface ISummaryScoresProps {
  comment: ICommentModel;
  onScoreClick?(score: ICommentSummaryScoreModel2): void;
}

export function SummaryScores(props: ISummaryScoresProps) {
  const {comment, onScoreClick} = props;
  const {categoryId, summaryScores} = comment;
  const taggingSensitivities = useSelector(getTaggingSensitivities);
  const [allVisible, setAllVisible] = useState(false);

  const sensitivities = getSensitivitiesForCategory(categoryId, taggingSensitivities);
  const summaryScoresAboveThreshold = getSummaryScoresAboveThreshold(sensitivities, summaryScores);
  const summaryScoresBelowThreshold = getSummaryScoresBelowThreshold(sensitivities, summaryScores);

  function toggleVisible() {
    setAllVisible(!allVisible);
  }

  return (
    <Fragment>
      {summaryScoresAboveThreshold && (
        <div key="above" {...css(STYLES.tags)}>
          {summaryScoresAboveThreshold.map((s) => (
            <SummaryScore
              key={s.tagId}
              score={s}
              onScoreClick={onScoreClick}
              withColor
            />
          ))}
        </div>
      )}
      {allVisible && summaryScoresBelowThreshold && (
        <div key="below" {...css(STYLES.tags)}>
          {summaryScoresBelowThreshold.map((s) => (
            <SummaryScore
              key={s.tagId}
              score={s}
              onScoreClick={onScoreClick}
            />
          ))}
        </div>
      )}
      {summaryScoresBelowThreshold && (
        <button
          key="button"
          aria-label={allVisible ? 'Hide tags' : 'View all tags'}
          type="button"
          {...css(STYLES.scoresLink)}
          onClick={toggleVisible}
        >
          {allVisible ? 'Hide tags' : 'View all tags'}
        </button>
      )}
    </Fragment>
  );
}
