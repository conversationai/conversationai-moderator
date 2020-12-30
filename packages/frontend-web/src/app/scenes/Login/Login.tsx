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

import cryptoRandomString from 'crypto-random-string';
import { pick } from 'lodash';
import qs from 'query-string';
import React from 'react';

import { Bubbles, SPLASH_STYLES, SplashFrame, SplashRoot } from '../../components';
import { API_URL } from '../../config';
import { COMMON_STYLES } from '../../stylesx';
import { IReturnURL, setCSRF, setReturnURL } from '../../util';
import { css, stylesheet } from '../../utilx';

export const STYLES = stylesheet({
  frame: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    color: 'white',
    textAlign: 'center',
    fontSize: '2vh',
    padding: '2vh 5vh 3vh 5vh',
  },
});

export interface ILoginProps {
  errorMessage?: string;
  firstUser?: boolean;
  backToOAuth?(): void;
}

export function Login(props: ILoginProps) {
  const query = qs.parse(window.location.search);

  let errorMessage = props.errorMessage;
  if (query.error && query.error === 'true') {
    errorMessage = query.errorMessage as string || 'An error occured.';
  }

  function redirectToLogin() {
    const redirectURI = window.location.origin + window.location.pathname;
    const csrf = cryptoRandomString({length: 32, type: 'alphanumeric'});
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

  function oauthBack() {
    if (!props.backToOAuth) {
      return '';
    }
    return (
      <p key="back" style={{fontSize: '1vh'}}>
        If you are having problems logging in,
        check your <a key="backlink" onClick={props.backToOAuth} {...css(SPLASH_STYLES.inlineLink)}>OAuth configuration.</a>
      </p>
    );
  }

  if (errorMessage) {
    return (
      <SplashRoot>
      return (
        <div key="login-errors" {...css(SPLASH_STYLES.errors, COMMON_STYLES.fadeIn)}>
          <p key="message">{errorMessage}</p>
          <p key="action" {...css(SPLASH_STYLES.errorsTryAgain)}>
            <a key="try-again" onClick={redirectToLogin} {...css(SPLASH_STYLES.link)}>Try Again</a>
          </p>
          {oauthBack()}
        </div>
      </SplashRoot>
    );
  }

  if (props.firstUser) {
    return (
      <SplashFrame>
        <div key="frame" {...css(STYLES.frame, COMMON_STYLES.fadeIn)}>
          <Bubbles/>
          <div key="first-user" {...css(STYLES.content)}>
            <p key="message">There are no administrators registered yet.</p>
            <p key="message2">The first person to log in will become the administrator.<br/>
              Once the first user has registered, the system will be locked down.<br/>
              Additional users can be added on the settings pages.</p>
            <p key="action" {...css(SPLASH_STYLES.errorsTryAgain)}>
              <a onClick={redirectToLogin} {...css(SPLASH_STYLES.link)}>Create First User</a>
            </p>
            <p key="back">
              This also tests out the OAuth configuration you have just set.<br/>If you are having
              problems, you may need to revisit the <a onClick={props.backToOAuth} {...css(SPLASH_STYLES.inlineLink)}>OAuth configuration page</a>
            </p>
          </div>
        </div>
      </SplashFrame>
    );
  }

  return (
    <SplashRoot>
      <div key="signin" {...css(SPLASH_STYLES.signIn, COMMON_STYLES.fadeIn)}>
        <a key="signin" onClick={redirectToLogin} {...css(SPLASH_STYLES.link)}>Sign In</a>
        {oauthBack()}
      </div>
    </SplashRoot>
  );
}
