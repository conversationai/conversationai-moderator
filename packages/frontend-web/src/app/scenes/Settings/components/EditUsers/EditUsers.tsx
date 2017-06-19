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
import { IUserModel } from '../../../../../models';
import {
  DARK_COLOR,
  GUTTER_DEFAULT_SPACING,
  PALE_COLOR,
  SCRIM_Z_INDEX,
} from '../../../../styles';
import { css, stylesheet } from '../../../../util';
import { UserForm } from '../UserForm';

import {
  Button,
  OverflowContainer,
  RejectIcon,
} from '../../../../components';

const STYLES = stylesheet({
  heading: {
    fontSize: '18px',
  },

  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  body: {
    marginTop: `${GUTTER_DEFAULT_SPACING}px`,
    marginBottom: `${GUTTER_DEFAULT_SPACING}px`,
  },

  row: {
    padding: '12px 0',
  },

  closeButton: {
    background: 'none',
    border: 'none',
    position: 'absolute',
    right: GUTTER_DEFAULT_SPACING,
    top: GUTTER_DEFAULT_SPACING,
    cursor: 'pointer',
    zIndex: SCRIM_Z_INDEX,
    ':focus': {
      outline: 'none',
      background: PALE_COLOR,
    },
  },
});

export type IGroup = 'general' | 'admin';

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
    return !!user.name && user.name.length > 0 && !!user.email && user.email.length > 0 && !!user.group;
  }

  @autobind
  onInputChage(inputType: string, value: string) {
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
  onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

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

    return (
      <form onSubmit={this.onSubmit}>
        <OverflowContainer
          header={(
            <div {...css(STYLES.headerRow)}>
              <h1 {...css(STYLES.heading)}>Edit a user</h1>

              <button key="close button" type="button" {...css(STYLES.closeButton)} aria-label="Close" onClick={onClickClose}>
                <RejectIcon style={{fill: DARK_COLOR}} />
              </button>
            </div>
          )}
          body={(
            <div {...css(STYLES.body)}>
              <UserForm onInputChage={this.onInputChage} user={editedUser} />
            </div>
          )}
          footer={(
            <Button disabled={isDisabled} label="Save" />
          )}
        />
      </form>
    );
  }
}
