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
import React from 'react';
import { IUserModel } from '../../../models';
import { Avatar, Checkbox } from '../../components';
import {
  ARTICLE_CATEGORY_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  LABEL_CHECK,
} from '../../styles';
import { css, stylesheet } from '../../util';

const AVATAR_SIZE = 46;

const STYLES = stylesheet({
  base: {
    position: 'relative',
  },

  row: {
    ...ARTICLE_CATEGORY_TYPE,
    alignItems: 'center',
    justifyContent: 'space-between',
    display: 'flex',
    marginBottom: '14px',
    userSelect: 'none',
    width: '100%',
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  rowDisabled: {
    opacity: '0.75',
    backgroundColor: '#eee',
  },

  avatar: {
    height: AVATAR_SIZE,
    marginRight: '28px',
    overflow: 'hidden',
    width: AVATAR_SIZE,
  },

  name: {
    flex: 1,
  },

  center: {
    ...LABEL_CHECK,
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
    width: '100%',
  },
});

export interface ICheckboxRowProps {
  label: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  user?: IUserModel;
  onChange?(): void;
}

export class CheckboxRow
    extends React.Component<ICheckboxRowProps> {

  render() {
    const { label, user, isSelected, isDisabled } = this.props;

    const id = label.replace(/\s/g, '');

    return (
      <div {...css(STYLES.base)}>
        <div {...css(STYLES.row, isDisabled ? STYLES.rowDisabled : {})}>
          <label
            htmlFor={id}
            onClick={this.handleClick}
            {...css(STYLES.center)}
          >
            {user && (
              <span {...css(STYLES.avatar)} aria-hidden="true">
                <Avatar size={AVATAR_SIZE} target={user} />
              </span>
            )}
            <span {...css(STYLES.name)}>{label}</span>
            <Checkbox
              onCheck={this.onCheckboxClick}
              inputId={id}
              isSelected={isSelected}
            />
          </label>
        </div>
      </div>
    );
  }

  @autobind
  handleClick(e: any) {
    e.preventDefault();
    this.props.onChange();
  }

  @autobind
  onCheckboxClick() {
    if (this.props.onChange) {
      this.props.onChange();
    }
  }
}
