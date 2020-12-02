# OSMOD Services API

The OSMOD Services API allows publishing and tagging operations to comments.

This documentation covers the services:

Comment Actions

> * /api/services/commentActions/approve
> * /api/services/commentActions/reject
> * /api/services/commentActions/defer
> * /api/services/commentActions/highlight
> * /api/services/commentActions/tag/:tagid
> * /api/services/commentActions/tagCommentSummaryScores/:tagid

Comment Score Actions

> * /api/services/commentActions/:commentid/scores
> * /api/services/commentActions/:commentid/scores/:commentscoreid/reset
> * /api/services/commentActions/:commentid/scores/:commentscoreid/confirm
> * /api/services/commentActions/:commentid/scores/:commentscoreid/reject
> * /api/services/commentActions/:commentid/scores/:commentscoreid

## Comment Actions
Comment Actions allow control over a comment to approve, reject, highlight, defer, and tag.

### approve
Approve all comment id(s)

A `POST` to `/api/services/commentActions/approve` with a body containing the ID(s) of the comment(s) to trigger the action upon.

Body Example using single commentId:

```javascript
{
  "data" : [
    { commentId: '12', userId: '1' }
  ]
}
```

Or, for a bulk command using multiple commentId

```javascript
{
  "data" : [
    { commentId: '12', userId: '1' },
    { commentId: '13', userId: '1' },
    { commentId: '17', userId: '1' }
  ]
}
```

### reject
Reject all comment id(s)

A `POST` to `/api/services/commentActions/reject` with a body containing the ID(s) of the comment(s) to trigger the action upon.

Body Example using single commentId:

```javascript
{
  "data" : [
    { commentId: '12', userId: '1' }
  ]
}
```

Or, for a bulk command using multiple commentId

```javascript
{
  "data" : [
    { commentId: '12', userId: '1' },
    { commentId: '13', userId: '1' },
    { commentId: '17', userId: '1' }
  ]
}
```


### defer
Defer all comment id(s)

A `POST` to `/api/services/commentActions/defer` with a body containing the ID(s) of the comment(s) to trigger the action upon.

Body Example using single commentId:

```javascript
{
  "data" : [
    { commentId: '12', userId: '1' }
  ]
}
```

Or, for a bulk command using multiple commentId

```javascript
{
  "data" : [
    { commentId: '12', userId: '1' },
    { commentId: '13', userId: '1' },
    { commentId: '17', userId: '1' }
  ]
}
```


### highlight
Highlight all comment id(s)

A `POST` to `/api/services/commentActions/highlight` with a body containing the ID(s) of the comment(s) to trigger the action upon.

Body Example using single commentId:

```javascript
{
  "data" : [
    { commentId: '12', userId: '1' }
  ]
}
```

Or, for a bulk command using multiple commentId

```javascript
{
  "data" : [
    { commentId: '12', userId: '1' },
    { commentId: '13', userId: '1' },
    { commentId: '17', userId: '1' }
  ]
}
```

### tag
Tag all comment id(s) with the tag ID provided.

A `POST` to `/api/services/commentActions/tag/:tagid` with a body containing the ID(s) of the comment(s) to trigger the action upon.

Body Example using single commentId:

```javascript
{
  "data" : [
    12
  ]
}
```

Or, for a bulk command using multiple commentId

```javascript
{
  "data" : [
    12,13,17
  ]
}
```

### tagCommentSummaryScores
Tag all comment id(s) comment summary score with the tag ID provided.

A `POST` to `/api/services/commentActions/tagCommentSummaryScores/:tagid` with a body containing the ID(s) of the comment(s) to trigger the action upon.

Body Example using single commentId:

```javascript
{
  "data" : [
    12
  ]
}
```

Or, for a bulk command using multiple commentId

```javascript
{
  "data" : [
    12,13,17
  ]
}
```

## Comment Score Actions
Comment Score Actions allow control over the internal content of a comment. This allows specific words or phrases to be tagged and controlled. The comment detail actions allow control over tag adding, removal, rejecting and confirming.

### add
Add a tag to a set of content within a single comment.

A `POST` to `/api/services/commentActions/:commentid/scores` with a body containing the object:

```javascript
{
  "data" : {
  	 // The tag id of the tag to be added to this selection
    "tagId": "1",
    // The start position of the character in the string of the comment text.
	  "annotationStart": 130,
	 // The end position of the character in the string of the comment text.
	  "annotationEnd": 145
  }
}
```

### remove
Remove a tag from the comment.

A `DELETE` to `/api/services/commentActions/:commentid/scores/:commentscoreid`

### confirm
Confirming a tag that a previous user (or machine) has added to a particular set of content within the comment.

A `POST` to `/api/services/commentActions/:commentid/scores/:commentscoreid/confirm` with no body

### reject
Rejecting a tag that a previous user (or machine) has added to a particular set of content within the comment.

A `POST` to `/api/services/commentActions/:commentid/scores/:commentscoreid/reject` with no body
