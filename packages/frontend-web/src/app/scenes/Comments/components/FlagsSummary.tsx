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
}

export class FlagsSummary extends React.PureComponent<IFlagsSummaryProps> {
  render() {
    const {
      comment,
    } = this.props;

    if (comment.flagsCount === 0 || !comment.flagsSummary) {
      return null;
    }

    function flag(count: number): string {
      return (count > 1) ? 'flags' : 'flag';
    }

    function countsText(): string {
      if (comment.unresolvedFlagsCount === 0) {
        return `${comment.flagsCount} ${flag(comment.flagsCount)}`;
      }
      return `${comment.unresolvedFlagsCount} unresolved ${flag(comment.unresolvedFlagsCount)} of ${comment.flagsCount}`;
    }

    const summary = comment.flagsSummary;
    const flags =  Array.from(summary.keys()).sort((a, b) => summary.get(b).get(0) - summary.get(a).get(0));
    return (
      <span>
        &bull;{countsText()}:&nbsp;({flags.map((f) => <span key={f}>{f}: {summary.get(f).get(0)}/{summary.get(f).get(1)}</span>)})
      </span>
    );
  }
}
