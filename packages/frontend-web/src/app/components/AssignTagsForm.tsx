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

import {Set} from 'immutable';
import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {
  ClickAwayListener,
  DialogTitle,
} from '@material-ui/core';

import {
  ICommentModel,
  ITagModel,
  ModelId,
} from '../../models';
import { useCachedArticle } from '../injectors/articleInjector';
import { getSensitivitiesForCategory, getSummaryScoresAboveThreshold } from '../scenes/Comments/scoreFilters';
import { getTaggingSensitivities } from '../stores/taggingSensitivities';
import { getTaggableTags } from '../stores/tags';
import { css, stylesheet } from '../utilx';
import { CheckboxRow } from './CheckboxRow';

import {
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  NICE_CONTROL_BLUE,
  NICE_MIDDLE_BLUE,
  SCRIM_STYLE,
} from '../styles';

const STYLES = stylesheet({
  tagsList: {
    listStyle: 'none',
    margin: 0,
    padding: `0 0 ${GUTTER_DEFAULT_SPACING}px 0`,
  },
  listItem: {
    textDecoration: 'none',
    ':focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },
  tagsButton: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 0,
    color: NICE_MIDDLE_BLUE,
    cursor: 'pointer',
    padding: '8px 20px',
    textAlign: 'left',
    width: '100%',

    ':hover': {
      backgroundColor: NICE_MIDDLE_BLUE,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },

    ':focus': {
      backgroundColor: NICE_MIDDLE_BLUE,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },
  },
  button: {
    width: '100%',
  },
});

export interface IAssignTagsFormProps {
  articleId: ModelId;
  comment: ICommentModel;
  clearPopups(): void;
  submit(commentId: ModelId, selectedTagIds: Set<ModelId>, rejectedTagIds: Set<ModelId>): Promise<void>;
}

export function AssignTagsForm(props: IAssignTagsFormProps) {
  const tags = useSelector(getTaggableTags);
  const sensitivities = useSelector(getTaggingSensitivities);
  const {articleId, comment} = props;
  const {article} = useCachedArticle(articleId);
  const summaryScores = comment.summaryScores;

  function getPreselected() {
    if (!summaryScores) {
      return Set<ModelId>();
    }
    const categoryId = article ? article.categoryId : 'na';
    const sensitivitiesForCategory = getSensitivitiesForCategory(categoryId, sensitivities);
    const scoresAboveThreshold = getSummaryScoresAboveThreshold(sensitivitiesForCategory, summaryScores);
    return Set(scoresAboveThreshold.map((score) => score.tagId));
  }

  const [selected, setSelected] = useState(Set<ModelId>());
  useEffect(() => {
    setSelected(selected.merge(getPreselected()));
  }, [summaryScores]);

  function onTagButtonClick(tagId: ModelId) {
    if (selected.includes(tagId)) {
      setSelected(selected.delete(tagId));
    } else {
      setSelected(selected.add(tagId));
    }
  }

  function submit() {
    if (selected.size === 0) {
      return;
    }
    const preselected = getPreselected();
    const rejected = preselected.subtract(selected);
    props.submit(comment.id, selected, rejected);
  }

  return (
    <ClickAwayListener onClickAway={props.clearPopups}>
      <div {...css(SCRIM_STYLE.popupMenu, {padding: '20px 60px'})}>
        <DialogTitle id="article-controls">Reason for rejection</DialogTitle>
        <ul {...css(STYLES.tagsList)}>
          {tags && tags.map((t: ITagModel) => (
            <li key={`tag${t.id}`} {...css(STYLES.listItem)}>
              <CheckboxRow
                label={t.label}
                value={t.id}
                isSelected={selected.includes(t.id)}
                onChange={onTagButtonClick}
              />
            </li>
          ))}
        </ul>
        <div key="footer" {...css({textAlign: 'right', marginBottom: '30px'})}>
          <span onClick={props.clearPopups} {...css({marginRight: '30px', opacity: '0.5'})}>Cancel</span>
          <span onClick={submit} {...css({color: NICE_CONTROL_BLUE, opacity: selected.size > 0 ? 1 : 0.35})}>Reject Comment</span>
        </div>
      </div>
    </ClickAwayListener>
  );
}
