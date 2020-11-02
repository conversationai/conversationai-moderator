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
import { CommentScore } from './comment_score';
import { CommentSize } from './comment_size';
import { CommentSummaryScore } from './comment_summary_score';
import { Decision } from './decision';
import { ModerationRule } from './moderation_rule';
import { ModeratorAssignment } from './moderator_assignment';
import { Tag } from './tag';
import { User } from './user';
import { UserCategoryAssignment } from './user_category_assignment';

Article.hasMany(Comment);
Article.belongsToMany(User, {
  through: {
    model: ModeratorAssignment,
    unique: false,
  },
  foreignKey: 'articleId',
  as: 'assignedModerators',
});

Category.hasMany(Article, {
  // These work around a weird sequelize bug which adds a unique constraint
  // only on article for seemingly no reason.
  constraints: false,
  foreignKeyConstraint: false,
});
Category.belongsToMany(User, {
  through: {
    model: UserCategoryAssignment,
    unique: false,
  },
  foreignKey: 'categoryId',
  as: 'assignedModerators',
});

Comment.hasMany(CommentFlag, { as: 'commentFlags' });
Comment.hasMany(CommentScore, { as: 'commentScores' });
Comment.hasMany(CommentSummaryScore, { as: 'commentSummaryScores' });
Comment.hasMany(Decision, { as: 'decisions' });
Comment.hasMany(CommentSize, { as: 'commentSizes' });

Tag.hasMany(ModerationRule, { as: 'moderationRules' });
Tag.hasMany(CommentScore, { as: 'commentScores' });

User.belongsToMany(Article, {
  through: {
    model: ModeratorAssignment,
    unique: false,
  },
  foreignKey: 'userId',
  as: 'assignedArticles',
});
User.belongsToMany(Category, {
  through: {
    model: UserCategoryAssignment,
    unique: false,
  },
  foreignKey: 'userId',
  as: 'assignedCategories',
});

export * from './article';
export * from './category';
export * from './comment';
export * from './comment_score';
export * from './comment_summary_score';
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
