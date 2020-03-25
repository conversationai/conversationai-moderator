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

import {ICommentFlagModel, ModelId} from '../../../../models';
import {getCommentFlags} from '../../../platform/dataService';
import {CAPTION_TYPE, DARK_SECONDARY_TEXT_COLOR, DARK_TERTIARY_TEXT_COLOR} from '../../../styles';
import {css, stylesheet} from '../../../utilx';

const FLAGS_STYLES = stylesheet({
  title: {
    ...CAPTION_TYPE,
    color: DARK_SECONDARY_TEXT_COLOR,
    fontSize: '20px',
  },
  entry: {
    padding: '10px',
    margin: '10px 0',
    backgroundColor: '#eee',
  },
  label: {
    fontSize: '24px',
  },
  resolvedText: {
    color: DARK_TERTIARY_TEXT_COLOR,
    fontSize: '16px',
    float: 'right',
  },
  detail: {
    fontSize: '14px',
  },
});

function Flag(props: {flag: ICommentFlagModel}) {
  const {flag} = props;
  let resolvedText = '';
  if (flag.isResolved) {
    resolvedText += 'Resolved';
    if (flag.resolvedAt) {
      resolvedText += ' on ' + (new Date(flag.resolvedAt)).toLocaleDateString();
    }
  }
  else {
    resolvedText += 'Unresolved';
  }
  return (
    <div {...css(FLAGS_STYLES.entry)}>{resolvedText}
      <div key="label" {...css(FLAGS_STYLES.label)}>{flag.label} <span {...css(FLAGS_STYLES.resolvedText)}>{resolvedText}</span></div>
      {flag.detail && <div key="description" {...css(FLAGS_STYLES.detail)}>{flag.detail}</div>}
    </div>
  );
}

export function FlagsList(props: {commentId: ModelId}) {
  const [flags, setFlags] = useState<Array<ICommentFlagModel>>();

  async function fetchFlags() {
    const f = await getCommentFlags(props.commentId);
    setFlags(f);
  }

  useEffect(() => { fetchFlags(); }, [props.commentId]);

  if (!flags || flags.length === 0) {
    return null;
  }

  return (
    <div key="flags">
      <div key="__flags-title" {...css(FLAGS_STYLES.title)}>Flags</div>
      {flags.map((f) => (<Flag key={f.id} flag={f}/>))}
    </div>
  );
}
