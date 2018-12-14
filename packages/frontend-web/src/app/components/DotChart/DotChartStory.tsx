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

import { storiesOf } from '@storybook/react';
import * as faker from 'faker';
import {
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
} from '../../styles';
import { groupByDateColumns, groupByScoreColumns } from '../../util';
import { css } from '../../utilx';
import { DotChart } from '../DotChart';
import {
  ApproveIcon,
  DeferIcon,
  HighlightIcon,
  RejectIcon,
} from '../Icons';

const COLCOUNT = 100;

function randomTaggedComments(count: number) {
  const taggedComments = [];

  for (let i = 0; i < count; i++) {
    taggedComments.push({
      commentId: i.toString(),
      score: Math.random(),
    });
  }

  return taggedComments;
}

interface ITaggedComment {
  score: number;
  commentId: string;
}

interface IDatedComment {
  date: number;
  commentId: string;
}

function randomDatedComments(count: number, dateAge: number): Array<IDatedComment> {
  const datedComments: Array<IDatedComment> = [];

  for (let i = 0; i < count; i++) {
    datedComments.push({
      commentId: i.toString(),
      date: Number(faker.date.recent(dateAge)),
    });
  }

  return datedComments;
}

function generateRules() {
  return [
    {
      rule: 'approved',
      start: 0,
      end: .04,
      icon: <ApproveIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />,
    },
    {
      rule: 'highlight',
      start: .04,
      end: .05,
      icon: <HighlightIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />,
    },
    {
      rule: 'deferred',
      start: .25,
      end: .32,
      icon: <DeferIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />,
    },
    {
      rule: 'rejected',
      start: .9,
      end: 1,
      icon: <RejectIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />,
    },
  ];
}

storiesOf('DotChart', module)
  .add('Default', () => {
    return (
      <div {...css({ backgroundColor: MEDIUM_COLOR, padding: '50px' })}>
        <DotChart
          commentsByColumn={groupByScoreColumns<ITaggedComment>(randomTaggedComments(1000), COLCOUNT)}
          selectedRange={{start: 0, end: 0.25}}
          width={902}
          height={282}
        />
      </div>
    );
  })
  .add('By Date (30 days)', () => {
    const grouped = groupByDateColumns<IDatedComment>(randomDatedComments(1000, 30), COLCOUNT);
    const columnsByIndex = Object.keys(grouped).sort();

    return (
      <div {...css({ backgroundColor: MEDIUM_COLOR, padding: '50px' })}>
        <DotChart
          commentsByColumn={grouped}
          selectedRange={{start: parseFloat(columnsByIndex[0]), end: parseFloat(columnsByIndex[10])}}
          width={902}
          height={282}
        />
      </div>
    );
  })
  .add('By Date (24 hours)', () => {
    const comments = randomDatedComments(1000, 1);
    const grouped = groupByDateColumns<IDatedComment>(comments, COLCOUNT);
    const columnsByIndex = Object.keys(grouped).sort();

    return (
      <div {...css({ backgroundColor: MEDIUM_COLOR, padding: '50px' })}>
        <DotChart
          commentsByColumn={grouped}
          selectedRange={{start: parseFloat(columnsByIndex[0]), end: parseFloat(columnsByIndex[10])}}
          width={902}
          height={282}
        />
      </div>
    );
  })
  .add('Applied rules', () => {
    return (
      <div {...css({ backgroundColor: MEDIUM_COLOR, padding: '50px' })}>
        <DotChart
          appliedRules={generateRules()}
          commentsByColumn={groupByScoreColumns<ITaggedComment>(randomTaggedComments(1000), COLCOUNT)}
          selectedRange={{start: 0, end: 0.25}}
          width={902}
          height={282}
        />
      </div>
    );
  })
  .add('Narrow', () => {
    return (
      <div {...css({ backgroundColor: MEDIUM_COLOR, padding: '50px' })}>
        <DotChart
          commentsByColumn={groupByScoreColumns<ITaggedComment>(randomTaggedComments(1000), COLCOUNT)}
          selectedRange={{start: 0.50, end: 0.51}}
          width={768}
          height={282}
        />
      </div>
    );
  })
  .add('Mobile', () => {
    return (
      <div {...css({ backgroundColor: MEDIUM_COLOR, padding: '50px' })}>
        <DotChart
          commentsByColumn={groupByScoreColumns(randomTaggedComments(1000), 20)}
          width={480}
          height={282}
        />
      </div>
    );
  });
