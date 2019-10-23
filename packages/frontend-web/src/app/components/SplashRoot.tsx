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

import { stylesheet } from '../utilx';

export const SPLASH_STYLES = stylesheet({
  errors: {
    position: 'absolute',
    bottom: '15vh',
    width: '100%',
    padding: '0 20vw',
    textAlign: 'center',
    fontSize: '2vh',
    color: 'white',
  },

  signIn: {
    position: 'absolute',
    bottom: '30vh',
    width: '100%',
    padding: '0 20vw',
    textAlign: 'center',
    fontSize: '3vh',
    color: 'white',
  },

  errorsTryAgain: {
    fontSize: '2.5vh',
  },

  link: {
    color: 'white',
    ':hover': {
      textDecoration: 'underline',
    },
  },

  inlineLink: {
    color: 'white',
    textDecoration: 'underline',
    ':hover': {
      textDecoration: 'underline',
    },
  },

  header2Tag: {
    position: 'absolute',
    top: '2vh',
    right: '2vh',
    height: '3vh',
    fontSize: '2.5vh',
    paddingTop: '0.5vh',
    fontWeight: 500,
    color: 'white',
  },
});

export function Bubbles() {
  function bubble(x: string) {
    return (
      <div key={x}>
        <div className="landing_bubble"/>
      </div>
    );
  }

  function blank(x: string) {
    return (
      <div key={x}/>
    );
  }

  return (
    <div key="bubbles" className="landing_bubbleSet">
      {[bubble('1'), blank('a'),  blank('b'),  blank('c'),  bubble('l'),
        bubble('2'), bubble('6'), blank('d'),  bubble('h'), bubble('m'),
        bubble('3'), bubble('7'), bubble('e'), bubble('i'), bubble('n'),
        bubble('4'), bubble('8'), bubble('f'), bubble('j'), bubble('o'),
        bubble('5'), bubble('9'), bubble('g'), bubble('k'), bubble('p')]}
    </div>
  );
}

export function SplashFrame(props: React.PropsWithChildren<{}>) {
  return (
    <div>
      <div key="header" className="landing_headerTag">
        Moderator
      </div>
      <div key="footer" className="landing_footerTag">
        <a
          href="https://conversationai.github.io/"
          target="_blank"
          className="landing_link"
        >
          Learn more
        </a> <span className="landing_extratext">about Modereator.</span>
      </div>
      {props.children}
    </div>
  );
}

export function SplashRoot(props: React.PropsWithChildren<{}>) {
  return (
    <SplashFrame>
      <div key="root" className="landing_centerOnPage">
        <Bubbles/>
      </div>
      {props.children}
    </SplashFrame>
  );
}
