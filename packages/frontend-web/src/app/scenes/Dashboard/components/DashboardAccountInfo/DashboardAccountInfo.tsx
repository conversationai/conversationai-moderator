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

import React from 'react';
import { IUserModel } from '../../../../../models';
import { Avatar } from '../../../../components';
import { FOCUS_DATA_ATTR } from '../../../../config';
import {
  ARTICLE_CATEGORY_TYPE,
  BOX_DEFAULT_SPACING,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  LIGHT_COLOR,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
  OFFSCREEN,
} from '../../../../styles';
import { css, stylesheet } from '../../../../util';

const AVATAR_SIZE = 32;
const ARROW_SIZE = 6;

const STYLES = stylesheet({
  base: {
    alignItems: 'center',
    backgroundColor: LIGHT_COLOR,
    display: 'flex',
    flexWrap: 'no-wrap',
    justifyContent: 'space-between',
    marginBottom: `${GUTTER_DEFAULT_SPACING}px`,
    height: HEADER_HEIGHT,
    padding: `0 ${GUTTER_DEFAULT_SPACING}px`,
    cursor: 'pointer',
  },

  profile: {
    display: 'flex',
    alignItems: 'center',
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    overflow: 'hidden',
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },

  name: {
    ...ARTICLE_CATEGORY_TYPE,
    fontSize: '14px',
    color: LIGHT_PRIMARY_TEXT_COLOR,
    maxWidth: 150,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  dropdown: {
    background: 'none',
    border: 0,
    marginRight: `-${BOX_DEFAULT_SPACING}px`,
    padding: `${BOX_DEFAULT_SPACING}px`,
    cursor: 'pointer',
    ':focus': {
      outline: 'none',
      background: MEDIUM_COLOR,
    },
  },

  arrow: {
    display: 'block',
    width: 0,
    height: 0,
    borderLeft: `${ARROW_SIZE}px solid transparent`,
    borderRight: `${ARROW_SIZE}px solid transparent`,
    borderTop: `${ARROW_SIZE}px solid ${LIGHT_PRIMARY_TEXT_COLOR}`,
  },
});

export interface IDashAccountModelProps extends React.HTMLProps<any> {
  user: IUserModel;
  ariaControls?: string;
  ariaExpanded?: boolean;
  buttonRef?(elem: any): any;
  onDropdownClick?(e: React.MouseEvent<any>): any;
  accountDropdownButtonRef?: React.Ref<HTMLButtonElement>;
}

export class DashboardAccountInfo extends React.Component<IDashAccountModelProps, void> {
  render() {
    const {
      user,
      onDropdownClick,
      ariaControls,
      accountDropdownButtonRef,
      ariaExpanded,
    } = this.props;

    return (
      <div {...css(STYLES.base)} onClick={onDropdownClick}>
        <div {...css(STYLES.profile)}>
          <div {...css(STYLES.avatar)}>
            <Avatar target={user} size={AVATAR_SIZE} />
          </div>
          <div {...css(STYLES.name)}>
            Welcome {user.name}
          </div>
        </div>
        <button
          key="accountDropdown"
          ref={accountDropdownButtonRef}
          {...{ [FOCUS_DATA_ATTR]: 'account-dropdown' }}
          aria-controls={ariaControls}
          aria-expanded={ariaExpanded}
          onClick={onDropdownClick}
          {...css(STYLES.dropdown)}
        >
          <span {...css(STYLES.arrow)} />
          {!ariaExpanded && <label {...css(OFFSCREEN)}>Open user account menu</label>}
          {ariaExpanded && <label {...css(OFFSCREEN)}>Close user account menu</label>}
        </button>
      </div>
    );
  }
}
