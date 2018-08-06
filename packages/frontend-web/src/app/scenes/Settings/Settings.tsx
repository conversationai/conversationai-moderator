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

import { autobind } from 'core-decorators';
import { List } from 'immutable';
import { generate } from 'randomstring';
import React from 'react';
import { WithRouterProps } from 'react-router';
const FocusTrap = require('focus-trap-react');

import {
  CategoryModel,
  ICategoryModel, IPreselectModel,
  IRuleModel, ITaggingSensitivityModel,
  ITagModel, IUserModel,
  PreselectModel,
  RuleModel,
  TaggingSensitivityModel, TagModel,
} from '../../../models';
import { IConfirmationAction } from '../../../types';
import { getToken } from '../../auth/store';
import {
  Button,
  Header,
  HomeIcon,
  Link,
  Scrim,
} from '../../components';
import { API_URL } from '../../config';
import { IAppDispatch } from '../../stores';
import {css, partial, setCSRF, stylesheet} from '../../util';
import { AddButton } from './components/AddButton';
import { AddUsers } from './components/AddUsers';
import { EditUsers } from './components/EditUsers';
import { LabelSettings } from './components/LabelSettings';
import { RuleRow } from './components/RuleRow';

import {
  ARTICLE_CATEGORY_TYPE,
  DARK_COLOR,
  DARK_PRIMARY_TEXT_COLOR,
  DIVIDER_COLOR,
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
    paddingTop: `${HEADER_HEIGHT}px`,
    boxSizing: 'border-box',
  },
  body: {
    height: '100%',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  formContainer: {
    background: WHITE_COLOR,
    paddingBottom: `${GUTTER_DEFAULT_SPACING}px`,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
    backgroundColor: WHITE_COLOR,
    padding: `${GUTTER_DEFAULT_SPACING}px`,
  },
  cancel: {
    backgroundColor: WHITE_COLOR,
    color: DARK_PRIMARY_TEXT_COLOR,
    border: `1px solid ${DIVIDER_COLOR}`,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
    ':focus': {
      backgroundColor: PALE_COLOR,
    },
  },
  save: {
    backgroundColor: MEDIUM_COLOR,
    color: WHITE_COLOR,
    ':focus': {
      backgroundColor: DARK_COLOR,
    },
  },
  homeButton: {
    padding: `${GUTTER_DEFAULT_SPACING}px`,
    ':focus': {
      outline: 0,
    },
  },
  homeIcon: {
    fill: WHITE_COLOR,
    borderBottom: '2px solid transparent',
  },
  pluginLink: {
    display: 'inline-block',
    color: MEDIUM_COLOR,
    marginBottom: `${GUTTER_DEFAULT_SPACING}px`,
  },
});

export interface ISettingsProps extends WithRouterProps {
  users?: List<IUserModel>;
  tags?: List<ITagModel>;
  rules?: List<IRuleModel>;
  taggingSensitivities?:  List<ITaggingSensitivityModel>;
  preselects?: List<IPreselectModel>;
  categories: List<ICategoryModel>;
  dispatch: IAppDispatch;
  onCancel(): void;
  onSearchClick(): void;
  onAuthorSearchClick(): void;
  updatePreselects?(oldPreselects: List<IPreselectModel>, newPreselects: List<IPreselectModel>): void;
  updateRules?(oldRules: List<IRuleModel>, newRules: List<IRuleModel>): void;
  updateTaggingSensitivities?(oldTaggingSensitivities: List<ITaggingSensitivityModel>, newTaggingSensitivities: List<ITaggingSensitivityModel>): void;
  updateTags?(oldTags: List<ITagModel>, newTags: List<ITagModel>): void;
  updateUsers?(oldUsers: List<IUserModel>, newUsers: List<IUserModel>): void;
  submitForm?(
    newPreselects: List<IPreselectModel>,
    newRules: List<IRuleModel>,
    newTaggingSensitivities: List<ITaggingSensitivityModel>,
    newTags: List<ITagModel>,
    newUsers: List<IUserModel>,
  ): Error;
}

