# OSMOD Publisher API

The Publisher API provides an interface to the publishing platform to send comments into OSMOD. The API prefix is:

`/api/publisher`

The `POST`ed bodies will be validated against the schema's below. If they fail to pass, the HTTP status code will be `422` and an error object will be returned detailing where the `POST` did not match the schema:

```javascript
{ status: 'error', errors: [ /* errors */ ] }
```

## Add an Article

Before adding any comments, the publisher should create an article. This endpoint takes either an array of or a single instance of article object, allowing both single item creation and batch importing.

A `POST` to `/api/publisher/articles` should be sent in the following format:

```javascript
{
  "data": [
    {
      // String representing the foreign ID of the article in the
      // publishing system.
      "sourceId": "2",

      // Number representing the category inside OSMOD, see below for reading
      // and writing this list.
      "categoryId": "3",

      // Title of the article.
      "title": "Substantial Pastries for Busy Teenagers",

      // Date of the article creation ( ISO 8601 format )
      "createdAt":"2012-10-29T21:54:07.609Z",

      // Cleaned body content (no non-UTF-8 characters).
      "text": "<p>This is like a toned-down pecan pie in bar form.</p><p>Step 1</p><p>Butter or oil a 9-by-13-by-2-inch pan and line with parchment. Butter the parchment. Sift together the flours and salt. Place the mixture in the bowl of a food processor fitted with the steel blade and add the sugar. Pulse to blend together. Add the butter and pulse until the mixture is crumbly. With the machine running, add the vanilla extract and ice water and process until the dough comes together on the blades. Stop the machine and, using your hands, press into an even layer in the prepared pan. Pierce with a fork all over and chill for 30 minutes. Meanwhile, preheat the oven to 350 degrees Fahrenheit.</p><p>Step 2</p><p>Bake the cookie base for 20 minutes, until it is just beginning to color. Allow to cool for 5 minutes before adding the top layer.</p><p>Step 3</p><p>Cream the butter with the honey, salt and nutmeg in a mixer fitted with the paddle attachment or in a food processor fitted with the steel blade. Beat in the eggs and vanilla. The mixture will look broken, which is fine.</p><p>Step 4</p><p>Distribute the chocolate and then the pecans evenly over the cookie layer. Scrape in the butter and egg mixture and spread in an even layer. Place in the oven and bake 20 to 25 minutes, until set. Remove from the heat and allow to cool completely before cutting.</p>",

      // Live URL of article to give moderators more context.
      "url": "https://publisher.com/example",

      // Additional context to pass through to ML assistants.
      "extra": {
        "...keys...": "...values..."
      },
    }
  ]
}
```

The return object for creating an Article will contain an object of the newly created rows articleId. This ID must be used when supplying a new comment in order to keep relational data true.

```javascript
{
  "status": "success",

  // Object containing the resulting row creation information
  "createdData": [

    // Array containing a creation row and the sourceId provided for the article
    0:  {
      "sourceId": "2"
      "articleId": "558"
    }

  ]

}
```

The return object for creating an Article will contain an object of the newly created rows articleId. This ID must be used when supplying a new comment in order to keep relational data true.

```javascript
{
  "status": "success",

  // Object containing the resulting row creation information
  "createdData": [

    // Array containing a creation row and the sourceId provided for the article
    0:  {
      "sourceId": "2"
      "articleId": "558"
    }

  ]

}
```

## Update an Article

This endpoint takes a sourceId of a comment and updates only the columns you want to change.

A `PATCH` to `/api/publisher/articles/:sourceId` should be sent in the following format:

```javascript
{
  "data" : {

    // Items to update
    "attributes" : {

      // Optional
      "categoryId": "1",

      // Optional
      "title": "Test Title",

      // Optional
      "text": "Test Text",

      // Optional
      "url": "http://test.com"

      // Optional
      "extra": {
        "...keys...": "...values..."
      },

    }
  }
}
```

## Add a Comment

This endpoint takes either an array of or a single instance of comment object, allowing both single item creation and batch importing.

A `POST` to `/api/publisher/comments` should be sent in the following format:

