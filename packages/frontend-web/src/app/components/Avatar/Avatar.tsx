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
import {
  AuthorModelRecord,
  IAuthorModel,
  IUserModel,
} from '../../../models';
import { DIVIDER_COLOR, MEDIUM_COLOR } from '../../styles';
import { css, stylesheet } from '../../util';
import { UserIcon } from '../Icons';

const ICON_SIZE = '100%';

const STYLES = stylesheet({
  base: {
    borderRadius: '50%',
    overflow: 'hidden',
  },
});

export interface IAvatarProps {
  target: IAuthorModel | IUserModel;
  size: number;
}

export class Avatar extends React.PureComponent<IAvatarProps, void> {
  render() {
    const { target, size } = this.props;

    let avatarURL = target instanceof AuthorModelRecord
        ? (target as IAuthorModel).avatar
                  : (target as IUserModel).avatarURL;

    if (avatarURL && !avatarURL.startsWith('https://')) {
      avatarURL = null;
    }

    const name = target instanceof AuthorModelRecord
        ? (target as IAuthorModel).name
        : (target as IUserModel).name;

    return (
      <div
        {...css(
          STYLES.base,
          {
            width: `${size}px`,
            height: `${size}px`,
            ...(avatarURL ? {} : { backgroundColor: DIVIDER_COLOR }),
          },
        )}
      >
        {
          avatarURL
              ? <img src={avatarURL} alt={name} width="100%" />
              : <UserIcon {...css({ fill: MEDIUM_COLOR })} size={ICON_SIZE} />
        }
      </div>
    );
  }
}
