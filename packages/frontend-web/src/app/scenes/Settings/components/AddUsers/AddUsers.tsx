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
import { IUserModel, UserModel } from '../../../../../models';
import {
  DARK_COLOR,
  GUTTER_DEFAULT_SPACING,
  PALE_COLOR,
  SCRIM_Z_INDEX,
} from '../../../../styles';
import { css, stylesheet } from '../../../../utilx';
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

export interface IAddUsersProps {
  onClickClose(e: React.FormEvent<any>): any;
  onClickDone(user: IUserModel): any;
  newUser?: IUserModel;
}

export interface IAddUsersState {
  newUser?: IUserModel;
  isDisabled?: boolean;
}

export class AddUsers extends React.Component<IAddUsersProps, IAddUsersState> {
  // Find a way to generate random ids that will be thrown away.
  state = {
    newUser: this.props.newUser || UserModel().set('group', 'general').set('isActive', true).set('id', 123),
    isDisabled: true,
  };

  @autobind
  isNewUserValid(user: IUserModel): boolean {
    return !!user.name && user.name.length > 0 && !!user.email && user.email.length > 0 && !!user.group;
  }

  @autobind
  onInputChage(inputType: string, value: string) {
    const newUser = this.state.newUser.set(inputType, value);
    this.setState({
      newUser,
      isDisabled: !this.isNewUserValid(newUser),
    });
  }

  @autobind
  onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

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

    return (
      <form onSubmit={this.onSubmit}>
        <OverflowContainer
          header={(
            <div {...css(STYLES.headerRow)}>
              <h1 {...css(STYLES.heading)}>Add a user</h1>
              <button key="close button" {...css(STYLES.closeButton)} aria-label="Close" onClick={onClickClose}>
                <RejectIcon style={{fill: DARK_COLOR}} />
              </button>
            </div>
          )}
          body={(
            <div  {...css({ marginTop: `${GUTTER_DEFAULT_SPACING}px`, marginBottom: `${GUTTER_DEFAULT_SPACING}px`, })}>
              <UserForm onInputChage={this.onInputChage} user={newUser} />
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