```javascript
{
  "data": [
    {
      // String representing the foreign ID of the article in the
      // publishing system.
      "articleId": "1",

      // String representing the foreign ID of the comment in the
      // publishing system.
      "sourceId": "2",

      // String representing the foreign ID of the comment's parent
      // comment in the publishing system (or null).
      "replyToSourceId": "3",

      // String representing the foreign ID of the comment's author
      // in the publishing system.
      "authorSourceId": "4",

      // Cleaned body content (no html or non-UTF-8 characters).
      "text": "Hello World",

      "author": {
        "email": "person@email.com",
        "location": "Texas",
        "name": "Mr. Full Name",

        // Optional
        "avatar": "https://example.com/avatar.png",

        // Additional context to pass through to ML assistants.
        "...keys...": "...values..."
      },

      // ISO 8601 Timestamp of comment creation in publishing system.
      "createdAt":"2012-10-29T21:54:07.609Z",

      // Additional context to pass through to ML assistants.
      "extra": {
        "...keys...": "...values..."
      },
    }
  ]
}
```

## Add a Tag

This endpoint takes either an array of, or a single instance of tag object, allowing both single item creation and batch importing.

A `POST` to `/api/publisher/comments/tags` should be sent in the following format:

```javascript
{
  "data": [
    {
      // The type of the flag. Either: recommendation or flag.
      "type": "recommendation",

      // String representing the foreign ID of the comment in the
      // publishing system.
      "sourceCommentId": "1",

      // String representing the foreign ID of the recommendation in
      // the publishing system.
      "sourceUserId": "2"
    }
  ]
}
```

## Revoke a Tag

This endpoint takes either an array of or a single instance of tag object, allowing both single item deleting and batch deletion.

A `POST` to `/api/publisher/comments/tags/revoke` should be sent in the following format:

```javascript
{
  "data": [
    {
      // The type of the flag. Either: recommendation or flag.
      "type": "recommendation",

      // String representing the foreign ID of the comment in the
      // publishing system.
      "sourceCommentId": "1",

      // String representing the foreign ID of the recommendation in
      // the publishing system.
      "sourceUserId": "2",
    }
  ]
}
```

## Add a Category

Categories are a generic concept that is not publisher-specific. These should be accessed with the [REST API](osmod_rest_api.md). Use the `categories` model.

* A `GET` request to `/api/rest/categories` will list the known categories in the system.
* A `POST` request to `/api/rest/categories` will add a new category.
* A `GET` request to `/api/rest/categories/:id` will show a single category.
* An `PATCH` request to `/api/rest/categories/:id` will update a single category.
* A `DELETE` request to `/api/rest/categories/:id` will delete a single category.

**Please create a new category before importing an article related to it.**

Use the list request to build a lookup table for relating internal publisher categories names and IDs to OSMOD IDs. The `extra` field can be used to store information which simplifies this lookup.

## List Pending Decisions

This endpoint gets the latest OSMod `Decision`s which have not been confirmed by the publisher.

A `GET` to `/api/publisher/decisions` will return a list of `Decision` models.

## Confirm Decision

This endpoint takes either an array of `Decision` ids and marks them as confirmed in OSMod.

A `POST` to `/api/publisher/decisions/confirm` should be sent in the following format:

```javascript
{
  "data": [
    1,
    2  // Database id of the decisions.
  ]
}
```

## Comment Actions
Comment Actions allow control over a comment to approve, reject, highlight, defer, and tag.

### approve
Approve all comment id(s)

A `POST` to `/api/publisher/commentActions/approve` with a body containing the ID(s) of the comment(s) to trigger the action upon.

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

A `POST` to `/api/publisher/commentActions/reject` with a body containing the ID(s) of the comment(s) to trigger the action upon.

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

A `POST` to `/api/publisher/commentActions/defer` with a body containing the ID(s) of the comment(s) to trigger the action upon.

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

### highlight
Highlight all comment id(s)

A `POST` to `/api/publisher/commentActions/highlight` with a body containing the ID(s) of the comment(s) to trigger the action upon.

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
