/*
Copyright 2019 Google Inc.

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

import { ICommentModel } from '../../../../models';

interface IFlagsSummaryProps {
  comment: ICommentModel;
  full?: boolean;
}

const TOTAL = 0;
const UNRESOLVED = 1;
const APPROVES = 2;

export class FlagsSummary extends React.PureComponent<IFlagsSummaryProps> {
  render() {
    const {
      comment,
      full,
    } = this.props;

    if (!comment.flagsSummary || comment.flagsSummary.size === 0) {
      return null;
    }

    const summary = comment.flagsSummary;
    const flags = Array.from(summary.keys())
      .sort((a, b) => summary.get(b).get(TOTAL) - summary.get(a).get(TOTAL))
      .filter((a) => summary.get(a).get(APPROVES) === 0);
    const approves = Array.from(summary.keys())
      .sort((a, b) => summary.get(b).get(TOTAL) - summary.get(a).get(TOTAL))
      .filter((a) => summary.get(a).get(APPROVES) > 0);

    function oneFlag(label: string) {
      const f = summary.get(label);
      const total = f.get(TOTAL);
      if (full) {
        const un = f.get(UNRESOLVED);
        const unresolvedStr = (un > 0) ? `(${un})` : '';
        return (<span key={label}>&bull; {label}: {total} {unresolvedStr}</span>);
      }
      return (<span key={label}>{label}: {total}</span>);
    }

    const unresolved = comment.unresolvedFlagsCount > 0 ?
      <span key="__unresolved">unresolved: {comment.unresolvedFlagsCount}</span> : '';

    if (full) {
      return (
        <span>
          &bull; Flags: {unresolved} {flags.map(oneFlag)} {approves.map(oneFlag)}
        </span>
      );
    }

    const topFlag = flags.length > 0 ? oneFlag(flags[0]) : '';
    const topApprove = approves.length > 0 ? oneFlag(approves[0]) : '';
    const theresMore = (flags.length > 1 || approves.length > 1) ? '...' : '';
    return (
      <span>
        &bull; Flags: {unresolved} {topFlag} {topApprove} {theresMore}
      </span>
    );
  }
}
