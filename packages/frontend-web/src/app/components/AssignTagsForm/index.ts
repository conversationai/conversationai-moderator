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

import { Set } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { ModelId } from '../../../models';
import { getSummaryScoresAboveThreshold, getTaggingSensitivitiesInCategory } from '../../scenes/Comments/store';
import { IAppStateRecord } from '../../stores';
import { getSummaryScoresById } from '../../stores/commentSummaryScores';
import { getTaggableTags } from '../../stores/tags';
import {
  AssignTagsForm as PureAssignTagsForm,
  IAssignTagsFormProps as IPureAssignTagsFormProps,
} from './AssignTagsForm';

const mapStateToProps = createStructuredSelector({
  tags: (state: IAppStateRecord) => getTaggableTags(state),

  tagsPreselected: (state: IAppStateRecord, { commentId, params }: IPureAssignTagsFormProps): Set<string> => {
    if (!commentId) {
      return Set<ModelId>();
    }

    return getSummaryScoresAboveThreshold(
      getTaggingSensitivitiesInCategory(state, params.categoryId, params.articleId),
      getSummaryScoresById(state, commentId),
    ).map((score) => score.tagId).toSet();
  },
});

export type IAssignTagsFormProps = Pick<IPureAssignTagsFormProps, 'commentId' | 'onSubmit'>;

export const AssignTagsForm = compose<React.ComponentClass<IAssignTagsFormProps>>(
  withRouter,
  connect(mapStateToProps, null),
)(PureAssignTagsForm);
