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

import React from 'react';
import { useSelector } from 'react-redux';

import {
  ICommentModel,
  ICommentScoreModel,
  ITaggingSensitivityModel,
} from '../../../models';
import { getTags } from '../../stores/tags';
import {
  BUTTON_RESET,
  DARK_SECONDARY_TEXT_COLOR,
  DARK_TERTIARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  PALE_COLOR,
} from '../../styles';
import { css, stylesheet } from '../../utilx';
import { RejectIcon } from '../Icons';

const SCORE_ROW_STYLES = stylesheet({
  container: {
    display: 'flex',
    marginTop: `${GUTTER_DEFAULT_SPACING}px`,
    flexDirection: 'row',
  },

  score: {
    width: '120px',
  },

  text: {
    flex: 1,
  },
});

export interface IScoreRowProps {
  score: number;
  text: string;
  scoreColor?: string;
}

const ScoreRow = (props: IScoreRowProps) => (
  <div {...css(SCORE_ROW_STYLES.container)}>
    <div
      {...css({
        width: '120px',
        color: props.scoreColor ? props.scoreColor : DARK_TERTIARY_TEXT_COLOR,
      })}
    >
      {`${(props.score * 100).toFixed()}%`}
    </div>
    <div {...css(SCORE_ROW_STYLES.text)}>{props.text}</div>
  </div>
);

const STYLES = stylesheet({
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    flex: 'none',
  },

  body: {
    overflowY: 'scroll',
    height: '400px',
  },

  closeButton: {
    ...BUTTON_RESET,
    cursor: 'pointer',
    width: '44px',
    height: '44px',
    ':focus': {
      outline: 0,
      backgroundColor: PALE_COLOR,
    },
  },

  tableHeader: {
    color: DARK_SECONDARY_TEXT_COLOR,
    display: 'flex',
    flexDirection: 'row',
  },

  scoreHeader: {
    width: SCORE_ROW_STYLES.score.width,
  },
});

export interface IScoresListProps {
  comment?: ICommentModel;
  scores?: Array<ICommentScoreModel>;
  threshold?: ITaggingSensitivityModel;
  onClose(): any;
}

export function ScoresList(props: IScoresListProps) {
  const {
    comment,
    scores,
    threshold,
    onClose,
  } = props;
  const tags = useSelector(getTags);

  function getTextByIndeces(annotationStart: number, annotationEnd: number): string {
    if (annotationStart === null || annotationEnd === null) {
      return comment.text;
    }

    return comment.text.slice(annotationStart, annotationEnd);
  }

  const exampleScore = scores[0] || null;
  const tag = tags && tags.find((t) => (t.get('id') === exampleScore.tagId));
  const scoresAboveThreshold = threshold && scores && scores.filter((score) => score.score >= threshold.lowerThreshold);
  const scoresBelowThreshold = threshold && scores && scores.filter((score) => score.score < threshold.lowerThreshold);

  return (
    <div>
      <div key="Title" {...css(STYLES.header)}>
        <h3>Score details for "{tag.label}" </h3>
        <button type="button" onClick={onClose} aria-label="Close Scores Modal" {...css(STYLES.closeButton)}>
          <RejectIcon {...css({ color: DARK_SECONDARY_TEXT_COLOR })} />
        </button>
      </div>
      <div key="Header" {...css(STYLES.tableHeader)}>
        <h4 {...css(STYLES.scoreHeader)}>SCORE</h4>
        <h4>STRING</h4>
      </div>
      <div key="Thresholds" {...css(STYLES.body)}>
        {scoresAboveThreshold && scoresAboveThreshold.map(( score ) => (
          <ScoreRow
            key={score.id}
            score={score.score}
            scoreColor={tag && tag.color}
            text={getTextByIndeces(score.annotationStart, score.annotationEnd)}
          />
        ))}
        {scoresBelowThreshold && scoresBelowThreshold.map(( score ) => (
          <ScoreRow
            key={score.id}
            score={score.score}
            scoreColor={DARK_TERTIARY_TEXT_COLOR}
            text={getTextByIndeces(score.annotationStart, score.annotationEnd)}
          />
        ))}
      </div>
    </div>
  );
}
