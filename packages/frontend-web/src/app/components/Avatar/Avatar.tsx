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

import React, { ReactNode } from 'react';

import { Avatar as MAvatar, Tooltip, withStyles } from '@material-ui/core';

import {
  IAuthorModel,
  IUserModel,
} from '../../../models';
import { randomDarkColor } from '../../util/color';

const MyTooltip = withStyles((theme) => ({
  tooltip: {
    fontSize: 14,
    backgroundColor: theme.palette.common.white,
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
  },
}))(Tooltip);

export function Avatar(props: {
  target: IAuthorModel | IUserModel;
  size: number;
}) {
  const { target, size } = props;

  let avatarURL = (target as IUserModel).avatarURL || (target as IAuthorModel).avatar;
  if (avatarURL && !avatarURL.startsWith('https://')) {
    avatarURL = null;
  }

  const name = target.name;
  const initials = name.match(/\b\w/g) || [];
  const ins = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
  const color = randomDarkColor(name);
  return (
    <div style={{display: 'inline-block', margin: '1px'}}>
      <MyTooltip title={name} placement="top">
        <MAvatar
          alt={name}
          src={avatarURL}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: `#${color}`,
            color: 'white',
            fontSize: `${size / 2}px`,
          }}
        >
          {ins}
        </MAvatar>
      </MyTooltip>
    </div>
  );
}

export function PseudoAvatar(props: {
  children: ReactNode;
  size: number;
}) {
  const {children, size} = props;

  return (
    <div style={{display: 'inline-block', margin: '1px'}}>
      <MAvatar
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${size / 2}px`,
        }}
      >
        {children}
      </MAvatar>
    </div>
  );
}
