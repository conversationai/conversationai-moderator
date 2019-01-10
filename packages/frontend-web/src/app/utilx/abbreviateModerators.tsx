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

import { List } from 'immutable';
import { IUserModel } from '../../models';

function firstName(name: string): string {
  return name.split(' ')[0];
}

export const abbreviateModerators = (moderators?: List<IUserModel>): JSX.Element | null => {
  if (!moderators || moderators.size === 0 || moderators.get(0) === undefined) {
    return null;
  }

  if (moderators.size === 1) {
    return (
      <span title={moderators.get(0).name}>{firstName(moderators.get(0).name)}</span>
    );
  }

  if (moderators.size === 2) {
    return (
      <span>
        <span title={moderators.get(0).name}>{firstName(moderators.get(0).name)}</span>
        <span> and </span>
        <span title={moderators.get(1).name}>{firstName(moderators.get(1).name)}</span>
      </span>
    );
  }

  const moderatorNames = moderators
    .slice(2, moderators.size)
    .map((m) => m.name)
    .join(', ');

  return (
    <span>
      <span title={moderators.get(0).name}>{firstName(moderators.get(0).name)}</span>
      <span>, </span>
      <span title={moderators.get(1).name}>{firstName(moderators.get(1).name)}</span>
      <span> and </span>
      <span title={moderatorNames}>
        {moderators.size - 2} other{moderators.size > 3 && 's'}
      </span>
    </span>
  );
};