export interface ISettingsState {
  selectedOwner?: string;
  selectedModerator?: string;
  users?: List<IUserModel>;
  tags?: List<ITagModel>;
  rules?: List<IRuleModel>;
  taggingSensitivities?:  List<ITaggingSensitivityModel>;
  preselects?:  List<IPreselectModel>;
  baseUsers?: List<IUserModel>;
  baseTags?: List<ITagModel>;
  baseRules?: List<IRuleModel>;
  baseTaggingSensitivities?:  List<ITaggingSensitivityModel>;
  basePreselects?:  List<IPreselectModel>;
  isScrimVisible?: boolean;
  isAddUserScrimOpen?: boolean;
  isEditUserScrimOpen?: boolean;
  selectedUser?: IUserModel;
  homeIsFocused?: boolean;
  submitStatus?: string;
}

export class Settings extends React.Component<ISettingsProps, ISettingsState> {
  state: ISettingsState = {
    selectedOwner: 'placeholder',
    selectedModerator: 'placeholder',
    users: this.props.users,
    tags: this.props.tags,
    rules: this.props.rules,
    taggingSensitivities:  this.props.taggingSensitivities,
    preselects:  this.props.preselects,
    baseUsers: this.props.users,
    baseTags: this.props.tags,
    baseRules: this.props.rules,
    baseTaggingSensitivities:  this.props.taggingSensitivities,
    basePreselects:  this.props.preselects,
    isScrimVisible: false,
    isAddUserScrimOpen: false,
    isEditUserScrimOpen: false,
    selectedUser: null,
    homeIsFocused: false,
    submitStatus: 'Saving changes...',
  };

