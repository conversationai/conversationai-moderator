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

function maybeS(val: number) {
  return val > 1 ? 's' : '';
}

export function getTimestring(timestamp: string, inFuture: boolean) {
  const then = new Date(timestamp);
  const now = Date.now();

  let diff = Math.round((now - then.getTime()) / 1000);

  if (inFuture) {
    diff = -diff;
  }

  let text;
  let redrawIn = 0;
  let isRelative = true;

  if (diff < 0 || diff > 60 * 60 * 24 * 7) {
    // Just use the date
    const monthNames = [
      'Jan', 'Feb', 'March',
      'April', 'May', 'June', 'July',
      'Aug', 'Sept', 'Oct',
      'Nov', 'Dec',
    ];

    const day = then.getDate();
    const monthIndex = then.getMonth();
    const year = then.getFullYear();

    text = `${monthNames[monthIndex]} ${day}`;
    if (year !== (new Date(now)).getFullYear()) {
      text += `, ${year}`;
    }
    isRelative = false;
  }
  else if (diff < 60) {
    text = `a few seconds`;
    redrawIn = 60 - diff;
  }
  else if (diff < 60 * 60) {
    const mins = Math.floor(diff / 60);
    if (inFuture) {
      redrawIn = diff - mins * 60 + 1;
    }
    else {
      redrawIn = (mins + 1) * 60 - diff + 1;
    }
    text = `${mins} minute${maybeS(mins)}`;
  }
  else if (diff < 60 * 60 * 24) {
    const hours = Math.floor(diff / 60 / 60);
    if (inFuture) {
      redrawIn = diff - hours * 60 * 60 + 1;
    }
    else {
      redrawIn = (hours + 1) * 60 * 60 - diff + 1;
    }
    text = `${hours} hour${maybeS(hours)}`;
  }
  else if (diff < 60 * 60 * 24 * 7) {
    const days = Math.floor(diff / 60 / 60 / 24);
    if (inFuture) {
      redrawIn = diff - days * 60 * 60 + 1;
    }
    else {
      redrawIn = (days + 1) * 60 * 60 - diff + 1;
    }
    text = `${days} day${maybeS(days)}`;
  }

  return {text, redrawIn, isRelative};
}
