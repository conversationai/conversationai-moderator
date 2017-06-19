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
import { ICommentModel, ITagModel } from '../../../../../models';
import {
  DARK_SECONDARY_TEXT_COLOR,
} from '../../../../styles';
import { css } from '../../../../util';

export interface ISortColumnProps extends React.HTMLProps<any> {
  style?: object;
  comment?: ICommentModel;
  sortContent?: Array<string>;
  selectedTag?: ITagModel;
}

export class SortColumn extends React.PureComponent<ISortColumnProps, void> {
  render() {
    const {
      style,
      sortContent,
      selectedTag,
    } = this.props;

    const isSummaryScore = selectedTag && selectedTag.key === 'SUMMARY_SCORE';

    return (
      <div {...css(style)}>
        {sortContent.map((content, i) => (
          <p
            key={content}
            {...css({ margin: '0px'}, isSummaryScore && (i === 1) && { color: DARK_SECONDARY_TEXT_COLOR })}
          >
            {content}
          </p>
        ))}
      </div>
    );
  }
}
