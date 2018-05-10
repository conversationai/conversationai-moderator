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
  ARTICLE_CATEGORY_TYPE,
  ARTICLE_HEADLINE_TYPE,
  BUTTON_LINK_TYPE,
  DARK_COLOR,
  LIGHT_PRIMARY_TEXT_COLOR,
  LIGHT_SECONDARY_TEXT_COLOR,
  LOGIN_TITLE_TYPE,
  MEDIUM_COLOR,
} from '../../styles';
import { css, stylesheet } from '../../util';

import {
  API_URL,
  APP_NAME,
} from '../../config';

const STYLES = stylesheet({
  container: {
    maxWidth: '360px',
    margin: '0 auto',
    backgroundColor: DARK_COLOR,
    textAlign: 'center',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translateX(-50%) translateY(-50%)',
  },

  h1: {
    ...LOGIN_TITLE_TYPE,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    marginTop: 0,
    marginBottom: '0.2em',
  },

  button: {
    ...BUTTON_LINK_TYPE,
    padding: '12px 48px',
    backgroundColor: MEDIUM_COLOR,
    color: LIGHT_SECONDARY_TEXT_COLOR,
    textDecoration: 'none',
    display: 'inline-block',
  },

  link: {
    ...BUTTON_LINK_TYPE,
    textDecoration: 'none',
    color: LIGHT_PRIMARY_TEXT_COLOR,
    display: 'inline-block',
  },

  error: {
    fontSize: '48px',
  },

  copy: {
    ...ARTICLE_HEADLINE_TYPE,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    marginBottom: '2em',
  },

  copyLight: {
    ...ARTICLE_CATEGORY_TYPE,
    color: LIGHT_SECONDARY_TEXT_COLOR,
    marginBottom: '2em',
  },
});

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
      <div {...css(STYLES.container)}>
        <h1 {...css(STYLES.h1)}>{APP_NAME}</h1>

        { errorMessage ? (
          <div>
            <p {...css(STYLES.error)}>🤔</p>
            <p {...css(STYLES.copy)}>{errorMessage}</p>
            <p><a key="try-again" href={url} {...css(STYLES.button)}>Try Again</a></p>
          </div>
        ) : (
          <div>
            <p><a key="login" href={url} {...css(STYLES.button)}>Login</a></p>
            <p>
              <a
                href="https://github.com/Jigsaw-Code/moderator"
                target="_blank"
                {...css(STYLES.link)}
              >
                Learn more
              </a>
            </p>
          </div>
        )}
      </div>
    );
  }
}
