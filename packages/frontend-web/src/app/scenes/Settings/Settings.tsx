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

import { autobind } from 'core-decorators';
import FocusTrap from 'focus-trap-react';
import { Iterable, List, Map } from 'immutable';
import { generate } from 'randomstring';
import React from 'react';
import { WithRouterProps } from 'react-router';

import {
  Button,
  Fab,
  Tooltip,
} from '@material-ui/core';
import {
  Add,
} from '@material-ui/icons';

import {
  CategoryModel,
  ICategoryModel,
  IPreselectModel,
  IRuleModel,
  IServerAction,
  ITaggingSensitivityModel,
  ITagModel,
  IUserModel,
  ModelId,
  PreselectModel,
  RuleModel,
  SERVER_ACTION_ACCEPT,
  TaggingSensitivityModel,
  TagModel,
} from '../../../models';
import {
  HeaderBar,
  Scrim,
} from '../../components';
import { API_URL } from '../../config';
import { getToken } from '../../platform/localStore';
import { IAppDispatch } from '../../stores';
import {
  USER_GROUP_GENERAL,
  USER_GROUP_SERVICE,
  USER_GROUP_YOUTUBE,
} from '../../stores/users';
import { partial, setCSRF } from '../../util';
import { css, stylesheet } from '../../utilx';
import { AddUsers } from './components/AddUsers';
import { EditUsers } from './components/EditUsers';
import { LabelSettings } from './components/LabelSettings';
import { ModeratorUserRow, ServiceUserRow, UserRow, YoutubeUserRow } from './components/rows';
import { RuleRow } from './components/RuleRow';

import {
  ARTICLE_CATEGORY_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  MEDIUM_COLOR,
  PALE_COLOR,
  SCRIM_STYLE,
  VISUALLY_HIDDEN,
  WHITE_COLOR,
} from '../../styles';
import { SETTINGS_STYLES } from './settingsStyles';

function validateColor(color: string): boolean {
  const div = document.createElement('div') as HTMLDivElement;

  div.style.backgroundColor = color;

  return div.style.backgroundColor !== '';
}

