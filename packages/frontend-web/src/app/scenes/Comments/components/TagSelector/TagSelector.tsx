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

import { autobind } from 'core-decorators';
import React from 'react';
import { WithRouterProps } from 'react-router';

import { ITagModel, TagModel } from '../../../../../models';
import {
  OverflowContainer,
  RejectIcon,
} from '../../../../components';
import { TagLabelRow } from '../../../../components/TagLabelRow';
import {
  ARTICLE_CATEGORY_TYPE,
  BODY_TEXT_TYPE,
  BUTTON_RESET,
  DARK_COLOR,
  GUTTER_DEFAULT_SPACING,
  LIGHT_SECONDARY_TEXT_COLOR,
  WHITE_COLOR,
} from '../../../../styles';
import { css } from '../../../../utilx';
import {API_URL} from '../../../../config';
import {getToken} from '../../../../platform/localStore';

const ACTION_STYLES = {
  header: {
    ...BODY_TEXT_TYPE,
    background: DARK_COLOR,
    padding: `${GUTTER_DEFAULT_SPACING}px ${GUTTER_DEFAULT_SPACING}px ${GUTTER_DEFAULT_SPACING}px ${GUTTER_DEFAULT_SPACING * 3}px`,
    fontSize: 18,
    width: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },

  headerTitle: {
    ...ARTICLE_CATEGORY_TYPE,
    flex: 1,
    color: LIGHT_SECONDARY_TEXT_COLOR,
    margin: 0,
  },

  closeButton: {
    ...BUTTON_RESET,
    cursor: 'pointer',
    alignSelf: 'flex-end',
    borderBottom: '2px solid transparent',
    ':focus': {
      outline: 0,
      borderBottom: `2px solid ${WHITE_COLOR}`,
    },
  },
};

const SNAPSHOT_WIDTH = 264;
const SNAPSHOT_HEIGHT = 76;

const dateTag = TagModel({
  label: 'All Comments by Date',
  key: 'DATE',
  color: '',
}).set('id', 'DATE');

function getImagePath(base: string, id: string, tagId: string) {
  const dp = window.devicePixelRatio || 1;
  const startPath = `${base}/${id}`;

  let tagSuffix;

  if (tagId === 'DATE') {
    tagSuffix = 'byDate';
  } else {
    tagSuffix = `tags/${tagId}`;
  }

  return `${API_URL}/services/histogramScores/`
    + startPath
    + '/'
    + tagSuffix
    + `/chart?width=${SNAPSHOT_WIDTH * dp}&height=${SNAPSHOT_HEIGHT * dp}&token=${getToken()}`;
}

export interface ITagSelectorProps extends WithRouterProps {
  tags: Array<ITagModel>;
}

export class TagSelector extends React.Component<ITagSelectorProps> {
  @autobind
  onCloseClick(e: React.MouseEvent<any>) {
    e.preventDefault();
    setTimeout(() => window.history.back(), 10);
  }

  render() {
    const { tags } = this.props;
    const { base, id, currentTag } = this.props.params;

    const summaryTag = tags.filter((tag) => tag.key === 'SUMMARY_SCORE');
    const tagsWithoutSummary = tags.filter((tag) => tag.key !== 'SUMMARY_SCORE' && tag.isInBatchView === true);
    const tagsWithDate = [...summaryTag, ...tagsWithoutSummary, dateTag];

    const tagsWithDateRows = tagsWithDate.map((tag, i) => (
      <TagLabelRow
        tag={tag}
        key={tag.key}
        base={base}
        id={id}
        isSelected={currentTag === tag.id}
        imageWidth={SNAPSHOT_WIDTH}
        imageHeight={SNAPSHOT_HEIGHT}
        imagePath={getImagePath(base, id, tag.key === 'SUMMARY_SCORE' ? 'SUMMARY_SCORE' : tag.id)}
        background={i % 2 ? '#295D86' : '#2F6793'}
      />
    ));

    return (
      <OverflowContainer
        header={(
          <div {...css(ACTION_STYLES.header)}>
            <h1 {...css(ACTION_STYLES.headerTitle)}>Select a view</h1>
            <button
              {...css(ACTION_STYLES.closeButton)}
              type="button"
              onClick={this.onCloseClick}
              aria-label="Go back"
            >
              <RejectIcon {...css({ fill: WHITE_COLOR })} />
            </button>
          </div>
        )}
        body={(
          <div>
            {tagsWithDateRows}
          </div>
        )}
      />
    );
  }
}
