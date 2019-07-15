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

import React from 'react';

import { COMMON_STYLES } from '../stylesx';
import { css } from '../utilx';
import { SPLASH_STYLES, SplashRoot } from './SplashRoot';

interface IErrorRootProps {
  errorMessage: string;
}

export function ErrorRoot(props: React.PropsWithChildren<IErrorRootProps>) {
  function reloadPage() {
    window.location.href = window.location.pathname;
  }
  return (
    <SplashRoot>
      <div key="errors" {...css(SPLASH_STYLES.errors, COMMON_STYLES.fadeIn)}>
        <p key="message">{props.errorMessage}</p>
        <p key="try-again" {...css(SPLASH_STYLES.errorsTryAgain)}>
          <a key="try-again" onClick={reloadPage} {...css(SPLASH_STYLES.link)}>Try Again</a>
        </p>
      </div>
    </SplashRoot>
  );
}
