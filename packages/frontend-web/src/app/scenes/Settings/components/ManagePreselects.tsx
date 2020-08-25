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
import {CategoryModel, ICategoryModel, IPreselectModel, ITagModel, PreselectModel, TagModel} from '../../../../models';
import {css} from '../../../utilx';
import {SETTINGS_STYLES} from '../settingsStyles';
import {RuleRow} from './RuleRow';
import {partial} from '../../../util/partial';
import {Fab, Tooltip} from '@material-ui/core';
import {Add} from '@material-ui/icons';
import React from 'react';
import {useSelector} from 'react-redux';
import {getCategories} from '../../../stores/categories';

let placeholderId = -1;

export function ManagePreselects(props: {
  preselects?:  List<IPreselectModel>;
  tags?: List<ITagModel>;
  updatePreselects(preselects: List<IPreselectModel>): void;
}) {

  const {tags, preselects} = props;

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

    props.updatePreselects(updatedPreselects);
  }

  function handlePreselectChange(category: string, preselect: IPreselectModel, value: number | string) {
    props.updatePreselects(preselects.update(
      preselects.findIndex((r) => r.equals(preselect)),
      (r) => r.set(category, value),
    ));
  }

  function handlePreselectDelete(preselect: IPreselectModel) {
    props.updatePreselects(
      preselects.delete(preselects.findIndex((r) => r.equals(preselect))),
    );
  }

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

  return (
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
        <Tooltip title="Add a preselect">
          <Fab color="primary" onClick={handleAddPreselect}>
            <Add/>
          </Fab>
        </Tooltip>
      </div>
    </div>
  );
}
