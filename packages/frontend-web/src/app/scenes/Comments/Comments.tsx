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
import {Redirect, Route, Switch, useRouteMatch} from 'react-router';

import {
  HeaderBar,
} from '../../components';
import {
  HEADER_HEIGHT,
  WHITE_COLOR,
} from '../../styles';
import { css, stylesheet } from '../../utilx';
import {
  NEW_COMMENTS_DEFAULT_TAG,
} from '../routes';
import { CommentDetail } from './components/CommentDetail';
import { ModeratedComments } from './components/ModeratedComments';
import { NewComments } from './components/NewComments';
import { SubheaderBar } from './components/SubheaderBar';
import { ThreadedCommentDetail } from './components/ThreadedCommentDetail';

function redirect(to: string) {
  return () => {
    return <Redirect to={to}/>;
  };
}

const STYLES = stylesheet({
  main: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
});

export function Comments(_props: { }) {
  const {url, path} = useRouteMatch('/:context/:contextId');

  return (
    <div {...css({height: '100%'})}>
      <div {...css(STYLES.main)}>
        <HeaderBar homeLink/>
        <Route path={`${path}/:pt1/:pt2`}>
          <SubheaderBar/>
        </Route>
        <div
          {...css({
            background: WHITE_COLOR,
            height: `calc(100% - ${HEADER_HEIGHT * 2 + 12}px)`,
            position: 'relative',
            overflow: 'hidden',
            WebkitOverflowScrolling: 'touch',
          })}
        >
          <Switch>
            <Route exact path={`${path}`} render={redirect(`${url}/new/${NEW_COMMENTS_DEFAULT_TAG}`)} />
            <Route exact path={`${path}/new`} render={redirect(`${url}/new/${NEW_COMMENTS_DEFAULT_TAG}`)} />
            <Route exact path={`${path}/moderated`} render={redirect(`${url}/moderated/approved`)} />
            <Route path={`${path}/new/:tag`} component={NewComments}/>
            <Route path={`${path}/moderated/:disposition`} component={ModeratedComments}/>
            <Route path={`${path}/comments/:commentId`} component={CommentDetail}/>
            <Route path={`${path}/comments/:commentId/replies`} component={ThreadedCommentDetail}/>
          </Switch>
        </div>
      </div>
    </div>
  );
}
