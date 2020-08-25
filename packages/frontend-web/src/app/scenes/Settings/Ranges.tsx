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
import {List} from 'immutable';
import React from 'react';
import {RouteComponentProps} from 'react-router';

import {
  Button,
} from '@material-ui/core';

import {
  IPreselectModel,
  IRuleModel,
  ITaggingSensitivityModel,
  ITagModel,
} from '../../../models';
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
  updatePreselects,
  updateRules,
  updateTaggingSensitivities,
  updateTags,
} from './store';

import {
  SCRIM_STYLE,
  VISUALLY_HIDDEN,
} from '../../styles';
import { SETTINGS_STYLES } from './settingsStyles';
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

export interface IRangesProps extends RouteComponentProps<{}>  {
  tags?: List<ITagModel>;
  rules?: List<IRuleModel>;
  taggingSensitivities?:  List<ITaggingSensitivityModel>;
  preselects?: List<IPreselectModel>;
}

export interface IRangesState {
  tags?: List<ITagModel>;
  rules?: List<IRuleModel>;
  taggingSensitivities?:  List<ITaggingSensitivityModel>;
  preselects?:  List<IPreselectModel>;
  baseTags?: List<ITagModel>;
  baseRules?: List<IRuleModel>;
  baseTaggingSensitivities?:  List<ITaggingSensitivityModel>;
  basePreselects?:  List<IPreselectModel>;
  isStatusScrimVisible?: boolean;
  submitStatus?: string;
}

export class Ranges extends React.Component<IRangesProps, IRangesState> {
  state: IRangesState = {
    tags: this.props.tags,
    rules: this.props.rules,
    taggingSensitivities:  this.props.taggingSensitivities,
    preselects:  this.props.preselects,
    baseTags: this.props.tags,
    baseRules: this.props.rules,
    baseTaggingSensitivities:  this.props.taggingSensitivities,
    basePreselects:  this.props.preselects,
    isStatusScrimVisible: false,
  };

  componentWillReceiveProps(_: Readonly<IRangesProps>) {
    if (this.state.isStatusScrimVisible) {
      this.setState({
        isStatusScrimVisible: false,
      });
    }
  }

  componentWillUpdate(nextProps: IRangesProps) {
    if (!this.props.tags.equals(nextProps.tags)) {
      this.setState({
        baseTags: nextProps.tags,
        tags: nextProps.tags,
        isStatusScrimVisible: false,
      });
    }
    if (!this.props.rules.equals(nextProps.rules)) {
      this.setState({
        baseRules: nextProps.rules,
        rules: nextProps.rules,
        isStatusScrimVisible: false,
      });
    }
    if (!this.props.taggingSensitivities.equals(nextProps.taggingSensitivities)) {
      this.setState({
        baseTaggingSensitivities: nextProps.taggingSensitivities,
        taggingSensitivities: nextProps.taggingSensitivities,
        isStatusScrimVisible: false,
      });
    }
    if (!this.props.preselects.equals(nextProps.preselects)) {
      this.setState({
        basePreselects: nextProps.preselects,
        preselects: nextProps.preselects,
        isStatusScrimVisible: false,
      });
    }
  }

  @autobind
  updateTags(tags: List<ITagModel>) {
    this.setState({tags});
  }

  @autobind
  updateRules(rules: List<IRuleModel>) {
    this.setState({rules});
  }

  @autobind
  updateTaggingSensitivities(taggingSensitivities: List<ITaggingSensitivityModel>) {
    this.setState({taggingSensitivities});
  }

  @autobind
  updatePreselects(preselects: List<IPreselectModel>) {
    this.setState({preselects});
  }

  @autobind
  async handleFormSubmit(e: React.MouseEvent<any>) {
    e.preventDefault();

    this.setState({
      isStatusScrimVisible: true,
      submitStatus: 'Saving changes...',
    });

    try {
      await updateTags(this.state.baseTags, this.state.tags);
      await updateRules(this.state.baseRules, this.state.rules);
      await updatePreselects(this.state.basePreselects, this.state.preselects);
      await updateTaggingSensitivities(this.state.baseTaggingSensitivities, this.state.taggingSensitivities);
    } catch (exception) {
      this.setState({
        submitStatus: `There was an error saving your changes. Please reload and try again. Error: ${exception.message}`,
      });
    }
  }

  @autobind
  onCancelPress() {
    this.props.history.goBack();
  }

  render() {
    const {
      tags,
    } = this.state;

    return (
      <div {...css(STYLES.base)}>
        <HeaderBar homeLink title="Settings"/>
        <SettingsSubheaderBar/>
        <div {...css(STYLES.body)}>
          <h1 {...css(VISUALLY_HIDDEN)}>Open Source Moderator Settings: Tags and Ranges</h1>
          <form {...css(STYLES.formContainer)}>
            <ManageTags
              tags={tags}
              updateTags={this.updateTags}
            />
            <ManageAutomatedRules
              rules={this.state.rules}
              tags={tags}
              updateRules={this.updateRules}
            />
            <ManageSensitivities
              tags={tags}
              taggingSensitivities={this.state.taggingSensitivities}
              updateTaggingSensitivities={this.updateTaggingSensitivities}
            />
            <ManagePreselects
              tags={tags}
              preselects={this.state.preselects}
              updatePreselects={this.updatePreselects}
            />
            <div key="submitSection" {...css(SETTINGS_STYLES.buttonGroup)}>
              <div style={{paddingRight: '30px'}}>
                <Button variant="outlined" onClick={this.onCancelPress} style={{width: '150px'}}>
                  Cancel
                </Button>
              </div>
              <div style={{paddingRight: '30px'}}>
                <Button variant="contained" color="primary" onClick={this.handleFormSubmit} style={{width: '150px'}}>
                  Save
                </Button>
              </div>
            </div>
          </form>
        </div>
        <StatusScrim
          visible={this.state.isStatusScrimVisible}
          submitStatus={this.state.submitStatus}
        />
      </div>
    );
  }
}
