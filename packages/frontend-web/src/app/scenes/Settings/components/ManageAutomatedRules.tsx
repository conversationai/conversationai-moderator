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

import {List} from 'immutable';
import React from 'react';
import {useSelector} from 'react-redux';

import {Fab, Tooltip} from '@material-ui/core';
import {Add} from '@material-ui/icons';

import {
  CategoryModel,
  ICategoryModel,
  IRuleModel,
  IServerAction,
  ITagModel,
  RuleModel,
  SERVER_ACTION_ACCEPT,
} from '../../../../models';
import {getCategories} from '../../../stores/categories';
import {partial} from '../../../util/partial';
import {css} from '../../../utilx';
import {SETTINGS_STYLES} from '../settingsStyles';
import {RuleRow} from './RuleRow';

let placeholderId = -1;

export function ManageAutomatedRules(props: {
  tags?: List<ITagModel>;
  rules?: List<IRuleModel>;
  updateRules(rules: List<IRuleModel>): void;
}) {
  const {
    tags,
    rules,
  } = props;

  const categories = useSelector(getCategories);
  const categoriesWithAll = List([
    CategoryModel({
      id: null,
      label: 'All',
      unprocessedCount: 0,
      unmoderatedCount: 0,
      moderatedCount: 0,
    }),
  ]).concat(categories) as List<ICategoryModel>;

  function handleAddAutomatedRule(event: React.FormEvent<any>) {
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

    const updatedRules = rules ?
      rules.set(this.state.rules.size, newValue) :
      List([newValue]);

    this.updateRules(updatedRules);
  }

  function handleAutomatedRuleChange(category: string, rule: IRuleModel, value: number | string) {
    props.updateRules(rules.update(
      rules.findIndex((r) => r.equals(rule)),
      (r) => r.set(category, value),
      ));
  }

  function handleAutomatedRuleDelete(rule: IRuleModel) {
    props.updateRules(rules.delete(rules.findIndex((r) => r.equals(rule))));
  }

  function handleModerateButtonClick(rule: IRuleModel, action: IServerAction) {
    const updatedRules = rules.update(
      rules.findIndex(((r) => r.equals(rule))),
      (r) => r.set('action', action));
    props.updateRules(updatedRules);
  }

  return (
    <div key="editRulesSection">
      <div key="heading" {...css(SETTINGS_STYLES.heading)}>
        <h2 {...css(SETTINGS_STYLES.headingText)}>Automated Rules</h2>
      </div>
      <div key="body" {...css(SETTINGS_STYLES.section)}>
        {rules && rules.map((rule, i) => (
          <RuleRow
            key={i}
            onDelete={handleAutomatedRuleDelete}
            rule={rule}
            onCategoryChange={partial(handleAutomatedRuleChange, 'categoryId', rule)}
            onTagChange={partial(handleAutomatedRuleChange, 'tagId', rule)}
            onLowerThresholdChange={partial(handleAutomatedRuleChange, 'lowerThreshold', rule)}
            onUpperThresholdChange={partial(handleAutomatedRuleChange, 'upperThreshold', rule)}
            rangeBottom={Math.round(rule.lowerThreshold * 100)}
            rangeTop={Math.round(rule.upperThreshold * 100)}
            selectedTag={rule.tagId}
            selectedCategory={rule.categoryId}
            selectedAction={rule.action}
            hasTagging
            onModerateButtonClick={handleModerateButtonClick}
            categories={categoriesWithAll}
            tags={tags}
          />
        ))}
        <Tooltip title="Add an automated rule">
          <Fab color="primary" onClick={handleAddAutomatedRule}>
            <Add/>
          </Fab>
        </Tooltip>
      </div>
    </div>
  );
}
