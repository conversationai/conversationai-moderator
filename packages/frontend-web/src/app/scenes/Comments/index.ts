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

import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { contextInjector } from '../../injectors/contextInjector';
import { getGlobalCounts } from '../../stores/categories';
import { Comments as PureComments } from './Comments';

export { NewComments } from './components/NewComments';
export { TagSelector } from './components/TagSelector';
export { ModeratedComments } from './components/ModeratedComments';
export { CommentDetail } from './components/CommentDetail';
export { ThreadedCommentDetail } from './components/ThreadedCommentDetail';

export const Comments = compose(
  connect(createStructuredSelector({
      globalCounts: getGlobalCounts,
    }),
  ),
  withRouter,
  contextInjector,
)(PureComments);
