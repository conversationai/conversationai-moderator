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
import React, {useState} from 'react';

import { SPLASH_STYLES, SplashFrame, SplashRoot } from '../../components';
import { getOAuthConfig, IApiConfiguration, updateOAuthConfig } from '../../platform/dataService';
import { COMMON_STYLES } from '../../stylesx';
import { css, stylesheet } from '../../utilx';
import { OAuthConfig } from '../Settings/components/OAuthConfig';

export const STYLES = stylesheet({
  frame: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    backgroundColor: 'white',
    fontSize: '2vh',
    margin: '7vh 15vw',
    padding: '2vh 5vh 3vh 5vh',
    borderRadius: '4vh',
    maxWidth: '1000px',
  },
});

interface IConfigureOAuthProps {
  restart(): void;
}

export function ConfigureOAuth(props: IConfigureOAuthProps) {
  const [state, setState] = useState({id: '', secret: ''});
  const [reconnecting, setReconnecting] = useState(false);

  React.useEffect(() => {
    (async () => {
      const oauthConfig = await getOAuthConfig();
      setState(oauthConfig);
    })();
  }, []);

  async function onClickDone(config: IApiConfiguration) {
    await updateOAuthConfig(config);
    setReconnecting(true);
    // Stall for long enough for the server to reinitialise.
    setTimeout(props.restart, 5000);
  }

  if (reconnecting) {
    return (
      <SplashRoot>
        <div key="message" {...css(SPLASH_STYLES.header2Tag, COMMON_STYLES.fadeIn)}>Reconfiguring Server</div>
      </SplashRoot>
    );
  }

  return (
    <SplashFrame>
      <div key="frame" {...css(STYLES.frame, COMMON_STYLES.fadeIn)}>
        <div key="content" {...css(STYLES.content)}>
          <OAuthConfig
            onClickDone={onClickDone}
            id={state.id}
            secret={state.secret}
          />
        </div>
      </div>
    </SplashFrame>
  );
}
