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
import React from 'react';

import { IUserModel, UserModel } from '../../../../models';
import {
  ContainerFooter,
  ContainerHeader,
  OverflowContainer,
} from '../../../components';
import {
  USER_GROUP_ADMIN,
  USER_GROUP_GENERAL,
  USER_GROUP_SERVICE,
} from '../../../stores/users';
import {
  GUTTER_DEFAULT_SPACING,
} from '../../../styles';
import { css } from '../../../utilx';
import { UserForm } from './UserForm';

export interface IAddUsersProps {
  userType: string;
  onClickClose(e: React.FormEvent<any>): any;
  onClickDone(user: IUserModel): any;
}

export interface IAddUsersState {
  newUser?: IUserModel;
  isDisabled?: boolean;
}

export class AddUsers extends React.Component<IAddUsersProps, IAddUsersState> {
  // Find a way to generate random ids that will be thrown away.
  state = {
    newUser: UserModel().set('group', this.props.userType).set('isActive', true).set('id', 123),
    isDisabled: true,
  };

  @autobind
  isNewUserValid(user: IUserModel): boolean {
    if (!user.name || user.name.length === 0) {
      return false;
    }

    if (!user.group) {
      return false;
    }

    if (user.group === USER_GROUP_GENERAL || user.group === USER_GROUP_ADMIN) {
      if (!user.email || user.email.length === 0) {
        return false;
      }
    }
    return true;
  }

  @autobind
  onInputChange(inputType: string, value: string) {
    const newUser = this.state.newUser.set(inputType, value);
    this.setState({
      newUser,
      isDisabled: !this.isNewUserValid(newUser),
    });
  }

  @autobind
  onSubmit() {
    this.props.onClickDone(this.state.newUser);
  }

  render() {
    const {
      onClickClose,
    } = this.props;

    const {
      newUser,
      isDisabled,
    } = this.state;

    let title = 'Add a user';

    if (newUser.group === USER_GROUP_SERVICE) {
      title = 'Add a service user';
    }

    return (
      <OverflowContainer
        header={<ContainerHeader onClickClose={onClickClose}>{title}</ContainerHeader>}
        body={(
          <div  {...css({ marginTop: `${GUTTER_DEFAULT_SPACING}px`, marginBottom: `${GUTTER_DEFAULT_SPACING}px`, })}>
            <UserForm onInputChange={this.onInputChange} user={newUser} />
          </div>
        )}
        footer={<ContainerFooter disabled={isDisabled} onClick={this.onSubmit}/>}
      />
    );
  }
}
