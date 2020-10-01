# OSMOD Comment State Flow

This document describes the path of a comment through the OSMOD system.

1. The integration module (e.g., the YouTube module) pulls categories, articles and comments from the target system.

2. For each comment, we create a task to send the comment out to assistants for processing.

3. The task queue creates a `CommentScoreRequest` and submits [the request](osmod_assistant_protocol.md) to all users in the `service` group that have a configured `endpoint` path.

4. Each assistant `POST`s back to the `callback` URL they were given, which contains the specific `CommentScoreRequest` id from the original request.

5. Once all assistants have either called back, or timed out, a task is created to run automated `ModerationRule`s.

6. The rule task is handled by running all `ModerationRule`s against a single comment. If the rule results in a resolution (approve or reject), the comment is considered resolved.

7. If a rule did not resolve a comment, it is made available to the OSMOD frontend.

8. The OSMOD frontend can approve or reject comments either singularly or in bulk.  The OSMOD frontend can also update the disposition of previously resolved comments.

9. For each resolved comment, the integration module updates the target system to implement the comment's final disposition.

10. Party 🎉🎉🎉
