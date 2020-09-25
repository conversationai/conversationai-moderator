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
  IPreselectModel,
  ITagModel,
  PreselectModel,
  TagModel,
} from '../../../../models';
import {getCategories} from '../../../stores/categories';
import {getPreselects} from '../../../stores/preselects';
import {getTags} from '../../../stores/tags';
import {partial} from '../../../util/partial';
import {css} from '../../../utilx';
import {SETTINGS_STYLES} from '../settingsStyles';
import {updatePreselects} from '../store';
import {STYLES} from '../styles';
import {RuleRow} from './RuleRow';
import {SaveButtons} from './SaveButtons';

let placeholderId = -1;

export function ManagePreselects(props: {
  setSaving(isSaving: boolean): void,
  setError(message: string): void,
}) {
  const basePreselects = useSelector(getPreselects);
  const [preselects, setPreselects] = useState<List<IPreselectModel>>(List());
  useEffect(() => {
    setPreselects(basePreselects);
    props.setSaving(false);
  }, [basePreselects]);

  function handleAddPreselect(event: React.FormEvent<any>) {
    event.preventDefault();
    const newValue = PreselectModel(
      {
        id: (placeholderId--).toString(),
        categoryId: null,
        tagId: null,
        lowerThreshold: .8,
        upperThreshold: 1,
      },
    );

    const updatedPreselects = preselects ?
      preselects.set(preselects.size, newValue) :
      List([newValue]);

    setPreselects(updatedPreselects);
  }

  function handlePreselectChange(category: string, preselect: IPreselectModel, value: number | string) {
    setPreselects(preselects.update(
      preselects.findIndex((r) => r.equals(preselect)),
      (r) => r.set(category, value),
    ));
  }

  function handlePreselectDelete(preselect: IPreselectModel) {
    setPreselects(
      preselects.delete(preselects.findIndex((r) => r.equals(preselect))),
    );
  }

  const tags = useSelector(getTags);
  const tagsWithAll = List([
    TagModel({
      id: null,
      key: 'ALL',
      label: 'All',
      color: null,
    }),
  ]).concat(tags) as List<ITagModel>;

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

  function onCancelPress() {
    setPreselects(basePreselects);
  }

  async function handleFormSubmit() {
    props.setSaving(true);

    try {
      await updatePreselects(basePreselects, preselects);
    } catch (exception) {
      props.setError(exception.message);
    }
  }

  return (
    <form {...css(STYLES.formContainer)}>
      <div key="editRangesSection">
        <div key="heading" {...css(SETTINGS_STYLES.heading)}>
          <h2 {...css(SETTINGS_STYLES.headingText)}>
            Preselected Batch Ranges (sets the default score range on a per category basis for tags in the batch selection view)
          </h2>
        </div>
        <div key="body" {...css(SETTINGS_STYLES.section)}>
          {preselects && preselects.map((preselect, i) => (
            <RuleRow
              key={i}
              onDelete={handlePreselectDelete}
              rule={preselect}
              onCategoryChange={partial(handlePreselectChange, 'categoryId', preselect)}
              onTagChange={partial(handlePreselectChange, 'tagId', preselect)}
              onLowerThresholdChange={partial(handlePreselectChange, 'lowerThreshold', preselect)}
              onUpperThresholdChange={partial(handlePreselectChange, 'upperThreshold', preselect)}
              rangeBottom={Math.round(preselect.lowerThreshold * 100)}
              rangeTop={Math.round(preselect.upperThreshold * 100)}
              selectedTag={preselect.tagId}
              selectedCategory={preselect.categoryId}
              categories={categoriesWithAll}
              tags={tagsWithAll}
            />
          ))}
          <SaveButtons
            onCancelPress={onCancelPress}
            handleFormSubmit={handleFormSubmit}
            handleAdd={handleAddPreselect}
            addTip="Add a preselect"
            width="931px"
          />
        </div>
      </div>
    </form>
  );
}
