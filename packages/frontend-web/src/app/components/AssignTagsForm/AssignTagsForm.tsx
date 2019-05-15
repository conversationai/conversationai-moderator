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
import { WithRouterProps } from 'react-router';

import {
  ClickAwayListener,
  DialogTitle,
} from '@material-ui/core';

import { ITagModel, ModelId } from '../../../models';
import { partial } from '../../util';
import { css, stylesheet } from '../../utilx';
import { CheckboxRow } from '../CheckboxRow';

import {
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
  NICE_CONTROL_BLUE,
  SCRIM_STYLE,
} from '../../styles';

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

export interface IAssignTagsFormProps extends WithRouterProps {
  commentId: ModelId;
  tags: List<ITagModel>;
  clearPopups(): void;
  submit(commentId: ModelId, selectedTagIds: Set<ModelId>, rejectedTagIds: Set<ModelId>): Promise<void>;
  tagsPreselected?: Set<ModelId>;
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

  @autobind
  submit() {
    const selectedTagIds = this.state.selectedTagIds;
    if (selectedTagIds.size === 0) {
      return;
    }
    const rejectedTagIds = this.props.tagsPreselected.subtract(selectedTagIds);
    this.props.submit(this.props.commentId, selectedTagIds, rejectedTagIds);
  }

  render() {
    const { tags } = this.props;
    const { selectedTagIds } = this.state;

    const enabled =  selectedTagIds.size > 0;
    return (
      <ClickAwayListener onClickAway={this.props.clearPopups}>
        <div {...css(SCRIM_STYLE.popupMenu, {padding: '20px 60px'})}>
          <DialogTitle id="article-controls">Reason for rejection</DialogTitle>
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
          <div key="footer" {...css({textAlign: 'right', marginBottom: '30px'})}>
            <span onClick={this.props.clearPopups} {...css({marginRight: '30px', opacity: '0.5'})}>Cancel</span>
            <span onClick={this.submit} {...css({color: NICE_CONTROL_BLUE, opacity: enabled ? 1 : 0.35})}>Reject Comment</span>
          </div>
        </div>
      </ClickAwayListener>
    );
  }
}