  componentWillUpdate(nextProps: ISettingsProps) {
    if (!this.props.users.equals(nextProps.users)) {
      this.setState({
        baseUsers: nextProps.users,
        users: nextProps.users,
      });
    }
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
  handleOwnerChange(event: React.FormEvent<any>) {
    this.setState({ selectedOwner: (event.target as any).value });
  }

  @autobind
  handleModeratorChange(event: React.FormEvent<any>) {
    this.setState({ selectedModerator: (event.target as any).value });
  }

  @autobind
  handleAddUser(event: React.FormEvent<any>) {
    event.preventDefault();
    this.setState({
      isAddUserScrimOpen: true,
    });
  }

  @autobind
  handleEditUser(name: string) {
    this.setState({
      selectedUser: this.state.users.find((user) => user.name === name),
      isEditUserScrimOpen: true,
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
        action: 'approve',
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
  async handleFormSubmit(event?: React.FormEvent<any>) {
    if (event) {
      event.preventDefault();
    }

    const {
      tags: tagsNew,
      rules: rulesNew,
      preselects: preselectsNew,
      taggingSensitivities: taggingSensitivitiesNew,
      users: usersNew,
    } = this.state;

    const submitErrorStatus = await this.props.submitForm(
      preselectsNew,
      rulesNew,
      taggingSensitivitiesNew,
      tagsNew,
      usersNew,
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
    // Add some delay so that users know that saving action was taken
    setTimeout(
      () => {
        this.setState({
          isScrimVisible: false,
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
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    e.preventDefault();
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
  handleModerateButtonClick(rule: IRuleModel, action: IConfirmationAction) {
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
  onCancelPress(e: React.FormEvent<any>) {
    e.preventDefault();
    this.props.onCancel();
  }

  @autobind
  onSavePress() {
    this.setState({
      isScrimVisible: true,
    });
  }

  @autobind
  onSearchClick() {
    this.props.onSearchClick();
  }

  @autobind
  closeAddUserScrim(e: React.FormEvent<any>) {
    e.preventDefault();
    this.setState({
      isAddUserScrimOpen: false,
    });
  }

  @autobind
  closeEditUserScrim(e: React.FormEvent<any>) {
    e.preventDefault();
    this.setState({
      isEditUserScrimOpen: false,
    });
  }

  @autobind
  async saveAddedUser(user: IUserModel) {
    await this.setState({
      users: this.state.users.push(user),
      isAddUserScrimOpen: false,
    });

    this.handleFormSubmit();
  }

  @autobind
  async saveEditedUser(user: IUserModel) {
    await this.setState({
      users: this.state.users.set(this.state.users.findIndex((u) => u.id === user.id), user),
      isEditUserScrimOpen: false,
    });

    this.handleFormSubmit();
  }

  @autobind
  onHomeFocus() {
    this.setState({ homeIsFocused: true });
  }

  @autobind
  onHomeBlur() {
    this.setState({ homeIsFocused: false });
  }

  @autobind
  onUsersSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
    this.handleEditUser(event.target.value);
  }

  render() {
    const {
      categories,
      onAuthorSearchClick,
    } = this.props;

    const {
      selectedOwner,
      selectedModerator,
      tags,
      users,
      rules,
      taggingSensitivities,
      preselects,
      isScrimVisible,
      isAddUserScrimOpen,
      isEditUserScrimOpen,
      selectedUser,
      homeIsFocused,
      submitStatus,
    } = this.state;
    const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name));
    const admins = sortedUsers.filter((user) => user.group === 'admin');

    const summaryScoreTag = tags.find((tag) => tag.key === 'SUMMARY_SCORE');
    const summaryScoreTagId = summaryScoreTag && summaryScoreTag.id;
    const tagsList = tags;
    const tagsWithAll = List([
      TagModel({
        id: null,
        key: 'ALL',
        label: 'All',
        color: null,
      }),
    ]).concat(tags) as List<ITagModel>;
    const tagsWithAllNoSummary = tagsWithAll.filter((tag) => tag.id !== summaryScoreTagId).toList();

    const allCategories = List([
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
        <div {...css(STYLES.header)}>
          <Header onSearchClick={this.onSearchClick} onAuthorSearchClick={onAuthorSearchClick}>
            <Link
              {...css(STYLES.homeButton)}
              to="/"
              key="Home"
              onFocus={this.onHomeFocus}
              onBlur={this.onHomeBlur}
              aria-label="home"
            >
              <HomeIcon {...css(STYLES.homeIcon, homeIsFocused && { borderBottom: `2px solid ${WHITE_COLOR}` })} size={24} />
            </Link>
          </Header>
        </div>
        <div {...css(STYLES.body)}>
          <h1 {...css(VISUALLY_HIDDEN)}>Open Source Moderator Settings</h1>
          <form onSubmit={this.handleFormSubmit} {...css(STYLES.formContainer)}>
            <div key="editUsersSection">
              <div key="heading" {...css(STYLES.heading)}>
                <h2 {...css(STYLES.headingText)}>Edit Users</h2>
              </div>
              <div key="body" {...css(STYLES.section)}>
                <div {...css(SETTINGS_STYLES.row, SETTINGS_STYLES.selectContainer)}>
                  <label {...css(SETTINGS_STYLES.label)} htmlFor="owners">
                    Owners:
                  </label>
                  <select
                    {...css(SETTINGS_STYLES.selectBox)}
                    id="owners"
                    name="owners"
                    value={selectedOwner}
                    onChange={this.onUsersSelectChange}
                  >
                    <option value="placeholder" disabled>Select an Owner</option>
                    {admins.map((owner) => (
                      <option value={owner.name} key={owner.id}>{owner.name}</option>
                    ))}
                  </select>
                  <span aria-hidden="true" {...css(SETTINGS_STYLES.arrow)} />
                </div>
                <div {...css(SETTINGS_STYLES.row, SETTINGS_STYLES.selectContainer)}>
                  <label {...css(SETTINGS_STYLES.label)} htmlFor="moderators">
                    Moderators:
                  </label>
                  <select
                    {...css(SETTINGS_STYLES.selectBox)}
                    id="moderators"
                    name="moderators"
                    value={selectedModerator}
                    onChange={this.onUsersSelectChange}
                  >
                    <option value="placeholder" disabled>Select a Moderator</option>
                    {sortedUsers.map((moderator) => (
                      <option
                        value={moderator.name}
                        key={moderator.id}
                      >
                        {moderator.name}
                      </option>
                    ))}
                  </select>
                  <span aria-hidden="true" {...css(SETTINGS_STYLES.arrow)} />
                </div>
                <AddButton width={44} onClick={this.handleAddUser} label="Add a user" />
              </div>
            </div>

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
                  <p {...css(STYLES.summaryTitle, SMALLER_SCREEN && {width: '90px', marginRight: '20px'}, { marginRight: '98px'})}>In Summary Score</p>
                </div>
                {tags && tags.map((tag, i) => tag.id !== summaryScoreTagId && (
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
                <AddButton width={44} onClick={this.handleAddTag} label="Add a tag"/>
              </div>
            </div>

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
                    categories={allCategories}
                    tags={tagsList}
                  />
                ))}
                <AddButton width={44} onClick={this.handleAddAutomatedRule} label="Add an automated rule"/>
              </div>
            </div>

            <div key="editSensitivitiesSection">
              <div key="heading" {...css(STYLES.heading)}>
                <h2 {...css(STYLES.headingText)}>Tagging Sensitivity (determines at what score range a tag will appear in the UI)</h2>
              </div>
              <div key="body" {...css(STYLES.section)}>
                {taggingSensitivities && taggingSensitivities.map((ts, i) => ts.tagId !== summaryScoreTagId &&  (
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
                    categories={allCategories}
                    tags={tagsWithAllNoSummary}
                  />
                ))}
                <AddButton width={44} onClick={this.handleAddTaggingSensitivity} label="Add a tagging sensitivity rule"/>
              </div>
            </div>

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
                    categories={allCategories}
                    tags={tagsWithAll}
                  />
                ))}
                <AddButton width={44} onClick={this.handleAddPreselect} label="Add a preselect"/>
              </div>
            </div>

            <div key="submitSection" {...css(STYLES.buttonGroup)}>
              <Button key="cancel" buttonStyles={STYLES.cancel} label="Cancel" onClick={this.onCancelPress}/>
              <Button key="save" buttonStyles={STYLES.save} label="Save" onClick={this.onSavePress}/>
            </div>
          </form>
          <div>
            <div key="pluginsHeader" {...css(STYLES.heading)}>
              <h2 {...css(STYLES.headingText)}>
                Plugins
              </h2>
            </div>
            <div key="pluginsContent" {...css(STYLES.section)}>
              <h3>YouTube</h3>
              <p>Click the link below, and select a user and one of that user's YouTube accounts.</p>
              <p>We'll then start syncing comments with the channels and videos in that account.</p>
              <p><a href={youtubeUrl} {...css(STYLES.pluginLink)}>Connect Your YouTube Account</a></p>

              <h3>Wordpress</h3>
              <p>Install the Wordpress plugin to use Moderator with your Wordpress blog.</p>
              <p>
                <a href="https://github.com/Jigsaw-Code/osmod-wordpress" {...css(STYLES.pluginLink)}>Get started →</a>
              </p>
              <h3>Discourse</h3>
              <p>Install the Discourse plugin to use Moderator with your Discourse community.</p>
              <p>
                <a href="https://github.com/Jigsaw-Code/moderator-discourse" {...css(STYLES.pluginLink)}>Get started →</a>
              </p>
              <h3>Reddit</h3>
              <p>A server running a cron job every minute that reads all comments copies them to on your subreddit and syncs their status. Requires owner rights on subreddit.</p>
              <p>
                <a href="https://github.com/Jigsaw-Code/moderator-reddit" {...css(STYLES.pluginLink)}>Get started →</a>
              </p>
            </div>
          </div>
        </div>
        <Scrim
          key="changesScrim"
          scrimStyles={SCRIM_STYLE.scrim}
          isVisible={isScrimVisible}
        >
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
            }}
          >
            <div {...css(SCRIM_STYLE.popup, {position: 'relative', width: 450})} tabIndex={0}>
              <p>{submitStatus}</p>
            </div>
          </FocusTrap>
        </Scrim>
        <Scrim
          key="addUserScrim"
          scrimStyles={SCRIM_STYLE.scrim}
          isVisible={isAddUserScrimOpen}
          onBackgroundClick={this.closeAddUserScrim}
        >
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
            }}
          >
            <div
              key="addUserContainer"
              tabIndex={0}
              {...css(SCRIM_STYLE.popup, {position: 'relative', paddingRight: 0, width: 450})}
            >
              <AddUsers
                onClickDone={this.saveAddedUser}
                onClickClose={this.closeAddUserScrim}
              />
            </div>
          </FocusTrap>
        </Scrim>
        <Scrim
          key="editUserScrim"
          scrimStyles={SCRIM_STYLE.scrim}
          isVisible={isEditUserScrimOpen}
          onBackgroundClick={this.closeEditUserScrim}
        >
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
            }}
          >
            <div
              key="editUserContainer"
              tabIndex={0}
              {...css(SCRIM_STYLE.popup, {position: 'relative', paddingRight: 0, width: 450})}
            >
              <EditUsers
                userToEdit={selectedUser}
                onClickDone={this.saveEditedUser}
                onClickClose={this.closeEditUserScrim}
              />
            </div>
          </FocusTrap>
        </Scrim>
      </div>
    );
  }
}
