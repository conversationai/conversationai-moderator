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
import Linkify from 'react-linkify';

import { makeStyles } from '@material-ui/styles';

import { ITopScore } from '../../types';

const useStyles = makeStyles({
  bold: {
    fontWeight: 600,
  },
});

function linkifyLink(decoratedHref: string, decoratedText: string, key: number) {
  return (
    <a href={decoratedHref} key={key} target="_blank">
      {decoratedText}
    </a>
  );
}

export function CommentText(props: {
  text: string,
  highlight?: ITopScore,
}) {
  const { text, highlight } = props;
  const classes = useStyles(props);

  const output = [];
  if (!highlight || highlight.start >= highlight.end) {
    output.push(<span key="text">{text}</span>);
  }
  else {
    if (highlight.start > 0) {
      output.push(<span key="text-before">{text.slice(0, highlight.start)}</span>);
    }
    output.push(<span key="text-highlighted" className={classes.bold}>{text.slice(highlight.start, highlight.end)}</span>);
    if (highlight.end < text.length - 1) {
      output.push(<span key="text-after">{text.slice(highlight.end, text.length)}</span>);
    }
  }
  return (
    <Linkify componentDecorator={linkifyLink}>
      {output}
    </Linkify>
  );
}
