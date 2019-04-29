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

import { List } from 'immutable';
import React from 'react';

import { IRuleModel } from '../../../models';
import { ConfirmationCircle } from '../../components';
import {
  CENTER_CONTENT,
  NICE_LIGHT_BLUE,
  NICE_MIDDLE_BLUE,
} from '../../styles';
import { css, stylesheet } from '../../utilx';

const STYLES = stylesheet({
  button: {
    background: NICE_MIDDLE_BLUE,
    border: '0',
    cursor: 'pointer',
    width: 32,
    height: 32,
    borderRadius: 32,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },

  wrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    pointerEvents: 'none',
  },

  inner: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },

  bar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: NICE_LIGHT_BLUE,
    border: `1px solid ${NICE_MIDDLE_BLUE}`,
  },
});

function differentiateRules(rules: List<IRuleModel>): Array<IRuleModel> {
  const sortedRules = rules.toArray().sort((a, b) => a.lowerThreshold - b.lowerThreshold);

  return sortedRules.reduce((sum, currentRule, i, allRules) => {
    const nextRule = allRules[i + 1];

    if (nextRule && currentRule.get('upperThreshold') > nextRule.get('lowerThreshold')) {
      sum.push(currentRule.set('upperThreshold', nextRule.lowerThreshold));
    } else {
      sum.push(currentRule);
    }

    return sum;
  }, []);
}

export interface IRuleBarsProps {
  rules?: List<IRuleModel>;
  automatedRuleToast?(rule: IRuleModel): void;
}

export class RuleBars extends React.Component<IRuleBarsProps> {
  render() {
    const {
      rules,
    } = this.props;

    const rulesToDisplay = rules && differentiateRules(rules);

    return (
      <div {...css(STYLES.wrapper)}>
        <div {...css(STYLES.inner)}>
          { rulesToDisplay && rulesToDisplay.map((rule) => {
            const width = rule.upperThreshold - rule.lowerThreshold;
            const left = rule.lowerThreshold;

            return (
              <div
                key={rule.id}
                {...css(STYLES.bar, {
                  width: `${(width) * 100}%`,
                  left: `${(left) * 100}%`,
                })}
              >
                <div {...css(CENTER_CONTENT)}>
                  <span {...css(STYLES.button)}>
                    <ConfirmationCircle
                      backgroundColor={NICE_LIGHT_BLUE}
                      action={rule.action.toLowerCase()}
                      size={26}
                      iconSize={13}
                    />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}
