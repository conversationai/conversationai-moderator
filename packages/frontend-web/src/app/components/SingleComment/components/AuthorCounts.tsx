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

import React, {useEffect, useState} from 'react';

import {IAuthorCountsModel} from '../../../../models';
import {listAuthorCounts} from '../../../platform/dataService';
import {DARK_SECONDARY_TEXT_COLOR} from '../../../styles';
import {css} from '../../../utilx';
import {ApproveIcon} from '../../Icons';
import {DetailRow, ICON_SIZE} from './DetailRow';

export interface IAuthorCountsProps {
  authorSourceId: string;
}

export function AuthorCounts(props: IAuthorCountsProps) {
  const [counts, setCounts] = useState<IAuthorCountsModel>(null);

  async function fetchCount() {
    const countsMap = await listAuthorCounts([props.authorSourceId]);
    setCounts(countsMap.get(props.authorSourceId));
  }
  useEffect(() => {
    fetchCount();
  }, [props.authorSourceId]);

  if (!counts) {
    return null;
  }

  return (
    <DetailRow
      key="authorCounts"
      icon={(
        <ApproveIcon
          {...css({ fill: DARK_SECONDARY_TEXT_COLOR })}
          size={ICON_SIZE}
        />
      )}
      label={
        `${counts.approvedCount} / ${(counts.approvedCount + counts.rejectedCount)}` +
        ` approved`}
    />
  );
}
