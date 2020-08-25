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
import {ITagModel, TagModel} from '../../../../models';
import {css, stylesheet} from '../../../utilx';
import {SETTINGS_STYLES} from '../settingsStyles';
import {LabelSettings} from './LabelSettings';
import {Fab, Tooltip} from '@material-ui/core';
import {Add} from '@material-ui/icons';
import React from 'react';
import {
  GUTTER_DEFAULT_SPACING,
  NICE_MIDDLE_BLUE,
} from '../../../styles';

const SMALLER_SCREEN = window.innerWidth < 1200;
const STYLES: any = stylesheet({
  labelTitle: {
    width: 200,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },
  descriptionTitle: {
    flex: 1,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },
  colorTitle: {
    width: '125px',
    marginRight: `24px`,
  },
  summaryTitle: {
    width: '100px',
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },
  pluginLink: {
    display: 'inline-block',
    color: NICE_MIDDLE_BLUE,
  },
});

function validateColor(color: string): boolean {
  const div = document.createElement('div') as HTMLDivElement;

  div.style.backgroundColor = color;

  return div.style.backgroundColor !== '';
}

let placeholderId = -1;

export function ManageTags(props: {
  tags: List<ITagModel>,
  updateTags(tags: List<ITagModel>): void,
}) {
  const {tags} = props;

  function handleAddTag(event: React.FormEvent<any>) {
    event.preventDefault();
    const newValue = TagModel(
      {
        id: (placeholderId--).toString(),
        key: null,
        label: 'Add Label',
        description: 'Add Description',
        color: '#999999',
      },
    );

    const updatedTags = tags.set(tags.size, newValue);

    props.updateTags(updatedTags);
  }

  function handleLabelChange(tag: ITagModel, value: string) {
    props.updateTags(tags.update(
      tags.findIndex((t) => t.equals(tag)),
      (t) => t.set('label', value),
    ));
  }

  function handleDescriptionChange(tag: ITagModel, value: string) {
    props.updateTags(tags.update(
      tags.findIndex((t) => t.equals(tag)),
      (t) => t.set('description', value),
    ));
  }

  function handleColorChange(tag: ITagModel, color: string) {
    if (!validateColor(color)) {
      console.log('invalid color: ', color);
    }

    props.updateTags(tags.update(
      tags.findIndex((t) => t.equals(tag)),
      (t) => t.set('color', color),
    ));
  }

  function handleTagDeletePress(tag: ITagModel) {
    props.updateTags(tags.delete(tags.findIndex((t) => t.equals(tag))));
  }

  function handleTagChange(
    tag: ITagModel,
    key: string,
    value: boolean,
  ) {
    props.updateTags(tags.update(
      tags.findIndex((t) => t.equals(tag)),
      (t) => t.set(key, value),
    ));
  }

  const summaryScoreTag = tags.find((tag) => tag.key === 'SUMMARY_SCORE');
  const summaryScoreTagId = summaryScoreTag && summaryScoreTag.id;
  const tagsNoSummary = tags.filter((tag) => tag.id !== summaryScoreTagId).toList();

  return (
    <div key="editTagsSection">
      <div key="heading" {...css(SETTINGS_STYLES.heading)}>
        <h2 {...css(SETTINGS_STYLES.headingText)}>Tags</h2>
      </div>
      <div key="body" {...css(SETTINGS_STYLES.section)}>
        <div {...css(SETTINGS_STYLES.row, {padding: 0})}>
          <p {...css(STYLES.labelTitle, SMALLER_SCREEN && {width: '184px', marginRight: '20px'})}>Label</p>
          <p {...css(STYLES.descriptionTitle)}>Description</p>
          <p {...css(STYLES.colorTitle, SMALLER_SCREEN && {marginRight: '20px'})}>Color</p>
          <p {...css(STYLES.summaryTitle, SMALLER_SCREEN && {width: '90px', marginRight: '20px'})}>In Batch View</p>
          <p {...css(STYLES.summaryTitle, SMALLER_SCREEN && {width: '90px', marginRight: '20px'})}>Is Taggable</p>
          <p {...css(STYLES.summaryTitle, SMALLER_SCREEN && {width: '90px'}, { marginRight: '68px'})}>In Summary Score</p>
        </div>
        {tagsNoSummary.map((tag, i) => (
          <LabelSettings
            tag={tag}
            key={i}
            onLabelChange={handleLabelChange}
            onDescriptionChange={handleDescriptionChange}
            onColorChange={handleColorChange}
            onDeletePress={handleTagDeletePress}
            onTagChange={handleTagChange}
          />
        ))}
        <Tooltip title="Add a tag">
          <Fab color="primary" onClick={handleAddTag}>
            <Add/>
          </Fab>
        </Tooltip>
      </div>
    </div>
  );
}
