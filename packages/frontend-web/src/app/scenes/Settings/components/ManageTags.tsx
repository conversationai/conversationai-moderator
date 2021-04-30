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

import {ITagModel, TagModel} from '../../../../models';
import {getTags} from '../../../stores/tags';
import {
  GUTTER_DEFAULT_SPACING,
  NICE_MIDDLE_BLUE,
} from '../../../styles';
import {css, stylesheet} from '../../../utilx';
import {SETTINGS_STYLES} from '../settingsStyles';
import {updateTags} from '../store';
import {STYLES} from '../styles';
import {LabelSettings} from './LabelSettings';
import {SaveButtons} from './SaveButtons';

const SMALLER_SCREEN = window.innerWidth < 1200;
const LOCAL_STYLES: any = stylesheet({
  labelTitle: {
    width: 200,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },
  descriptionTitle: {
    flex: 1,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },
  colorTitle: {
    width: '200px',
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
  setSaving(isSaving: boolean): void,
  setError(message: string): void,
}) {
  const baseTags = useSelector(getTags);
  const [tags, setTags] = useState<List<ITagModel>>(List());
  useEffect(() => {
    setTags(baseTags);
    props.setSaving(false);
  }, [baseTags]);

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

    setTags(tags.set(tags.size, newValue));
  }

  function handleLabelChange(tag: ITagModel, value: string) {
    setTags(tags.update(
      tags.findIndex((t) => t.id === tag.id),
      (t) => ({...t, label: value}),
    ));
  }

  function handleDescriptionChange(tag: ITagModel, value: string) {
    setTags(tags.update(
      tags.findIndex((t) =>  t.id === tag.id),
      (t) => ({...t, description: value}),
    ));
  }

  function handleColorChange(tag: ITagModel, color: string) {
    if (!validateColor(color)) {
      console.log('invalid color: ', color);
    }

    setTags(tags.update(
      tags.findIndex((t) =>  t.id === tag.id),
      (t) => ({...t, color}),
    ));
  }

  function handleTagDeletePress(tag: ITagModel) {
    setTags(tags.delete(tags.findIndex((t) =>  t.id === tag.id)));
  }

  function handleTagChange(
    tag: ITagModel,
    key: string,
    value: boolean,
  ) {
    setTags(tags.update(
      tags.findIndex((t) =>  t.id === tag.id),
      (t) => ({...t, [key]: value}),
    ));
  }

  function onCancelPress() {
    setTags(baseTags);
  }

  async function handleFormSubmit() {
    props.setSaving(true);

    try {
      await updateTags(baseTags, tags);
    } catch (exception) {
      props.setError(exception.message);
    }
  }

  const summaryScoreTag = tags.find((tag) => tag.key === 'SUMMARY_SCORE');
  const summaryScoreTagId = summaryScoreTag && summaryScoreTag.id;
  const tagsNoSummary = tags.filter((tag) => tag.id !== summaryScoreTagId).toList();

  return (
    <form {...css(STYLES.formContainer)}>
      <div key="heading" {...css(SETTINGS_STYLES.heading)}>
        <h2 {...css(SETTINGS_STYLES.headingText)}>Tags</h2>
      </div>
      <div key="body" {...css(SETTINGS_STYLES.section)}>
        <div {...css(SETTINGS_STYLES.row, {padding: 0})}>
          <p {...css(LOCAL_STYLES.labelTitle, SMALLER_SCREEN && {width: '184px', marginRight: '20px'})}>Label</p>
          <p {...css(LOCAL_STYLES.descriptionTitle)}>Description</p>
          <p {...css(LOCAL_STYLES.colorTitle, SMALLER_SCREEN && {marginRight: '20px'})}>Color</p>
          <p {...css(LOCAL_STYLES.summaryTitle, SMALLER_SCREEN && {width: '90px', marginRight: '20px'})}>In Batch View</p>
          <p {...css(LOCAL_STYLES.summaryTitle, SMALLER_SCREEN && {width: '90px', marginRight: '20px'})}>Is Taggable</p>
          <p {...css(LOCAL_STYLES.summaryTitle, SMALLER_SCREEN && {width: '90px'}, { marginRight: '68px'})}>In Summary Score</p>
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
        <SaveButtons
          onCancelPress={onCancelPress}
          handleFormSubmit={handleFormSubmit}
          handleAdd={handleAddTag}
          addTip="Add a tag"
        />
      </div>
    </form>
  );
}
