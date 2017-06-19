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

import { ArticleSerializer } from './ArticleSerializer';
import { CategorySerializer } from './CategorySerializer';
import { CommentScoreSerializer } from './CommentScoreSerializer';
import { CommentSerializer } from './CommentSerializer';
import { CommentSummaryScoreSerializer } from './CommentSummaryScoreSerializer';
import { DecisionSerializer } from './DecisionSerializer';
import { ModerationRuleSerializer } from './ModerationRuleSerializer';
import { ModeratorAssignmentSerializer } from './ModeratorAssignmentSerializer';
import { PreselectSerializer } from './PreselectSerializer';
import { TaggingSensitivitySerializer } from './TaggingSensitivitySerializer';
import { TagSerializer } from './TagSerializer';
import { UserCategoryAssignmentSerializer } from './UserCategoryAssignmentSerializer';
import { UserSerializer } from './UserSerializer';

export {
  ArticleSerializer,
  CategorySerializer,
  CommentSerializer,
  CommentScoreSerializer,
  CommentSummaryScoreSerializer,
  DecisionSerializer,
  ModerationRuleSerializer,
  ModeratorAssignmentSerializer,
  PreselectSerializer,
  TagSerializer,
  TaggingSensitivitySerializer,
  UserSerializer,
  UserCategoryAssignmentSerializer,
};

export const byType: {
  [key: string]: any;
} = {
  articles: ArticleSerializer,
  categories: CategorySerializer,
  comments: CommentSerializer,
  comment_scores: CommentScoreSerializer,
  comment_summary_scores: CommentSummaryScoreSerializer,
  decisions: DecisionSerializer,
  moderation_rules: ModerationRuleSerializer,
  moderator_assignments: ModeratorAssignmentSerializer,
  preselects: PreselectSerializer,
  tags: TagSerializer,
  tagging_sensitivities: TaggingSensitivitySerializer,
  users: UserSerializer,
  user_category_assignments: UserCategoryAssignmentSerializer,
};
