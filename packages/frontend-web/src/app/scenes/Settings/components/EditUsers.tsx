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

import { IUserModel } from '../../../../models';
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
import { css, stylesheet } from '../../../utilx';
import { UserForm } from './UserForm';

const STYLES = stylesheet({
  body: {
    marginTop: `${GUTTER_DEFAULT_SPACING}px`,
    marginBottom: `${GUTTER_DEFAULT_SPACING}px`,
  },
});

export interface IEditUsersProps {
  onClickClose(e: React.FormEvent<any>): any;
  onClickDone(user: IUserModel): any;
  userToEdit?: IUserModel;
}

export interface IEditUsersState {
  editedUser?: IUserModel;
  isDisabled?: boolean;
}

export class EditUsers extends React.Component<IEditUsersProps, IEditUsersState> {

  state = {
    editedUser: this.props.userToEdit,
    isDisabled: true,
  };

  @autobind
  isUserValid(user: IUserModel): boolean {
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
    const editedUser = this.state.editedUser.set(inputType, value);
    this.setState({
      editedUser,
      isDisabled: !this.isUserValid(editedUser),
    });
  }

  @autobind
  iseEditedUserValid(user: IUserModel): boolean {
    return !!user.name && user.name.length > 0 && !!user.email && user.email.length > 0 && !!user.group;
  }

  @autobind
  onSubmit() {
    this.props.onClickDone(this.state.editedUser);
  }

  render() {
    const {
      onClickClose,
    } = this.props;

    const {
      editedUser,
      isDisabled,
    } = this.state;

    let title = 'Edit a user';

    if (editedUser.group === USER_GROUP_SERVICE) {
      title = 'Edit a service user';
    }

    return (
      <OverflowContainer
        header={<ContainerHeader onClickClose={onClickClose}>{title}</ContainerHeader>}
        body={(
          <div {...css(STYLES.body)}>
            <UserForm onInputChange={this.onInputChange} user={editedUser} />
          </div>
        )}
        footer={<ContainerFooter disabled={isDisabled} onClick={this.onSubmit}/>}
      />
    );
  }
}
