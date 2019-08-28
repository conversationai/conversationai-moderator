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

import { storiesOf } from '@storybook/react';
import React from 'react';

import { MagicTimestamp } from './MagicTimestamp';

storiesOf('MagicTimestamps', module)
  .add('MagicTimestamps', () => {
    const now = Date.now();

    return (
      <div>
        <MagicTimestamp timestamp={(new Date(now - 20 * 1000)).toISOString()}/><br/>
        <MagicTimestamp timestamp={(new Date(now - 100 * 1000)).toISOString()}/><br/>
        <MagicTimestamp timestamp={(new Date(now - 30 * 60000)).toISOString()}/><br/>
        <MagicTimestamp timestamp={(new Date(now - 100 * 60000)).toISOString()}/><br/>
        <MagicTimestamp timestamp={(new Date(now - 12 * 3600000)).toISOString()}/><br/>
        <MagicTimestamp timestamp={(new Date(now - 36 * 3600000)).toISOString()}/><br/>
        <MagicTimestamp timestamp={(new Date(now - 50 * 3600000)).toISOString()}/><br/>
        <MagicTimestamp timestamp={(new Date(now + 50 * 3600000)).toISOString()}/><br/>
        <MagicTimestamp timestamp={(new Date(now + 50 * 3600000)).toISOString()} inFuture/><br/>
        <MagicTimestamp timestamp={`${(new Date(now)).getFullYear()}-01-01T12:30:00Z`}/><br/>
        <MagicTimestamp timestamp={'2017-06-24T12:30:00Z'}/>
      </div>
    );
  });
