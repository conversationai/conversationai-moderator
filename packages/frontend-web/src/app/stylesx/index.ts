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

import { flexCenter } from '../styles';
import { stylesheet } from '../utilx';

export const IMAGE_BASE = 40;

export const big = {
  width: `${IMAGE_BASE}px`,
  height: `${IMAGE_BASE}px`,
};

export const medium = {
  width: `${IMAGE_BASE * 3 / 4}px`,
  height: `${IMAGE_BASE * 3 / 4}px`,
};

export const small = {
  width: `${IMAGE_BASE / 2}px`,
  height: `${IMAGE_BASE / 2}px`,
};

export const ICON_STYLES = stylesheet({
  big: big,
  small: small,

  iconCenter: {
    width: `100%`,
    height: `100%`,
    ...flexCenter,
  },

  iconBackgroundCircle: {
    ...big,
    borderRadius: `${IMAGE_BASE}px`,
    backgroundColor: '#eee',
    display: 'inline-block',
  },

  iconBackgroundCircleSmall: {
    ...small,
    borderRadius: `${IMAGE_BASE / 2}px`,
    backgroundColor: '#eee',
    display: 'inline-block',
  },

  smallIcon: {
    width: `${IMAGE_BASE + 6}px`,
    height: `${IMAGE_BASE + 6}px`,
  },

  xsmallIcon: {
    width: `${IMAGE_BASE / 2 + 3}px`,
    height: `${IMAGE_BASE / 2 + 3}px`,
  },

  smallImage: {
    width: `${IMAGE_BASE}px`,
    height: `${IMAGE_BASE}px`,
    borderRadius: `${(IMAGE_BASE / 2)}px`,
  },

  xsmallImage: {
    width: `${IMAGE_BASE / 2}px`,
    height: `${IMAGE_BASE / 2}px`,
    borderRadius: `${IMAGE_BASE / 4}px`,
  },

  textCenterSmall: {
    ...small,
    fontSize: '12px',
    ...flexCenter,
  },
});

export const COMMON_STYLES = stylesheet({
  cellLink: {
    fontWeight: '500',
    color: 'inherit',
    ':hover': {
      textDecoration: 'underline',
    },
  },

  fadeIn: {
    animationName: {
      from: {
        opacity: 0,
      },

      to: {
        opacity: 1,
      },
    },
    animationDuration: '0.3s',
    animationTimingFunction: 'ease',
    animationIterationCount: 1,
  },
});
