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
// tslint:disable:no-bitwise

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function intToRGB(i: number) {
  return `rgb(${(i >> 16) & 0xFF}, ${(i >> 8) & 0xFF}, ${i & 0xFF})`;
}

export function randomDarkColor(seed: string) {
  return intToRGB(hashCode(seed) & 0x007F7F7F);
}

export function randomLightColor(seed: string) {
  return intToRGB(~(hashCode(seed) & 0x007F7F7F));
}
