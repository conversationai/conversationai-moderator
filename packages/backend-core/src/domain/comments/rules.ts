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

import {
  groupBy,
  mapValues,
  max,
  uniq,
} from 'lodash';
import {
  CommentSummaryScore,
  ICommentInstance,
  ICommentSummaryScoreInstance,
  IModerationRuleInstance,
  ModerationRule,
  Tag,
} from '../../models';
import {
  approve,
  defer,
  getHighlightStateData,
  IDecision,
  reject,
} from './state';

export interface ICompiledScores {
  [tagId: number]: number;
}

/**
 * Take a list of scores and compose them into an object whose keys are tag ids and whose values
 * are scores in those tags. If there are multiple scores for the same tag, we take the max.
 */
export function compileScores(commentScores: Array<ICommentSummaryScoreInstance>): ICompiledScores {
  const grouped = groupBy(commentScores, (score) => score.get('tagId'));

  return mapValues(grouped, (scores) => {
    // Pull out `score` field values and return their average
    // TODO(ldixon): typehack to be fixed.
    return max(scores.map((score) => (score as any).get('score')));
  });
}

/**
 * Resolve a comment state based on passed in scores and rules. If any rules match up with the comment and there's
 * consensus in their actions, it is applied to the comment. If there's any disagreement, it's deferred. The
 * "highlight" action is only applied if the comment is approved. If no rules match, the comment is returned
 * unchanged.
 *
 * @param  {object} comment  Comment model instance
 * @param  {array} scores    Array of CommentScore instances
 * @param  {array} rules     Array of ModerationRule instances
 * @return {object} Promise object that resolves with the comment, updated if anything's changed
 */
export async function resolveComment(
  comment: ICommentInstance,
  scores: Array<ICommentSummaryScoreInstance>,
  rules?: Array<IModerationRuleInstance>,
): Promise<IDecision | null> {
  // Add a fake score for SUMMARY_SCORE so that rules can be written against it.
  const summaryScoreTag = await Tag.findOne({
    where: {
      key: 'SUMMARY_SCORE',
    },
  });

  let compiledScores: ICompiledScores;

  if (summaryScoreTag) {
    const tempSummaryScore = CommentSummaryScore.build({
      commentId: comment.id,
      tagId: summaryScoreTag.id,
      score: comment.get('maxSummaryScore'),
    });

    compiledScores = compileScores([tempSummaryScore, ...scores]);
  } else {
    compiledScores = compileScores(scores);
  }

  if (!rules) {
    rules = await ModerationRule.findAll();
  }

  const article = await (comment as any).getArticle();

  const matchingRules = rules.filter((r) => {
    const score = compiledScores[r.get('tagId')];

    return score && score >= r.get('lowerThreshold') && score <= r.get('upperThreshold');
  });

  const globalRules = matchingRules.filter((r) => !r.get('categoryId'));
  const categoryRules = matchingRules.filter((r) => article && r.get('categoryId') === article.get('categoryId'));

  function isThereConsensus(testRules: Array<IModerationRuleInstance>): boolean {
    const actions = testRules.map((r) => r.get('action').toLowerCase());

    // Replace highlight with accept.
    const replacedActions = actions.map((a) => a === 'highlight' ? 'accept' : a);

    return uniq(replacedActions).length === 1;
  }

  let consensus;
  let appliedRule;
  let wasHighlighted;

  // Only global applies.
  if ((globalRules.length > 0) && (categoryRules.length <= 0)) {
    consensus = isThereConsensus(globalRules);
    appliedRule = globalRules[globalRules.length - 1];
    wasHighlighted = globalRules.some((r) => r.get('action').toLowerCase() === 'highlight');
  }

  else if (
    // Only category applies
    ((globalRules.length <= 0) && (categoryRules.length > 0)) ||

    // Both apply, but we prefer the category overrides
    ((globalRules.length > 0) && (categoryRules.length > 0))
  ) {
    consensus = isThereConsensus(categoryRules);
    appliedRule = categoryRules[categoryRules.length - 1];
    wasHighlighted = categoryRules.some((r) => r.get('action').toLowerCase() === 'highlight');
  }

  // Nothing applies
  else {
    return null;
  }

  // If there's no consensus or everything is "defer", defer the comment
  if (!consensus) {
    await defer(comment, null, false);
    await comment.set('isAutoResolved', true).save();

    return {
      resolution: 'Defer',
      resolver: null,
    };
  }

  const appliedAction = appliedRule.get('action').toLowerCase();
  const replacedAction = appliedAction === 'highlight' ? 'accept' : appliedAction;

  // If all actions are equal, we have consensus and we can approve or reject
  if (replacedAction === 'accept') {
    // Only highlight accepted comments
    const extra = wasHighlighted ? getHighlightStateData() : {};

    await approve(comment, appliedRule, false, extra);
    await comment.set('isAutoResolved', true).save();

    return {
      resolution: 'Accept',
      resolver: appliedRule,
    };
  } else if (replacedAction === 'reject') {
    // Reject a comment if all actions equal "reject" and "highlight" hasn't been set
    await reject(comment, appliedRule, false);
    await comment.set('isAutoResolved', true).save();

    return {
      resolution: 'Reject',
      resolver: appliedRule,
    };
  } else if (replacedAction === 'defer') {
    // Defer a comment
    await defer(comment, appliedRule, false);
    await comment.set('isAutoResolved', true).save();

    return {
      resolution: 'Defer',
      resolver: appliedRule,
    };
  } else {
    return null;
  }
}

/**
 * Fetch active rules and scores for the passed in comment and see if any automated rules can be applied to it
 *
 * @param {object} comment Comment model instance to process rules on
 */
export async function processRulesForComment(comment: ICommentInstance): Promise<IDecision | null> {
  const article = await comment.getArticle();

  if (article && article.get('disableRules')) {
    return null;
  }

  // Otherwise, fetch all scores and play ball
  const commentSummaryScores = await CommentSummaryScore.findAll({
    where: {
      commentId: comment.id,
    },
    include: [Tag],
  });

  if (!commentSummaryScores.length) {
    // If no scores are found, resolve with the comment
    return null;
  } else {
    // Otherwise, process the rules and act on the comment as configured
    return resolveComment(comment, commentSummaryScores);
  }
}
