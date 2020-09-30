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
import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';

import {
  CategoryModel,
  ICategoryModel,
  IRuleModel,
  IServerAction,
  RuleModel,
  SERVER_ACTION_ACCEPT,
} from '../../../../models';
import {getCategories} from '../../../stores/categories';
import {getRules} from '../../../stores/rules';
import {getTags} from '../../../stores/tags';
import {partial} from '../../../util/partial';
import {css} from '../../../utilx';
import {SETTINGS_STYLES} from '../settingsStyles';
import {updateRules} from '../store';
import {STYLES} from '../styles';
import {RuleRow} from './RuleRow';
import {SaveButtons} from './SaveButtons';

let placeholderId = -1;

export function ManageAutomatedRules(props: {
  setSaving(isSaving: boolean): void,
  setError(message: string): void,
}) {
  const baseRules = useSelector(getRules);
  const [rules, setRules] = useState<List<IRuleModel>>(List());
  useEffect(() => {
    setRules(baseRules);
    props.setSaving(false);
  }, [baseRules]);

  const tags = useSelector(getTags);
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
      rules.set(rules.size, newValue) :
      List([newValue]);

    setRules(updatedRules);
  }

  function handleAutomatedRuleChange(category: string, rule: IRuleModel, value: number | string) {
    setRules(rules.update(
      rules.findIndex((r) => r.id === rule.id),
      (r) => ({...r, [category]: value}),
      ));
  }

  function handleAutomatedRuleDelete(rule: IRuleModel) {
    setRules(rules.delete(rules.findIndex((r) => r.id === rule.id)));
  }

  function handleModerateButtonClick(rule: IRuleModel, action: IServerAction) {
    const updatedRules = rules.update(
      rules.findIndex(((r) => r.id === rule.id)),
      (r) => ({...r, action}),
    );
    setRules(updatedRules);
  }

  function onCancelPress() {
    setRules(baseRules);
  }

  async function handleFormSubmit() {
    props.setSaving(true);

    try {
      await updateRules(baseRules, rules);
    } catch (exception) {
      props.setError(exception.message);
    }
  }

  return (
    <form {...css(STYLES.formContainer)}>
      <div key="editRulesSection">
        <div key="heading" {...css(SETTINGS_STYLES.heading)}>
          <h2 {...css(SETTINGS_STYLES.headingText)}>Automated Rules <small>(The server will automatically pass/fail comments that match these filters)</small></h2>
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
          <SaveButtons
            onCancelPress={onCancelPress}
            handleFormSubmit={handleFormSubmit}
            handleAdd={handleAddAutomatedRule}
            addTip="Add an automated rule"
            width="1114px"
          />
        </div>
      </div>
    </form>
  );
}
