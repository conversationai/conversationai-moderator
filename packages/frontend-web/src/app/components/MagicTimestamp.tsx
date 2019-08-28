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

import React, { useEffect, useState } from 'react';

import { getTimestring } from '../util/time';

export function MagicTimestamp(props: {
  timestamp: string;
  inFuture?: boolean;
}) {
  const {timestamp, inFuture} = props;
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout>>();
  function doUpdate() {
    setTimeoutId(null);
  }

  useEffect(() => {
    return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
    };
  });

  const {text, redrawIn, isRelative} = getTimestring(timestamp, inFuture);

  if (redrawIn > 0 && redrawIn < 60 * 60 * 24 && !timeoutId) {
    setTimeoutId(setTimeout(doUpdate, redrawIn * 1000));
  }

  let disp = text;
  if (isRelative) {
    if (inFuture) {
      disp = `in ` + text;
    }
    else {
      disp += ` ago`;
    }
  }

  return (<span>{disp}</span>);
}
