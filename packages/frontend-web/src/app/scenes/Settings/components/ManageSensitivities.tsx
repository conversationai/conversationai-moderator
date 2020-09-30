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

import {List} from 'immutable';
import React, {useEffect, useState} from 'react';
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
import {getTaggingSensitivities} from '../../../stores/taggingSensitivities';
import {getTags} from '../../../stores/tags';
import {partial} from '../../../util/partial';
import {css} from '../../../utilx';
import {SETTINGS_STYLES} from '../settingsStyles';
import {updateTaggingSensitivities} from '../store';
import {STYLES} from '../styles';
import {RuleRow} from './RuleRow';
import {SaveButtons} from './SaveButtons';

let placeholderId = -1;

export function ManageSensitivities(props: {
  setSaving(isSaving: boolean): void,
  setError(message: string): void,
}) {
  const baseSensitivities = useSelector(getTaggingSensitivities);
  const [sensitivities, setSensitivities] = useState<List<ITaggingSensitivityModel>>(List());
  useEffect(() => {
    setSensitivities(baseSensitivities);
    props.setSaving(false);
  }, [baseSensitivities]);

  const tags = useSelector(getTags);
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

    const updatedTS = sensitivities ?
      sensitivities.set(sensitivities.size, newValue) :
      List([newValue]);

    setSensitivities(updatedTS);
  }

  function handleTaggingSensitivityChange(category: string, ts: ITaggingSensitivityModel, value: number | string) {
    setSensitivities(sensitivities.update(
      sensitivities.findIndex((r) => r.id === ts.id),
      (r) => ({...r, [category]: value}),
    ));
  }

  function handleTaggingSensitivityDelete(ts: ITaggingSensitivityModel) {
    setSensitivities(sensitivities.delete(
      sensitivities.findIndex((r) => r.id === ts.id),
    ));
  }

  function onCancelPress() {
    setSensitivities(baseSensitivities);
  }

  async function handleFormSubmit() {
    props.setSaving(true);

    try {
      await updateTaggingSensitivities(baseSensitivities, sensitivities);
    } catch (exception) {
      props.setError(exception.message);
    }
  }

  return (
    <form {...css(STYLES.formContainer)}>
      <div key="editSensitivitiesSection">
        <div key="heading" {...css(SETTINGS_STYLES.heading)}>
          <h2 {...css(SETTINGS_STYLES.headingText)}>Sensitivity <small>(The range where a score become interesting. Scores that match these ranges are highlighted in the UI)</small></h2>
        </div>
        <div key="body" {...css(SETTINGS_STYLES.section)}>
          {sensitivities && sensitivities.map((ts, i) => (
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
          <SaveButtons
            onCancelPress={onCancelPress}
            handleFormSubmit={handleFormSubmit}
            handleAdd={handleAddTaggingSensitivity}
            addTip="Add a tagging sensitivity rule"
            width="931px"
          />
        </div>
      </div>
    </form>
  );
}
