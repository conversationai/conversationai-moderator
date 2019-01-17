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

import { Article } from './article';
import { Category } from './category';
import { Comment } from './comment';
import { CommentFlag } from './comment_flag';
import { CommentRecommendation } from './comment_recommendation';
import { CommentScore } from './comment_score';
import { CommentScoreRequest } from './comment_score_request';
import { CommentSize } from './comment_size';
import { CommentSummaryScore } from './comment_summary_score';
import { CommentTopScore } from './comment_top_score';
import { CSRF } from './csrf';
import { Decision } from './decision';
import { ModerationRule } from './moderation_rule';
import { ModeratorAssignment } from './moderator_assignment';
import { Preselect } from './preselect';
import { Tag } from './tag';
import { TaggingSensitivity } from './tagging_sensitivity';
import { User } from './user';
import { UserCategoryAssignment } from './user_category_assignment';
import { UserSocialAuth } from './user_social_auth';

export const byName: any = {
  Article,
  Category,
  Comment,
  CommentScore,
  CommentSummaryScore,
  CommentRecommendation,
  CommentFlag,
  CommentScoreRequest,
  CommentSize,
  CommentTopScore,
  CSRF,
  Decision,
  ModerationRule,
  ModeratorAssignment,
  Preselect,
  Tag,
  TaggingSensitivity,
  User,
  UserCategoryAssignment,
  UserSocialAuth,
};

// Models can define an "associate" class method, which gets called
// for each model that implements it, and provides a clean place
// to create associations with other models without circular
// dependencies
Object.keys(byName).forEach((modelName) => {
  if ('associate' in byName[modelName]) {
    byName[modelName].associate(byName);
  }
});

export const byType: any = {
  articles: Article,
  categories: Category,
  comments: Comment,
  comment_scores: CommentScore,
  comment_summary_scores: CommentSummaryScore,
  comment_recommendations: CommentRecommendation,
  comment_flags: CommentFlag,
  comment_score_requests: CommentScoreRequest,
  comment_sizes: CommentSize,
  comment_top_scores: CommentTopScore,
  csrfs: CSRF,
  decisions: Decision,
  moderation_rules: ModerationRule,
  moderator_assignments: ModeratorAssignment,
  preselects: Preselect,
  tags: Tag,
  tagging_sensitivities: TaggingSensitivity,
  users: User,
  user_category_assignments: UserCategoryAssignment,
  user_social_auths: UserSocialAuth,
};

export * from './article';
export * from './category';
export * from './comment';
export * from './comment_score';
export * from './comment_summary_score';
export * from './comment_recommendation';
export * from './comment_flag';
export * from './comment_score_request';
export * from './comment_size';
export * from './comment_top_score';
export * from './configuration';
export * from './constants';
export * from './csrf';
export * from './decision';
export * from './last_update';
export * from './moderation_rule';
export * from './moderator_assignment';
export * from './preselect';
export * from './tag';
export * from './tagging_sensitivity';
export * from './user';
export * from './user_category_assignment';
export * from './user_social_auth';