let placeholderId = -1;
const SMALLER_SCREEN = window.innerWidth < 1200;
const STYLES: any = stylesheet({
  base: {
    ...ARTICLE_CATEGORY_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
    position: 'relative',
    height: '100%',
    boxSizing: 'border-box',
  },
  body: {
    height: `calc(100% - ${HEADER_HEIGHT}px)`,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  formContainer: {
    background: WHITE_COLOR,
    paddingBottom: `${GUTTER_DEFAULT_SPACING}px`,
  },
  heading: {
    backgroundColor: PALE_COLOR,
    color: MEDIUM_COLOR,
    padding: `8px ${GUTTER_DEFAULT_SPACING}px`,
  },
  headingText: {
    fontSize: 14,
  },
  section: {
    paddingTop: `${GUTTER_DEFAULT_SPACING}px`,
    paddingLeft: `${GUTTER_DEFAULT_SPACING}px`,
    paddingRight: `${GUTTER_DEFAULT_SPACING}px`,
    paddingBottom: `${GUTTER_DEFAULT_SPACING * 2}px`,
    backgroundColor: WHITE_COLOR,
  },
  labelTitle: {
    width: 200,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },
  descriptionTitle: {
    flex: 1,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },
  colorTitle: {
    width: '125px',
    marginRight: `24px`,
  },
  summaryTitle: {
    width: '100px',
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    padding: `${GUTTER_DEFAULT_SPACING}px`,
  },
  pluginLink: {
    display: 'inline-block',
    color: MEDIUM_COLOR,
  },
});

export interface ISettingsProps extends WithRouterProps {
  users?: Map<ModelId, IUserModel>;
  serviceUsers?: List<IUserModel>;
  moderatorUsers?: List<IUserModel>;
  youtubeUsers?: List<IUserModel>;
  tags?: List<ITagModel>;
  rules?: List<IRuleModel>;
  taggingSensitivities?:  List<ITaggingSensitivityModel>;
  preselects?: List<IPreselectModel>;
  categories: Iterable.Indexed<ICategoryModel>;
  dispatch: IAppDispatch;
  onCancel(): void;
  reloadServiceUsers?(): Promise<void>;
  reloadModeratorUsers?(): Promise<void>;
  reloadYoutubeUsers?(): Promise<void>;
  updatePreselects?(oldPreselects: List<IPreselectModel>, newPreselects: List<IPreselectModel>): void;
  updateRules?(oldRules: List<IRuleModel>, newRules: List<IRuleModel>): void;
  updateTaggingSensitivities?(oldTaggingSensitivities: List<ITaggingSensitivityModel>, newTaggingSensitivities: List<ITaggingSensitivityModel>): void;
  updateTags?(oldTags: List<ITagModel>, newTags: List<ITagModel>): void;
  addUser?(user: IUserModel): Promise<void>;
  modifyUser?(user: IUserModel): Promise<void>;
  submitForm?(
    newPreselects: List<IPreselectModel>,
    newRules: List<IRuleModel>,
    newTaggingSensitivities: List<ITaggingSensitivityModel>,
    newTags: List<ITagModel>,
  ): Error;
  logout (): void;
}

export interface ISettingsState {
  tags?: List<ITagModel>;
  rules?: List<IRuleModel>;
  taggingSensitivities?:  List<ITaggingSensitivityModel>;
  preselects?:  List<IPreselectModel>;
  baseTags?: List<ITagModel>;
  baseRules?: List<IRuleModel>;
  baseTaggingSensitivities?:  List<ITaggingSensitivityModel>;
  basePreselects?:  List<IPreselectModel>;
  isStatusScrimVisible?: boolean;
  isAddUserScrimVisible?: boolean;
  addUserType?: string;
  isEditUserScrimVisible?: boolean;
  selectedUser?: IUserModel;
  homeIsFocused?: boolean;
  submitStatus?: string;
}

export class Settings extends React.Component<ISettingsProps, ISettingsState> {
  state: ISettingsState = {
    tags: this.props.tags,
    rules: this.props.rules,
    taggingSensitivities:  this.props.taggingSensitivities,
    preselects:  this.props.preselects,
    baseTags: this.props.tags,
    baseRules: this.props.rules,
    baseTaggingSensitivities:  this.props.taggingSensitivities,
    basePreselects:  this.props.preselects,
    isStatusScrimVisible: false,
    isAddUserScrimVisible: false,
    isEditUserScrimVisible: false,
    selectedUser: null,
    homeIsFocused: false,
  };

  componentDidMount() {
    this.props.reloadServiceUsers();
    this.props.reloadModeratorUsers();
    this.props.reloadYoutubeUsers();
  }

  componentWillReceiveProps(_: Readonly<ISettingsProps>) {
    if (this.state.isStatusScrimVisible) {
      this.setState({
        isStatusScrimVisible: false,
      });
    }
  }

  componentWillUpdate(nextProps: ISettingsProps) {
    if (!this.props.tags.equals(nextProps.tags)) {
      this.setState({
        baseTags: nextProps.tags,
        tags: nextProps.tags,
      });
    }
    if (!this.props.rules.equals(nextProps.rules)) {
      this.setState({
        baseRules: nextProps.rules,
        rules: nextProps.rules,
      });
    }
    if (!this.props.taggingSensitivities.equals(nextProps.taggingSensitivities)) {
      this.setState({
        baseTaggingSensitivities: nextProps.taggingSensitivities,
        taggingSensitivities: nextProps.taggingSensitivities,
      });
    }
    if (!this.props.preselects.equals(nextProps.preselects)) {
      this.setState({
        basePreselects: nextProps.preselects,
        preselects: nextProps.preselects,
      });
    }
  }

  @autobind
  handleAddUser(type: string, event: React.FormEvent<any>) {
    event.preventDefault();
    this.setState({
      addUserType: type,
      isAddUserScrimVisible: true,
    });
  }

  @autobind
  handleAddUserGeneral(event: React.FormEvent<any>) {
    this.handleAddUser(USER_GROUP_GENERAL, event);
  }

  @autobind
  handleAddUserService(event: React.FormEvent<any>) {
    this.handleAddUser(USER_GROUP_SERVICE, event);
  }

  @autobind
  handleEditUser(userId: ModelId) {
    let user = this.props.users.get(userId);
    if (!user) {
      user = this.props.serviceUsers.find((u) => (u.id === userId));
    }

    this.setState({
      selectedUser: user,
      isEditUserScrimVisible: true,
    });
  }

  @autobind
  handleAddTag(event: React.FormEvent<any>) {
    event.preventDefault();
    const newValue = TagModel(
      {
        id: (placeholderId--).toString(),
        key: null,
        label: 'Add Label',
        description: 'Add Description',
        color: '#999999',
      },
    );

    const updatedTags = this.state.tags.set(this.state.tags.size, newValue);

    this.setState({ tags: updatedTags });
  }

  @autobind
  handleAddAutomatedRule(event: React.FormEvent<any>) {
    event.preventDefault();
    const newValue = RuleModel(
      {
        id: (placeholderId--).toString(),
        createdBy: null,
        categoryId: null,
        tagId: '1',
        lowerThreshold: .8,
        upperThreshold: 1,
        action: SERVER_ACTION_ACCEPT,
      },
    );

    const updatedRules = this.state.rules ?
        this.state.rules.set(this.state.rules.size, newValue) :
        List([newValue]);

    this.setState({ rules: updatedRules });
  }

  @autobind
  handleAddTaggingSensitivity(event: React.FormEvent<any>) {
    event.preventDefault();
    const newValue = TaggingSensitivityModel(
      {
        id: (placeholderId--).toString(),
        categoryId: null,
        tagId: null,
        lowerThreshold: .65,
        upperThreshold: 1,
      },
    );

    const updatedTS = this.state.taggingSensitivities ?
        this.state.taggingSensitivities.set(this.state.taggingSensitivities.size, newValue) :
        List([newValue]);

    this.setState({ taggingSensitivities: updatedTS });
  }

  @autobind
  handleAddPreselect(event: React.FormEvent<any>) {
    event.preventDefault();
    const newValue = PreselectModel(
      {
        id: (placeholderId--).toString(),
        categoryId: null,
        tagId: null,
        lowerThreshold: .8,
        upperThreshold: 1,
      },
    );

    const updatedPreselects = this.state.preselects ?
        this.state.preselects.set(this.state.preselects.size, newValue) :
        List([newValue]);

    this.setState({ preselects: updatedPreselects });
  }

  @autobind
  async handleFormSubmit(e: React.MouseEvent<any>) {
    e.preventDefault();

    this.setState({
      isStatusScrimVisible: true,
      submitStatus: 'Saving changes...',
    });

    const {
      tags: tagsNew,
      rules: rulesNew,
      preselects: preselectsNew,
      taggingSensitivities: taggingSensitivitiesNew,
    } = this.state;

    const submitErrorStatus = await this.props.submitForm(
      preselectsNew,
      rulesNew,
      taggingSensitivitiesNew,
      tagsNew,
    );

    if (submitErrorStatus) {
      this.setState({
        submitStatus: `There was an error saving your changes. Please reload and try again. Error: ${submitErrorStatus.message}`,
      });

      return false;
    }

    // set the current saved value to base so you can diff the changes again after submit
    // then make sure to go get latest from the server so that the id for the rule will be correct
    this.setState({
      baseTags: tagsNew,
      baseRules: rulesNew,
      basePreselects: preselectsNew,
      baseTaggingSensitivities: taggingSensitivitiesNew,
    });
    this.closeStatusScrim();
  }

  closeStatusScrim() {
    // Add some delay so that users know that saving action was taken
    setTimeout(
      () => {
        this.setState({
          isStatusScrimVisible: false,
        });
      },
      600,
    );
  }

  @autobind
  handleLabelChange(tag: ITagModel, value: string) {
    this.setState({
      tags: this.state.tags.update(
        this.state.tags.findIndex((t) => t.equals(tag)),
        (t) => t.set('label', value),
      ),
    });
  }

  @autobind
  handleDescriptionChange(tag: ITagModel, value: string) {
    this.setState({
      tags: this.state.tags.update(
        this.state.tags.findIndex((t) => t.equals(tag)),
        (t) => t.set('description', value),
      ),
    });
  }

  @autobind
  handleColorChange(tag: ITagModel, color: string) {
    if (!validateColor(color)) {
      console.log('invalid color: ', color);
    }

    this.setState({
      tags: this.state.tags.update(
        this.state.tags.findIndex((t) => t.equals(tag)),
        (t) => t.set('color', color),
      ),
    });
  }

  @autobind
  handleTagDeletePress(tag: ITagModel) {
    const tags = this.state.tags;
    this.setState({
      tags: tags.delete(tags.findIndex((t) => t.equals(tag))),
    });
  }

  @autobind
  handleTagChange(
    tag: ITagModel,
    key: string,
    value: boolean,
  ) {
    this.setState({
      tags: this.state.tags.update(
        this.state.tags.findIndex((t) => t.equals(tag)),
        (t) => t.set(key, value),
      ),
    });
  }

  @autobind
  handleAutomatedRuleChange(category: string, rule: IRuleModel, value: number | string) {
    this.setState({
      rules: this.state.rules.update(
        this.state.rules.findIndex((r) => r.equals(rule)),
        (r) => r.set(category, value),
      ),
    });
  }

  @autobind
  handleAutomatedRuleDelete(rule: IRuleModel) {
    this.setState({
      rules: this.state.rules.delete(this.state.rules.findIndex((r) => r.equals(rule))),
    });
  }

  @autobind
  handleModerateButtonClick(rule: IRuleModel, action: IServerAction) {
    const updatedRules = this.state.rules.update(
        this.state.rules.findIndex(((r) => r.equals(rule))),
        (r) => r.set('action', action));
    this.setState({
      rules: updatedRules,
    });
  }

  @autobind
  handleTaggingSensitivityChange(category: string, ts: ITaggingSensitivityModel, value: number | string) {
    this.setState({
      taggingSensitivities: this.state.taggingSensitivities.update(
        this.state.taggingSensitivities.findIndex((r) => r.equals(ts)),
        (r) => r.set(category, value),
      ),
    });
  }

  @autobind
  handleTaggingSensitivityDelete(ts: ITaggingSensitivityModel) {
    this.setState({
      taggingSensitivities: this.state.taggingSensitivities.delete(
          this.state.taggingSensitivities.findIndex((r) => r.equals(ts))),
    });
  }

  @autobind
  handlePreselectChange(category: string, preselect: IPreselectModel, value: number | string) {
    this.setState({
      preselects: this.state.preselects.update(
        this.state.preselects.findIndex((r) => r.equals(preselect)),
        (r) => r.set(category, value),
      ),
    });
  }

  @autobind
  handlePreselectDelete(preselect: IPreselectModel) {
    this.setState({
      preselects: this.state.preselects.delete(this.state.preselects.findIndex((r) => r.equals(preselect))),
    });
  }

  @autobind
  onCancelPress() {
    this.props.onCancel();
  }

  @autobind
  closeScrims() {
    this.setState({
      isAddUserScrimVisible: false,
      isEditUserScrimVisible: false,
    });
  }

  @autobind
  async saveAddedUser(user: IUserModel) {
    await this.setState({
      isAddUserScrimVisible: false,
      isStatusScrimVisible: true,
      submitStatus: 'Saving changes...',
    });

    try {
      await this.props.addUser(user);
      if (user.group === USER_GROUP_SERVICE) {
        await this.props.reloadServiceUsers();
      }
      else if (user.group === USER_GROUP_YOUTUBE) {
        await this.props.reloadYoutubeUsers();
      }
      this.setState({
        submitStatus: 'Waiting for refresh...',
      });
    }
    catch (e) {
      this.setState({
        submitStatus: `There was an error saving your changes. Please reload and try again. Error: ${e.message}`,
      });
    }
  }

  @autobind
  async saveEditedUser(user: IUserModel) {
    await this.setState({
      isEditUserScrimVisible: false,
      isStatusScrimVisible: true,
      submitStatus: 'Saving changes...',
    });

    try {
      await this.props.modifyUser(user);
      if (user.group === USER_GROUP_SERVICE) {
        await this.props.reloadServiceUsers();
      }
      else if (user.group === USER_GROUP_YOUTUBE) {
        await this.props.reloadYoutubeUsers();
      }

      this.setState({
        submitStatus: 'Waiting for refresh...',
      });
    }
    catch (e) {
      this.setState({
        submitStatus: `There was an error saving your changes. Please reload and try again. Error: ${e.message}`,
      });
    }
  }

  @autobind
  onHomeFocus() {
    this.setState({ homeIsFocused: true });
  }

  @autobind
  onHomeBlur() {
    this.setState({ homeIsFocused: false });
  }

  renderUsers() {
    const { users } = this.props;
    const sortedUsers = users.valueSeq().sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div key="editUsersSection">
        <div key="heading" {...css(STYLES.heading)}>
          <h2 {...css(STYLES.headingText)}>Users</h2>
        </div>
        <div key="body" {...css(STYLES.section)}>
          <div {...css(SETTINGS_STYLES.row)}>
            <table>
              <thead>
              <tr>
                <th key="1" {...css(SETTINGS_STYLES.userTableCell)}>
                  Name
                </th>
                <th key="2" {...css(SETTINGS_STYLES.userTableCell)}>
                  Email
                </th>
                <th key="3" {...css(SETTINGS_STYLES.userTableCell)}>
                  Role
                </th>
                <th key="4" {...css(SETTINGS_STYLES.userTableCell)}>
                  Is Active
                </th>
                <th key="5" {...css(SETTINGS_STYLES.userTableCell)}/>
              </tr>
              </thead>
              <tbody>
              {sortedUsers.map((u) => (
                <UserRow key={u.id} user={u} handleEditUser={this.handleEditUser}/>
              ))}
              </tbody>
            </table>
          </div>
          <Tooltip title="Add a user">
            <Fab color="primary" onClick={this.handleAddUserGeneral}>
              <Add/>
            </Fab>
          </Tooltip>
        </div>
      </div>
    );
  }

  renderModeratorUsers() {
    const {
      moderatorUsers,
    } = this.props;

    if (!moderatorUsers || moderatorUsers.count() === 0) {
      return (<p>None configured</p>);
    }
    return (
      <div key="moderatorUsersSection">
        <table>
          <thead>
          <tr>
            <th key="1" {...css(SETTINGS_STYLES.userTableCell)}>
              Name
            </th>
            <th key="3" {...css(SETTINGS_STYLES.userTableCell)}>
              Type
            </th>
            <th key="4" {...css(SETTINGS_STYLES.userTableCell)}>
              Endpoint
            </th>
            <th key="5" {...css(SETTINGS_STYLES.userTableCell)}>
              Is Active
            </th>
            <th key="6" {...css(SETTINGS_STYLES.userTableCell)}/>
          </tr>
          </thead>
          <tbody>
          {moderatorUsers.map((u) => (
            <ModeratorUserRow key={u.id} user={u}/>
          ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderServiceUsers() {
    const {
      serviceUsers,
    } = this.props;

    if (!serviceUsers || serviceUsers.count() === 0) {
      return (<p>None configured</p>);
    }
    return (
      <div key="serviceUsersSection">
        <table>
          <thead>
          <tr>
            <th key="1" {...css(SETTINGS_STYLES.userTableCell)}>
              ID
            </th>
            <th key="2" {...css(SETTINGS_STYLES.userTableCell)}>
              Name
            </th>
            <th key="3" {...css(SETTINGS_STYLES.userTableCell)}>
              JWT Authentication token
            </th>
            <th/>
            <th key="6" {...css(SETTINGS_STYLES.userTableCell)}/>
          </tr>
          </thead>
          <tbody>
          {serviceUsers.map((u) => (
            <ServiceUserRow key={u.id} user={u} handleEditUser={this.handleEditUser}/>
          ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderYoutubeUsers() {
    const {
      youtubeUsers,
    } = this.props;

    if (!youtubeUsers || youtubeUsers.count() === 0) {
      return (<p>None configured</p>);
    }
    return (
      <div key="youtubeUsersSection">
        <table>
          <thead>
          <tr>
            <th key="1" {...css(SETTINGS_STYLES.userTableCell)}>
              Name
            </th>
            <th key="2" {...css(SETTINGS_STYLES.userTableCell)}>
              Email
            </th>
            <th key="4" {...css(SETTINGS_STYLES.userTableCell)}>
              Is Active
            </th>
          </tr>
          </thead>
          <tbody>
          {youtubeUsers.map((u) => (
            <YoutubeUserRow key={u.id} user={u}/>
          ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderTags(tags: List<ITagModel>) {
    return (
      <div key="editTagsSection">
        <div key="heading" {...css(STYLES.heading)}>
          <h2 {...css(STYLES.headingText)}>Tags</h2>
        </div>
        <div key="body" {...css(STYLES.section)}>
          <div {...css(SETTINGS_STYLES.row, {padding: 0})}>
            <p {...css(STYLES.labelTitle, SMALLER_SCREEN && {width: '184px', marginRight: '20px'})}>Label</p>
            <p {...css(STYLES.descriptionTitle)}>Description</p>
            <p {...css(STYLES.colorTitle, SMALLER_SCREEN && {marginRight: '20px'})}>Color</p>
            <p {...css(STYLES.summaryTitle, SMALLER_SCREEN && {width: '90px', marginRight: '20px'})}>In Batch View</p>
            <p {...css(STYLES.summaryTitle, SMALLER_SCREEN && {width: '90px', marginRight: '20px'})}>Is Taggable</p>
            <p {...css(STYLES.summaryTitle, SMALLER_SCREEN && {width: '90px'}, { marginRight: '68px'})}>In Summary Score</p>
          </div>
          {tags && tags.map((tag, i) => (
            <LabelSettings
              tag={tag}
              key={i}
              onLabelChange={this.handleLabelChange}
              onDescriptionChange={this.handleDescriptionChange}
              onColorChange={this.handleColorChange}
              onDeletePress={this.handleTagDeletePress}
              onTagChange={this.handleTagChange}
            />
          ))}
          <Tooltip title="Add a tag">
            <Fab color="primary" onClick={this.handleAddTag}>
              <Add/>
            </Fab>
          </Tooltip>
        </div>
      </div>
    );
  }

  renderRules(tags: List<ITagModel>, categories: List<ICategoryModel>) {
    const {
      rules,
    } = this.state;

    return (
      <div key="editRulesSection">
        <div key="heading" {...css(STYLES.heading)}>
          <h2 {...css(STYLES.headingText)}>Automated Rules</h2>
        </div>
        <div key="body" {...css(STYLES.section)}>
          {rules && rules.map((rule, i) => (
            <RuleRow
              key={i}
              onDelete={this.handleAutomatedRuleDelete}
              rule={rule}
              onCategoryChange={partial(this.handleAutomatedRuleChange, 'categoryId', rule)}
              onTagChange={partial(this.handleAutomatedRuleChange, 'tagId', rule)}
              onLowerThresholdChange={partial(this.handleAutomatedRuleChange, 'lowerThreshold', rule)}
              onUpperThresholdChange={partial(this.handleAutomatedRuleChange, 'upperThreshold', rule)}
              rangeBottom={Math.round(rule.lowerThreshold * 100)}
              rangeTop={Math.round(rule.upperThreshold * 100)}
              selectedTag={rule.tagId}
              selectedCategory={rule.categoryId}
              selectedAction={rule.action}
              hasTagging
              onModerateButtonClick={this.handleModerateButtonClick}
              categories={categories}
              tags={tags}
            />
          ))}
          <Tooltip title="Add an automated rule">
            <Fab color="primary" onClick={this.handleAddAutomatedRule}>
              <Add/>
            </Fab>
          </Tooltip>
        </div>
      </div>
    );
  }

  renderSensitivities(tags: List<ITagModel>, categories: List<ICategoryModel>) {
    const {
      taggingSensitivities,
    } = this.state;
    return (
      <div key="editSensitivitiesSection">
        <div key="heading" {...css(STYLES.heading)}>
          <h2 {...css(STYLES.headingText)}>Tagging Sensitivity (determines at what score range a tag will appear in the UI)</h2>
        </div>
        <div key="body" {...css(STYLES.section)}>
          {taggingSensitivities && taggingSensitivities.map((ts, i) => (
            <RuleRow
              key={i}
              onDelete={this.handleTaggingSensitivityDelete}
              rule={ts}
              onCategoryChange={partial(this.handleTaggingSensitivityChange, 'categoryId', ts)}
              onTagChange={partial(this.handleTaggingSensitivityChange, 'tagId', ts)}
              onLowerThresholdChange={partial(this.handleTaggingSensitivityChange, 'lowerThreshold', ts)}
              onUpperThresholdChange={partial(this.handleTaggingSensitivityChange, 'upperThreshold', ts)}
              rangeBottom={Math.round(ts.lowerThreshold * 100)}
              rangeTop={Math.round(ts.upperThreshold * 100)}
              selectedTag={ts.tagId}
              selectedCategory={ts.categoryId}
              categories={categories}
              tags={tags}
            />
          ))}
          <Tooltip title="Add a tagging sensitivity rule">
            <Fab color="primary" onClick={this.handleAddTaggingSensitivity}>
              <Add/>
            </Fab>
          </Tooltip>
        </div>
      </div>
    );
  }

  renderPreselects(tags: List<ITagModel>, categories: List<ICategoryModel>) {
    const {
      preselects,
    } = this.state;
    return (
      <div key="editRangesSection">
        <div key="heading" {...css(STYLES.heading)}>
          <h2 {...css(STYLES.headingText)}>
            Preselected Batch Ranges (sets the default score range on a per category basis for tags in the batch selection view)
          </h2>
        </div>
        <div key="body" {...css(STYLES.section)}>
          {preselects && preselects.map((preselect, i) => (
            <RuleRow
              key={i}
              onDelete={this.handlePreselectDelete}
              rule={preselect}
              onCategoryChange={partial(this.handlePreselectChange, 'categoryId', preselect)}
              onTagChange={partial(this.handlePreselectChange, 'tagId', preselect)}
              onLowerThresholdChange={partial(this.handlePreselectChange, 'lowerThreshold', preselect)}
              onUpperThresholdChange={partial(this.handlePreselectChange, 'upperThreshold', preselect)}
              rangeBottom={Math.round(preselect.lowerThreshold * 100)}
              rangeTop={Math.round(preselect.upperThreshold * 100)}
              selectedTag={preselect.tagId}
              selectedCategory={preselect.categoryId}
              categories={categories}
              tags={tags}
            />
          ))}
          <Tooltip title="Add a preselect">
            <Fab color="primary" onClick={this.handleAddPreselect}>
              <Add/>
            </Fab>
          </Tooltip>
        </div>
      </div>
    );
  }

  renderAddUserScrim() {
    return (
      <Scrim
        key="addUserScrim"
        scrimStyles={SCRIM_STYLE.scrim}
        isVisible={this.state.isAddUserScrimVisible}
        onBackgroundClick={this.closeScrims}
      >
        <FocusTrap
          focusTrapOptions={{
            clickOutsideDeactivates: true,
          }}
        >
          <div
            key="addUserContainer"
            tabIndex={0}
            {...css(SCRIM_STYLE.popup, {position: 'relative', width: 450})}
          >
            <AddUsers
              userType={this.state.addUserType}
              onClickDone={this.saveAddedUser}
              onClickClose={this.closeScrims}
            />
          </div>
        </FocusTrap>
      </Scrim>
    );
  }

  renderEditUserScrim() {
    return (
      <Scrim
        key="editUserScrim"
        scrimStyles={SCRIM_STYLE.scrim}
        isVisible={this.state.isEditUserScrimVisible}
        onBackgroundClick={this.closeScrims}
      >
        <FocusTrap
          focusTrapOptions={{
            clickOutsideDeactivates: true,
          }}
        >
          <div
            key="editUserContainer"
            tabIndex={0}
            {...css(SCRIM_STYLE.popup, {position: 'relative', width: 450})}
          >
            <EditUsers
              userToEdit={this.state.selectedUser}
              onClickDone={this.saveEditedUser}
              onClickClose={this.closeScrims}
            />
          </div>
        </FocusTrap>
      </Scrim>
    );
  }

  renderStatusScrim() {
    return (
      <Scrim
        key="statusScrim"
        scrimStyles={SCRIM_STYLE.scrim}
        isVisible={this.state.isStatusScrimVisible}
      >
        <FocusTrap
          focusTrapOptions={{
            clickOutsideDeactivates: true,
          }}
        >
          <div {...css(SCRIM_STYLE.popup, {position: 'relative', width: 450})} tabIndex={0}>
            <p>{this.state.submitStatus}</p>
          </div>
        </FocusTrap>
      </Scrim>
    );
  }

  render() {
    const {
      categories,
      logout,
    } = this.props;

    const {
      tags,
    } = this.state;

    const summaryScoreTag = tags.find((tag) => tag.key === 'SUMMARY_SCORE');
    const summaryScoreTagId = summaryScoreTag && summaryScoreTag.id;
    const tagsNoSummary = tags.filter((tag) => tag.id !== summaryScoreTagId).toList();

    const tagsWithAll = List([
      TagModel({
        id: null,
        key: 'ALL',
        label: 'All',
        color: null,
      }),
    ]).concat(tags) as List<ITagModel>;
    const tagsWithAllNoSummary = tagsWithAll.filter((tag) => tag.id !== summaryScoreTagId).toList();

    const categoriesWithAll = List([
      CategoryModel({
        id: null,
        label: 'All',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
      }),
    ]).concat(categories) as List<ICategoryModel>;

    const csrf = generate();
    setCSRF(csrf);
    const token = getToken();
    const youtubeUrl = `${API_URL}/youtube/connect?&csrf=${csrf}&token=${token}`;

    return (
      <div {...css(STYLES.base)}>
        <HeaderBar logout={logout} homeLink title="Settings"/>
        <div {...css(STYLES.body)}>
          <h1 {...css(VISUALLY_HIDDEN)}>Open Source Moderator Settings</h1>
          {this.renderUsers()}
          <form {...css(STYLES.formContainer)}>
            {this.renderTags(tagsNoSummary)}
            {this.renderRules(tags, categoriesWithAll)}
            {this.renderSensitivities(tagsWithAllNoSummary, categoriesWithAll)}
            {this.renderPreselects(tagsWithAll, categoriesWithAll)}
            <div key="submitSection" {...css(STYLES.buttonGroup)}>
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
          <div key="serviceUsersHeader" {...css(STYLES.heading)}>
            <h2 {...css(STYLES.headingText)}>
              System accounts
            </h2>
          </div>
          <div key="serviceUsers" {...css(STYLES.section)}>
            <h3>Service accounts</h3>
            <p>These accounts are used to access the OSMod API.</p>
            {this.renderServiceUsers()}
            <Tooltip title="Add a service user">
              <Fab color="primary" onClick={this.handleAddUserService}>
                <Add/>
              </Fab>
            </Tooltip>

          </div>
          <div key="moderatorUsers" {...css(STYLES.section)}>
            <h3>Moderator accounts</h3>
            <p>These accounts are responsible for sending comments to the Perspective API scorer.</p>
            {this.renderModeratorUsers()}
          </div>
          <div>
            <div key="pluginsHeader" {...css(STYLES.heading)}>
              <h2 {...css(STYLES.headingText)}>
                Plugins
              </h2>
            </div>
            <div key="pluginsContent" {...css(STYLES.section)}>
              <h3>YouTube accounts</h3>
              {this.renderYoutubeUsers()}
              <p><a href={youtubeUrl} {...css(STYLES.pluginLink)}>Connect a YouTube Account</a></p>
              <p>Click the link above, and select a Google user and one of that user's YouTube accounts.</p>
              <p>We'll then start syncing comments with the channels and videos in that account.</p>
              <p>&nbsp;</p>
              <h3>Wordpress</h3>
              <p>Install the Wordpress plugin to use Moderator with your Wordpress blog.</p>
              <p>
                <a href="https://github.com/Jigsaw-Code/osmod-wordpress" {...css(STYLES.pluginLink)}>Get started →</a>
              </p>
              <p>&nbsp;</p>
              <h3>Discourse</h3>
              <p>Install the Discourse plugin to use Moderator with your Discourse community.</p>
              <p>
                <a href="https://github.com/Jigsaw-Code/moderator-discourse" {...css(STYLES.pluginLink)}>Get started →</a>
              </p>
              <p>&nbsp;</p>
              <h3>Reddit</h3>
              <p>A server running a cron job every minute that reads all comments copies them to on your subreddit and syncs their status. Requires owner rights on subreddit.</p>
              <p>
                <a href="https://github.com/Jigsaw-Code/moderator-reddit" {...css(STYLES.pluginLink)}>Get started →</a>
              </p>
              <p>&nbsp;</p>
            </div>
          </div>
        </div>
        {this.renderStatusScrim()}
        {this.renderAddUserScrim()}
        {this.renderEditUserScrim()}
      </div>
    );
  }
}
