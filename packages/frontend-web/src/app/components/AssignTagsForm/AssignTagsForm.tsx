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

import { autobind } from 'core-decorators';
import { List, Set } from 'immutable';
import React from 'react';

import { ITagModel } from '../../../models';
import { Button, CheckboxRow } from '../../components';
import { maybeCallback, partial } from '../../util';
import { css, stylesheet } from '../../utilx';

import {
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
  WHITE_COLOR,
} from '../../styles';

const STYLES = stylesheet({
  container: {
    padding: `${GUTTER_DEFAULT_SPACING}px`,
    background: `${WHITE_COLOR}`,
  },
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
    color: MEDIUM_COLOR,
    cursor: 'pointer',
    padding: '8px 20px',
    textAlign: 'left',
    width: '100%',

    ':hover': {
      backgroundColor: MEDIUM_COLOR,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },

    ':focus': {
      backgroundColor: MEDIUM_COLOR,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },
  },
  button: {
    width: '100%',
  },
});

export interface IAssignTagsFormProps {
  tags: List<ITagModel>;
  onSubmit(selectedTagIds: Set<string>): any;
  tagsPreselected?: Set<string>;
}

export interface IAssignTagsFormState {
  selectedTagIds: Set<string>;
}

export class AssignTagsForm extends React.Component<IAssignTagsFormProps, IAssignTagsFormState> {

  state = {
    selectedTagIds: this.props.tagsPreselected || Set<string>(),
  };

  @autobind
  onTagButtonClick(tagId: string) {
    if (this.state.selectedTagIds.includes(tagId)) {
      this.setState({
        selectedTagIds: this.state.selectedTagIds.delete(tagId),
      });
    } else {
      this.setState({
        selectedTagIds: this.state.selectedTagIds.add(tagId),
      });
    }
  }

  render() {

    const { tags } = this.props;
    const { selectedTagIds } = this.state;

    return (
      <div {...css(STYLES.container)}>
        <ul {...css(STYLES.tagsList)}>
          {tags && tags.map((t) => (
            <li key={`tag${t.id}`} {...css(STYLES.listItem)}>
              <CheckboxRow
                label={t.label}
                isSelected={selectedTagIds && selectedTagIds.includes(t.id)}
                onChange={partial(this.onTagButtonClick, t.id)}
              />
            </li>
          ))}
        </ul>
        <Button
          buttonStyles={STYLES.button}
          label="Reject Comment"
          disabled={selectedTagIds && selectedTagIds.size === 0}
          onClick={partial(maybeCallback(this.props.onSubmit), selectedTagIds)}
        />
      </div>
    );
  }
}
