# OSMOD Assistant Protocol

This document describes the protocol for interacting with the "assistant", the
component that bridges between the OSMOD backend and the machine learning
models.

The OSMOD backend provides comments and articles to the assistant, which in
turn gives scores on each comment.

## Send a Comment for Scoring

To get scores for a comment, the OSMOD backend sends a `POST` to the assistant
endpoint `/api/score-comment` in the following format:

```javascript
{
  "comment": {
    "commentId": "123",

    // UTF-8 text of the comment.
    "plainText": "We are condemned to act out this sad, once unimaginable farce. Sad!",

    // Optional HTML content.
    "htmlText": "We are <b>condemned</b> to act out this sad, once unimaginable farce. Sad!",

    "links": {
      // OSMOD API endpoint for retrieving more data about the comment.
      "self": "https://osmod-backend/api/rest/comments/123",
    },
  },

  "article": {
    "articleId": "456",

    // UTF-8 text of the article.
    "plainText": "The beauty of me is that I'm very rich.",

    // Optional HTML content.
    "htmlText": "The <i>beauty</i> of me is that I'm very rich.",

    "links": {
      // OSMOD API endpoint for retrieving more data about the comment.
      "self": "https://osmod-backend/api/rest/articles/456",
    },
  },

  // Single comment that this comment is responding to. Often null.
  "inReplyToComment": {
    "commentId": "789",

    // UTF-8 text of the comment.
    "plainText": "We are condemned to act out this sad, once unimaginable farce. Sad!",

    // Optional HTML content.
    "htmlText": "We are <b>condemned</b> to act out this sad, once unimaginable farce. Sad!",

    "links": {
      // OSMOD API endpoint for retrieving more data about the comment.
      "self": "https://osmod-backend/api/rest/comments/789"
    },
  },

  // Whether to include summary scores for the comment. Optional: by default,
  // summary scores aren't included. See documentation of response object below.
  "includeSummaryScores": true,

  "links": {
    // Full URL of backend endpoint that the assistant should post scores to.
    // See next section.
    "callback": "https://osmod-backend/api/assistant/comment-scores/123"
  }
}
```

Once the assistant has scores for the comment, it will `POST` them to the
endpoint specified in `links.callback`. That endpoint is described next.

## Receive Comment Scores

The OSMOD backend will provide the endpoint
`/api/assistant/comment-scores/:id`.  The comment ID is embedded as the last
parameter in the URL, which is constructed and sent as the `links.callback`
field in the scoring request described above.

The POST data from the assistant is in the following format:

```javascript
{
  // A map from "attribute" to list of score objects. Each score object contains
  // a score value for a span of the original comment text. There may be
  // multiple score objects for each attribute that describe different text
  // spans.
  //
  // The possible attribute string values are:
  // ATTACK_ON_AUTHOR
  // ATTACK_ON_COMMENTER
  // ATTACK_ON_PUBLISHER
  // INCOHERENT
  // INFLAMMATORY
  // LIKELY_TO_REJECT
  // OBSCENE
  // OFF_TOPIC
  // SPAM
  // UNSUBSTANTIAL
  "scores": {
    "ATTACK_ON_COMMENTER": [
      {
        // Number between 0 and 1, inclusive. Greater values mean higher
        // confidence that the attribute applies to this span of text.
        "score": 0.2,
        // Integer describing the span of the original comment text that
        // the score applies to. The values are in UTF-16 codepoints. "end" is
        // exclusive.
        // Example: for the text "Hi - I have the best words!", the begin/end
        // pair of (0,2) describes the string "Hi", and the pair (5,26)
        // describes the string "I have the best words".
        "begin": 0,
        "end": 62,
      },
    ],
    "INFLAMMATORY": [
      {
        "score": 0.4,
        "begin": 0,
        "end": 62,
      },
      {
        "score": 0.7,
        "begin": 63,
        "end": 66,
      },
    ],
  },

  // A map from "attribute" to a single overall score for the entire comment.
  // The set of keys between `summaryScores` and `scores` should be the same
  // (that is, an attribute with per-span scores should also have a summary
  // score, and vice versa).
  //
  // `summaryScores` is returned if `includeSummaryScores` was true in the
  // request.
  "summaryScores": {
    "ATTACK_ON_COMMENTER": 0.2,
    "INFLAMMATORY": 0.45
  },

  // String describing problems encountered during scoring. The `scores` and
  // `error` fields should be mutually exclusive.
  "error": "Problem scoring text: connection to ML backend timed out.",
}
```

## Assistant connection details

The assistant can be reached at https://osmod-assistant.appspot.com/.

For testing/debugging, one can specify the `sync` field in the scoring request,
and the assistant will respond with the score result, as opposed to posting the
result to the `links.callback` endpoint.

Example:
```
$ curl -H 'Content-Type: application/json' --data '{"sync": true, "comment": {"plainText": "you big darn dummy!"} }' https://osmod-assistant.appspot.com/api/score-comment
{"scores":{"ATTACK_ON_COMMENTER":[{"score":0.66,"begin":0,"end":18}],"INFLAMMATORY":[{"score":0.792,"begin":0,"end":18}],"OBSCENITY":[{"score":0.2,"begin":8,"end":11}]}}
```
