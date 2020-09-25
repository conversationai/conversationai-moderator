/*
Copyright 2020 Google Inc.

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

import {autobind} from 'core-decorators';
import React from 'react';

import {
  HeaderBar,
  Scrim,
} from '../../components';
import {css} from '../../utilx';
import {SettingsSubheaderBar} from '../Comments/components/SubheaderBar';
import {ManageAutomatedRules} from './components/ManageAutomatedRules';
import {ManagePreselects} from './components/ManagePreselects';
import {ManageSensitivities} from './components/ManageSensitivities';
import {ManageTags} from './components/ManageTags';

import {
  SCRIM_STYLE,
  VISUALLY_HIDDEN,
} from '../../styles';
import { STYLES } from './styles';

function StatusScrim(props: {visible: boolean, submitStatus: string}) {
  return (
    <Scrim
      key="statusScrim"
      scrimStyles={SCRIM_STYLE.scrim}
      isVisible={props.visible}
    >
      <div {...css(SCRIM_STYLE.popup, {position: 'relative', width: 450})} tabIndex={0}>
        <p>{props.submitStatus}</p>
      </div>
    </Scrim>
  );
}

export interface IRangesProps  {
}

export interface IRangesState {
  isStatusScrimVisible?: boolean;
  submitStatus?: string;
}

export class Ranges extends React.Component<IRangesProps, IRangesState> {
  state: IRangesState = {
    isStatusScrimVisible: false,
  };

  componentWillReceiveProps(_: Readonly<IRangesProps>) {
    if (this.state.isStatusScrimVisible) {
      this.setState({
        isStatusScrimVisible: false,
      });
    }
  }

  @autobind
  setSaving(isSaving: boolean) {
    if (isSaving) {
      this.setState({
        isStatusScrimVisible: true,
        submitStatus: 'Saving changes...',
      });
    }
    else {
      this.setState({
        isStatusScrimVisible: false,
      });
    }
  }

  @autobind
  setError(message: string) {
    this.setState({
      isStatusScrimVisible: true,
      submitStatus: `There was an error saving your changes. Please reload and try again. Error: ${message}`,
    });
  }

  render() {
    return (
      <div {...css(STYLES.base)}>
        <HeaderBar homeLink title="Settings"/>
        <SettingsSubheaderBar/>
        <div {...css(STYLES.body)}>
          <h1 {...css(VISUALLY_HIDDEN)}>Open Source Moderator Settings: Tags and Ranges</h1>
          <ManageTags
            setSaving={this.setSaving}
            setError={this.setError}
          />
          <ManageAutomatedRules
            setSaving={this.setSaving}
            setError={this.setError}
          />
          <ManageSensitivities
            setSaving={this.setSaving}
            setError={this.setError}
          />
          <ManagePreselects
            setSaving={this.setSaving}
            setError={this.setError}
          />
        </div>
        <StatusScrim
          visible={this.state.isStatusScrimVisible}
          submitStatus={this.state.submitStatus}
        />
      </div>
    );
  }
}
