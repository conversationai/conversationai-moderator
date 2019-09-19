# The Data Model for Osmod

## Connecting to remote SQL Google Cloud database

From [a cloud shell in your project](https://cloud.google.com/shell/docs/), you can run:

`gcloud beta sql connect <instance-name> --user=<username>`

To connect to your SQL instance. You'll need to create the username from the
[google cloud SQL config interface](https://pantheon.corp.google.com/sql/instances/osmod-development-branch/users).

## The SQL Data Model

[The SQL table construction file](https://github.com/conversationai/conversationai-moderator/blob/master/seed/initial-database.sql)

Default database name: `os_moderator`

The tables:

  Object               | Tables_in_os_moderator    | Description
-----------------------|---------------------------|-------------
-                      | SequelizeMeta             | List of migrations that have been applied
User                   | users                     | OSMod Administrators, moderators, and other user-like entities
Category               | categories                | Categories from the moderated system (e.g., corresponds to channels for Youtube)
Article                | articles                  | Articles from the moderated system (e.g., videos for YouTube)
Comment                | comments                  | Comments from the moderated system
CommentFlag            | comment_flag              |
CommentScoreRequest    | comment_score_requests    |
CommentScore           | comment_scores            |
CommentSize            | comment_sizes             |
CommentSummaryScore    | comment_summary_scores    |
CommentTopScore        | comment_top_scores        |
Decision               | decisions                 |
ModerationRule         | moderation_rules          |
Preselect              | preselects                |
TaggingSensitivity     | tagging_sensitivities     |
Tag                    | tags                      |
ModeratorAssignment    | moderator_assignments     | (Join table) Moderators assigned to moderate comments for the given article
UserCategoryAssignment | user_category_assignments | (Join table) Moderators assigned to moderate comments for the given category
CSRF                   | csrfs                     |
UserSocialAuth         | user_social_auths         |

### User

Users are users of Osmod. This is the moderation team, and people who admin the
Osmod system using the UI.

- id (int) (required)
- group (enum: general, admin, service, youtube) (required)
- email (string) (required for all but users in the "service" group)
- name (string) (required)
- isActive (tinyint) (required)
- avatarURL (string)
- extra (json)

*Indexes*:
- group
- isActive
- email (unique)

Service users serve 2 purposes:
- They are used to authenticate non-humans that want to access to the system.  Use the [get-token](../README.md#the-osmod-cli) CLI command to create a suitable JWT token for this purpose.
- They are used to store the configuration for a moderator endpoint.

For the latter, the required configuration is stored in the extra field in a JSON blob that looks like

```json
{
  serviceType: 'moderator',
  endpointType: 'perspective-proxy' || 'perspective-api',
  endpoint: <URL of endpoint>,
  extra: <Any extra configuration required by this endpoint.>
}
```


### UserSocialAuth

This table holds information about the passport authentication configuration for
users in the `Users` table. It is used to allow users to login with social
networks, e.g. using their google account.

- id (int) (required)
- userId (foreign key: User) (required)
- socialId (string) (required) (provider user id)
- provider (string) (required) (name of auth provider, e.g. "google")
- extra (json)

*Indexes*:
- userId + provider (unique) (don't let the same user use the same provider multiple times)
- socialId + provider (unique) (don't allow the same provider user to authenticate on multiple accounts)

### Category

Represents a higher level collection of articles.  Categories correspond to e.g., site sections, YouTube channels, or Reddit subreddits.

Moderation Rules are configured at the category level and apply to all articles in the category. Moderators can be assigned at this level.

- id (number) (required)
- sourceId (string) (optional) Original id from publisher
- ownerId (foreign key: User) (optional) Service user that created this article.
- label (string) (required)
- isActive (boolean) (required, default true) Whether this category is being actively managed.
- count (int) Number of comments in this category
- unprocessedCount (int) Denormalize SUM of articles' unprocessedCount
- unmoderatedCount (int) Denormalize SUM of articles' unmoderatedCount
- moderatedCount (int) Denormalize SUM of articles' moderatedCount
- highlightedCount (int) Denormalize SUM of articles' highlightedCount
- approvedCount (int) Denormalize SUM of articles' approvedCount
- rejectedCount (int) Denormalize SUM of articles' rejectedCount
- deferredCount (int) Denormalize SUM of articles' deferredCount
- flaggedCount (int) Denormalize SUM of articles' flaggedCount
- batchedCount (int) Denormalize SUM of articles' batchedCount
- extra (json)

### Article

This table holds the articles that can be commented on.

- id (bigint) (required)
- sourceId (string) (required)
- ownerId (foreign key: User) (optional) Service user that created this article.
- sourceCreatedAt (Created ISO 8601 timestamp from publisher)
- categoryId (foreign key: Category) (optional)
- title (string) (required)
- text (string) (required)
- url (string) (required)
- isAutoModerated (tinyint) (required) (Indicates whether the article is subject to automated moderation rules)
- isCommentingEnabled (boolean) (Indicates whether commenting is enabled.  This field should be automatically synchronised with the host platform to enable/disable commenting.
- count (int) Number of comments in this article
- unprocessedCount (int) (Denormalized count of unprocessed comments (isScored = false))
- unmoderatedCount (int) (Denormalized count of unmoderated comments (isScored = true AND isModerated = false))
- moderatedCount (int) (Denormalized count of moderated comments (isScored = true AND isModerated = true))
- highlightedCount (int) (Denormalize COUNT of comments with highlightedCount > 0)
- approvedCount (int) (Denormalize COUNT of comments with approvedCount > 0)
- rejectedCount (int) (Denormalize COUNT of comments with rejectedCount > 0)
- deferredCount (int) (Denormalize COUNT of comments with deferredCount > 0)
- flaggedCount (int) (Denormalize COUNT of comments with flaggedCount > 0)
- batchedCount (int) (Denormalize COUNT of comments with batchedCount > 0)
- createdAt (datetime)
- modifiedAt (datetime)
- lastModeratedAt (datetime) Time when a moderation action was last done.
- extra (json)

*Indexes*:
- sourceId (unique)
- categoryId

### ModeratorAssignment

This tables holds which users are assigned to which articles.

- id (int) (required)
- user (foreign key: User) (required)
- article (foreign key: Article) (required)

*Indexes*:
- user + article (unique)
- user

### Comment

This table holds the comments, and the state of the comments.

- id (bigint) (required)
- sourceId (string) (required) (Original id from publisher)
- ownerId (foreign key: User) (optional) Service user that uploaded this comment.
- replyToSourceId (string) (optional foreign key: self.sourceId)
- replyId (foreign key: Comment) (id of comment this is a reply to)
- authorSourceId (string) (required) (publisher id of author)
- article (foreign key: Article) (required)
- author (json) (required)
- text (long text) (required)
- isScored (tinyint) (required)
- isModerated (tinyint)
- isAccepted (tinyint)
- isDeferred (tinyint)
- isHighlighted (tinyint)
- isBatchResolved (tinyint)
- isAutoResolved (tinyint) (Indicates if the comment was auto-accepted/rejected based on a rule(s))
- createdAt (datetime) (required) (Created ISO 8601 timestamp from publisher)
- modifiedAt (datetime)
- sentForScoring (datetime)
- sentBackToPublisher (datetime)
- extra (json)

*Indexes*
- sourceId (unique)
- isAccepted
- isDeferred
- isHighlighted
- isBatchResolved
- isAutoResolved
- sentForScoring

### CommentSize
- commentId (int) (required)
- width (int) (required)
- height (int) (required)

*Indexes*:
- commentId, width

### UserCategoryAssignment
- userId (int) (required)
- categoryId (int) (required)

*Indexes*:
- userId
- categoryId

#### Notes
- Used for hasAndBelongsToMany for category assignments on users.

#### States
- unscored: sentForScoring == null
- scored: sentForScoring != null && isScored == 1 (set as such when all related `CommentScoreRequest`s `doneAt` fields are set)
- accepted: isAccepted == 1
- rejected: isAccepted == 0
- deferred: isAccepted == null && isDeferred == 1
- highlighted: isAccepted == 1 && isHighlighted == 1

### CommentScoreRequest
- id (bigint)
- comment (foreign key: Comment) (required)
- userId (foreign key: User) (required)
- sentAt (datetime) (required)
- doneAt (datetime)

### CommentScore
- id (bigint)
- commentId (foreign key: Comment)
- sourceType (enum: User, Moderator, Machine) (required)
- sourceId (string) (optional identifier so that scores can be retracted, like for publisher recommendations)
- commentScoreRequestId (foreign key: CommentScoreRequest) (set for "machine" sources)
- score (float) (required) (0 - 1) (these get set to 1 for non-machine sources)
- annotationStart (int)
- annotationEnd (int)
- confirmedUserId (int)
- isConfirmed (tinyint)
- extra (json)
- createdAt (datetime) (required)
- updatedAt (datetime)
- TagId (int) (foreign key: Tags)

*Indexes*:
- comment

### CommentTopScore
- commentId (foreign key: Comment)
- tagId (foreign key: Tag)
- commentScoreId (foreign key: CommentScore)

*Indexes*:
- commentId/tagId

### CommentSummaryScore
- commentId (foreign key: Comment)
- tagId (foreign key: Tag)
- score (float) (required)
- confirmedUserId (int)
- isConfirmed (bool)

*Indexes*:
- commentId/tagId

### CommentFlag

An attribute of the comment indicating the comment has been flagged for some reason on the target platform.
Currently, there is no means of setting this flag in OSMod, though we display counts of flagged comments.
TODO: Document how a flagged comment appears in the UI.

- id (bigint)
- commentId (foreign key: Comment)
- sourceId (string) (optional identifier so that scores can be retracted, like for publisher recommendations)
- extra (json)
- createdAt (datetime) (required)
- updatedAt (datetime)

*Indexes*:
- commentId

### Decision
- id(int) (required)
- commentId (foreign key: Comment) (require)
- userId (foreign key: User) (optional, if source === User)
- moderationRuleId (foreign key: ModerationRule) (optional, if source === Rule)
- status (enum: Accept, Reject, Defer) (required)
- source (enum: User, Rule) (required)
- sentBackToPublisher (datetime)

#### Notes

Represents a log of decisions made by OSMod.

### ModerationRule
- id (int) (required)
- tagId (foreign key: Tag) (required)
- categoryId (foreign key: Category)
- lowerThreshold (smallint) (required)
- upperThreshold (smallint) (required)
- action (enum: Approve, Reject, Defer, Highlight) (required)
- createdBy (foreign key: User)

*Indexes*:
- categoryId

### CommentReply
- commentId (int) (required)
- replyId (int) (required)

*Indexes*:
- commentId
- replyId

#### Notes
- Used for hasAndBelongsToMany for replies on a comment.

### Tag
- id (int) (required)
- key (string) (required) (raw key for tag, e.g. `ATTACK_ON_COMMENTER`)
- label (string) (required) (display name, e.g. `Attack of Commenter`)
- color (string) (required) (hex color, e.g. `#c0ff33`)
- description (string) (optional) (short description, e.g. `A verbale attack directed towards author`)
- isInBatchView (bool) (is the tag to be shown on the front-end)
- isTaggable (bool) (tags that would show up in reason to reject or moderateor selected tags, but not the tag selector for batch view)

*Indexes*:
- key (unique)

### Preselect
- id (int) (required)
- tagId (foreign key: Tag)
- categoryId (foreign key: Category)
- lowerThreshold (smallint) (required)
- upperThreshold (smallint) (required)
- createdBy (foreign key: User)

### TaggingSensitivity
- id (int) (required)
- tagId (foreign key: Tag)
- categoryId (foreign key: Category)
- lowerThreshold (smallint) (required)
- upperThreshold (smallint) (required)
- createdBy (foreign key: User)


## Mappings

### YouTube

For YouTube we use the following map:

* YouTube Channel -> OSMod Category
* YouTube Video -> OSMod Article
* YouTube Comment ->  OSMod Comment

YouTube allows comments on the channel as well as the Video.  To accommodate this, there is a special article that corresponds to the channel itself, labelled "Channel comments."

You can connect multiple YouTube accounts to a single OSMod instance.  Each connection has an associated user of type "youtube" that stores the necessary authentication credentials.
We set the ownerID field of each category/article/comment fetched from YouTube to point to the YouTube user that is responsible for this entity.
