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

import {Fab, Tooltip} from '@material-ui/core';
import {Add} from '@material-ui/icons';
import {List} from 'immutable';
import React from 'react';
import {useSelector} from 'react-redux';
import {
  CategoryModel,
  ICategoryModel,
  ITaggingSensitivityModel,
  ITagModel,
  TaggingSensitivityModel,
  TagModel,
} from '../../../../models';
import {getCategories} from '../../../stores/categories';
import {partial} from '../../../util/partial';
import {css} from '../../../utilx';
import {SETTINGS_STYLES} from '../settingsStyles';
import {RuleRow} from './RuleRow';

let placeholderId = -1;

export function ManageSensitivities(props: {
  tags?: List<ITagModel>;
  taggingSensitivities?:  List<ITaggingSensitivityModel>;
  updateTaggingSensitivities(newSensitivities: List<ITaggingSensitivityModel>): void;
}) {
  const {
    tags,
    taggingSensitivities,
  } = props;

  const categories = useSelector(getCategories);
  const categoriesWithAll = List([
    CategoryModel({
      id: null,
      label: 'All',
      unprocessedCount: 0,
      unmoderatedCount: 0,
      moderatedCount: 0,
    }),
  ]).concat(categories) as List<ICategoryModel>;

  const summaryScoreTag = tags.find((tag) => tag.key === 'SUMMARY_SCORE');
  const summaryScoreTagId = summaryScoreTag && summaryScoreTag.id;
  const tagsWithAll = List([
    TagModel({
      id: null,
      key: 'ALL',
      label: 'All',
      color: null,
    }),
  ]).concat(tags) as List<ITagModel>;
  const tagsWithAllNoSummary = tagsWithAll.filter((tag) => tag.id !== summaryScoreTagId).toList();

  function handleAddTaggingSensitivity(event: React.FormEvent<any>) {
    event.preventDefault();
    const newValue = TaggingSensitivityModel(
      {
        id: (placeholderId--).toString(),
        categoryId: null,
        tagId: null,
        lowerThreshold: .65,
        upperThreshold: 1,
      },
    );

    const updatedTS = taggingSensitivities ?
      taggingSensitivities.set(taggingSensitivities.size, newValue) :
      List([newValue]);

    props.updateTaggingSensitivities(updatedTS);
  }

  function handleTaggingSensitivityChange(category: string, ts: ITaggingSensitivityModel, value: number | string) {
    props.updateTaggingSensitivities(taggingSensitivities.update(
      taggingSensitivities.findIndex((r) => r.equals(ts)),
      (r) => r.set(category, value),
    ));
  }

  function handleTaggingSensitivityDelete(ts: ITaggingSensitivityModel) {
    props.updateTaggingSensitivities(taggingSensitivities.delete(
      taggingSensitivities.findIndex((r) => r.equals(ts)),
    ));
  }

  return (
    <div key="editSensitivitiesSection">
      <div key="heading" {...css(SETTINGS_STYLES.heading)}>
        <h2 {...css(SETTINGS_STYLES.headingText)}>Tagging Sensitivity (determines at what score range a tag will appear in the UI)</h2>
      </div>
      <div key="body" {...css(SETTINGS_STYLES.section)}>
        {taggingSensitivities && taggingSensitivities.map((ts, i) => (
          <RuleRow
            key={i}
            onDelete={handleTaggingSensitivityDelete}
            rule={ts}
            onCategoryChange={partial(handleTaggingSensitivityChange, 'categoryId', ts)}
            onTagChange={partial(handleTaggingSensitivityChange, 'tagId', ts)}
            onLowerThresholdChange={partial(handleTaggingSensitivityChange, 'lowerThreshold', ts)}
            onUpperThresholdChange={partial(handleTaggingSensitivityChange, 'upperThreshold', ts)}
            rangeBottom={Math.round(ts.lowerThreshold * 100)}
            rangeTop={Math.round(ts.upperThreshold * 100)}
            selectedTag={ts.tagId}
            selectedCategory={ts.categoryId}
            categories={categoriesWithAll}
            tags={tagsWithAllNoSummary}
          />
        ))}
        <Tooltip title="Add a tagging sensitivity rule">
          <Fab color="primary" onClick={handleAddTaggingSensitivity}>
            <Add/>
          </Fab>
        </Tooltip>
      </div>
    </div>
  );
}
