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
  API_URL,
} from '../../../../config';
import { css } from '../../../../utilx';
import { ROOT_STYLES } from '../styles';

export interface ILoginProps {
  csrf?: string;
  errorMessage?: boolean | string;
}

export class Login extends React.Component<ILoginProps> {
  render() {
    const { errorMessage, csrf } = this.props;
    const redirectURI = window.location.origin + window.location.pathname;

    let url = `${API_URL}/auth/login/google?`;

    if (csrf) {
      url += `&csrf=${csrf}`;
    }

    if (redirectURI) {
      url += `&referrer=${encodeURIComponent(redirectURI)}`;
    }

    return (
      <div key="login">
        <div key="headerLink" {...css(ROOT_STYLES.header2Tag, ROOT_STYLES.fadeIn)}>
          <a href={url} {...css(ROOT_STYLES.link)}>Sign in</a>
        </div>
        { errorMessage && (
          <div key="login-errors" {...css(ROOT_STYLES.errors, ROOT_STYLES.fadeIn)}>
            <p key="message">{errorMessage}</p>
            <p key="try-again" {...css(ROOT_STYLES.errorsTryAgain)}><a key="try-again" href={url} {...css(ROOT_STYLES.link)}>Try Again</a></p>
          </div>
        )}
      </div>
    );
  }
}
