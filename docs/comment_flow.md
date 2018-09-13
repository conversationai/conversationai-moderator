# OSMOD Comment State Flow

This document describes the path of a comment through the OSMOD system.

1. A publisher submits a new article to OSMOD using the `/api/publisher/PUBLISHER_NAME/article` [endpoint](osmod_publisher_api.md).

2. A publisher submits a new comment to OSMOD using the `/api/publisher/PUBLISHER_NAME/comment` [endpoint](osmod_publisher_api.md).

3. The comment is immediately created in the database, then a task is created to send the comment out to assistants for processing.

4. The task queue creates a `CommentScoreRequest` and submits [the request](osmod_assistant_protocol.md) to all users in the `service` group that have a configured `endpoint` path.

5. Each assistant `POST`s back to the `callback` URL they were given, which contains the specific `CommentScoreRequest` id from the original request.

6. Once all assistants have either called back, or timed out, a task is created to run automated `ModerationRule`s.

7. The rule task is handled by running all `ModerationRule`s against a single comment. If the rule results in a resolution (approve or reject), a task is created to notify the publisher and the comment lifecyle is complete.

8. If a rule did not resolve a comment, it is made available to the OSMOD frontend.

9. The OSMOD frontend can approve or reject comments either singularly or in bulk. Taking these actions will created a task to notify the publisher and the comment lifecyle is complete.

10. Party 🎉🎉🎉
