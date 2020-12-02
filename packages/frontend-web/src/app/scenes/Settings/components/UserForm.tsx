/*
Copyright 2019 Google Inc.

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
import { List } from 'immutable';
import React from 'react';

import {
  Switch,
} from '@material-ui/core';

import { IUserModel } from '../../../../models';
import { USER_GROUP_ADMIN, USER_GROUP_GENERAL } from '../../../stores/users';
import { partial } from '../../../util';
import { css } from '../../../utilx';
import { SETTINGS_STYLES } from '../settingsStyles';

export interface IAddUsersProps {
  onInputChange(type: 'name' | 'email' | 'group' | 'isActive', value: string | boolean): any;
  user?: IUserModel;
}

const GROUPS = List([
  [USER_GROUP_GENERAL, 'Moderator'],
  [USER_GROUP_ADMIN, 'Administrator'],
]) as List<Array<string>>;

export class UserForm extends React.Component<IAddUsersProps> {

  @autobind
  onValueChange(property: 'name' | 'email' | 'group' , e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    e.preventDefault();
    this.props.onInputChange(property, e.target.value);
  }

  @autobind
  onIsActiveChange(e: React.ChangeEvent<HTMLInputElement>) {
    this.props.onInputChange('isActive', e.target.checked);
  }

  render() {
    const {
      user,
    } = this.props;

    const realUser = (user.group === USER_GROUP_GENERAL || user.group === USER_GROUP_ADMIN);

    return (
      <div>
        <div key="name" {...css(SETTINGS_STYLES.row)}>
          <label htmlFor="name" {...css(SETTINGS_STYLES.label)}>Full Name</label>
          <input
            id="name"
            type="text"
            {...css(SETTINGS_STYLES.input, {width: '100%'})}
            value={user.name ? user.name : ''}
            onChange={partial(this.onValueChange, 'name')}
          />
        </div>
        {realUser && (
        <div key="email" {...css(SETTINGS_STYLES.row)}>
          <label htmlFor="email" {...css(SETTINGS_STYLES.label)}>Email Address</label>
          <input
            id="email"
            type="email"
            {...css(SETTINGS_STYLES.input, {width: '100%'})}
            value={user.email ? user.email : ''}
            onChange={partial(this.onValueChange, 'email')}
          />
        </div>
        )}
        {realUser && (
        <div key="group" {...css(SETTINGS_STYLES.row, SETTINGS_STYLES.selectBoxRow)}>
          <label htmlFor="name" {...css(SETTINGS_STYLES.label)}>Group</label>
          <select
            {...css(SETTINGS_STYLES.selectBox)}
            id="group"
            name="group"
            value={user.group ? user.group : ''}
            onChange={partial(this.onValueChange, 'group')}
          >
            {GROUPS.map((group: Array<string>) =>
              <option value={group[0]} key={group[0]}>{group[1]}</option>,
            )}
          </select>
          <span aria-hidden="true" {...css(SETTINGS_STYLES.arrow)} />
        </div>
        )}
        <div key="active" {...css(SETTINGS_STYLES.row)}>
          <label htmlFor="isActive" {...css(SETTINGS_STYLES.label)}>User is active</label>
          <Switch checked={user.isActive} color="primary" onChange={this.onIsActiveChange}/>
        </div>
      </div>
    );
  }
}
