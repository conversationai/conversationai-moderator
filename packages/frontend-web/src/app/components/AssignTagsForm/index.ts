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
import { connect } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { IAppDispatch, IAppStateRecord } from '../../appstate';
import { getTaggingSensitivitiesInCategory } from '../../scenes/Comments/store';
import { getSummaryScoresById, loadCommentSummaryScores } from '../../stores/commentSummaryScores';
import { getTaggableTags } from '../../stores/tags';
import {
  AssignTagsForm as PureAssignTagsForm,
  IAssignTagsFormProps as IPureAssignTagsFormProps,
} from './AssignTagsForm';

const mapStateToProps = createStructuredSelector({
  tags: (state: IAppStateRecord) => getTaggableTags(state),

  sensitivities: (state: IAppStateRecord, { comment }: IPureAssignTagsFormProps) =>
    getTaggingSensitivitiesInCategory(state, null, comment.articleId),

  summaryScores: (state: IAppStateRecord, { comment }: IPureAssignTagsFormProps) =>
    getSummaryScoresById(state, comment.id),
});

function mapDispatchToProps(dispatch: IAppDispatch) {
  return {
    loadScoresForCommentId: async (id: string) => {
      await loadCommentSummaryScores(dispatch, id);
    },
  };
}

export type IAssignTagsFormProps = Pick<IPureAssignTagsFormProps, 'comment' | 'clearPopups' | 'submit'>;

export const AssignTagsForm = compose<React.ComponentClass<IAssignTagsFormProps>>(
  connect(mapStateToProps, mapDispatchToProps),
)(PureAssignTagsForm);
