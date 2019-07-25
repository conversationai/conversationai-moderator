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

import { pick } from 'lodash';
import qs from 'query-string';
import { generate } from 'randomstring';
import React from 'react';

import { SPLASH_STYLES, SplashRoot } from '../../components';
import { API_URL } from '../../config';
import { COMMON_STYLES } from '../../stylesx';
import { IReturnURL, setCSRF, setReturnURL } from '../../util';
import { css } from '../../utilx';

export interface ILoginProps {
  errorMessage?: string;
  firstUser?: boolean;
}

export function Login(props: ILoginProps) {
  const query = qs.parse(window.location.search);

  let errorMessage = props.errorMessage;
  if (query.error && query.error === 'true') {
    errorMessage = query.errorMessage as string || 'An error occured.';
  }

  function redirectToLogin() {
    const redirectURI = window.location.origin + window.location.pathname;
    const csrf = generate();
    setCSRF(csrf);
    let url = `${API_URL}/auth/login/google?csrf=${csrf}`;
    if (redirectURI) {
      url += `&referrer=${encodeURIComponent(redirectURI)}`;
    }

    if (!errorMessage) {
      const returnDetails = pick(window.location, ['pathname', 'search']) as IReturnURL;
      setReturnURL(returnDetails);
    }

    window.location.href = url;
  }

  function contents() {
    if (errorMessage) {
      return (
        <div key="login-errors" {...css(SPLASH_STYLES.errors, COMMON_STYLES.fadeIn)}>
          <p key="message">{errorMessage}</p>
          <p key="action" {...css(SPLASH_STYLES.errorsTryAgain)}>
            <a key="try-again" onClick={redirectToLogin} {...css(SPLASH_STYLES.link)}>Try Again</a>
          </p>
        </div>
      );
    }
    if (props.firstUser) {
      return (
        <div key="first-user" {...css(SPLASH_STYLES.errors, COMMON_STYLES.fadeIn)}>
          <p key="message">There are no administrators registered yet.</p>
          <p key="message2">The first person to log in will become the administrator.<br/>
          Once the first user has registered, the system will be locked down.<br/>
          Additional users can be added on the settings pages.</p>
          <p key="action" {...css(SPLASH_STYLES.errorsTryAgain)}>
            <a onClick={redirectToLogin} {...css(SPLASH_STYLES.link)}>Create First User</a>
          </p>
        </div>
      );
    }
    return (
      <div key="signin" {...css(SPLASH_STYLES.signIn, COMMON_STYLES.fadeIn)}>
        <a onClick={redirectToLogin} {...css(SPLASH_STYLES.link)}>Sign In</a>
      </div>
    );
  }

  return (
    <SplashRoot>
      {contents()}
    </SplashRoot>
  );
}
