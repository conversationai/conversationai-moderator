# OSMOD REST API

The OSMOD REST API provides a simple, traditional REST API for CRUD operations on all the models described in the [Data Model Document](https://github.com/Jigsaw-Code/moderator/blob/dev/server/docs/modeling.md). This API allows low-level access to the database for authenticated clients.

In practice, this will be used by the OSMOD Frontend to interact with the data (unless custom endpoints are needed in some scenarios for performance).

Quick Links:

* [Staging Server](#staging-server)
* [Available Models](#available-models)
* [Authentication](#authentication)
* [JSON API Schema](#json-api-schema)
* [Reading Data (GET Requests)](#reading-data-get-requests)
* [Creating Data (POST Requests)](#creating-data-post-requests)
* [Updating Data (PATCH Requests)](#updating-data-patch-requests)
* [Deleting Data (DELETE Requests)](#deleting-data-delete-requests)

## Available Models

The following models are available on staging:

* articles
* categories
* comments
* comment_scores
* comment_scorers
* moderation_rules
* preselects
* tagging_sensitivities
* moderator_assignments
* tags
* users

## Authentication

The API expects a token present in the HTTP `Authorization` header, or as the `token` query string value, on all API requests.

This token will be manually provisioned for all API clients, except the web frontend, which will generate them based on the current user's OAUTH session.

The token itself, is a [JSON Web Token](https://jwt.io/introduction/), but the parsing or validation of those tokens or decrypting their information is not the responsibility of the API clients.

## JSON API Schema

Our API is built around the [JSON API](http://jsonapi.org/) schema. This provides a consistent standard for JSON structure, filtering, sorting and interaction with model relationships.

This section will describe the format so you don't have to dig through the above documentation site.

### Top-level Document Structure

All responses have the following format:

```javscript
{
  "jsonapi": {
    "version": "1.0"
  },

  // the contents of your request (array or object)
  "data": { ... },

  // side-loaded related models
  "included": [ ... ],

  "meta": {

     // paging information on list responses
    "page": { ... }

  }
}
```

What this basically means is, remember to look at the `.data` property of the request if you're confused about where the data you requested is.

### Item Structure

Single items are represented with the following structure:

```javscript
{
  // The model id
  "id": 5,

  // The type of the model, maps to the prefix in the URL.
  "type": "comments",

  // All database values.
  "attributes": {
    "key": "value"
  },

  // Linked model data,
  "relationships": {

    // The name of the relationship. Something like `article` or `author`
    "relationshipA": {

      "links": {

        // The URL you can POST to to add items, or PUT to to replace.
        "self": "/comments/1/relationships/article",

      },

      // The relationships data. Only `type` and `id` are returned by default.
      "data": { "type": "article", "id": "5" },
    }

  }
}
```

## Reading Data (GET Requests)

### List Responses

There are two endpoints which simply list data. These are:

* /api/rest/:model
* /api/rest/:model/relationships/:relationship

On List Responses, the `data` key of the response will be an array and the default result is the first page of data.

#### Paging

The `meta.page` property will provide the following:

```javscript
{
  "meta": {

    "page": {

      // The starting index of the page of data
      "offset": 0,

      // The max number of items per-page
      "limit": 5,

      // The total result length
      "total": 7652,

      "links": {
        "first": "...",
        "last": "...",
        "next": "...",
        "prev": "...",
    }

  }
}
```

Paging can be configured with the `page` query string parameter, which takes two key: `offset` and `limit`. Getting the second page of data would look like:

`/api/rest/:model?page[offset]=5`

Or, you can change the default page size with `limit`:

`/api/rest/:model?page[offset]=50&page[limit]=50`

However, the easiest way to move through pages is to use the `meta.page.links` properties. Simply request `meta.page.links.next` until that value is `null` to move through the set.

#### Sorting

Lists of results can be sorted using the `sort` query string parameter. This parameter takes a comma-separated list of columns to sort by in ascending order. To sort descending, prepend a minus sign (`-`) to the column name. For example:

`/api/rest/comments?sort=state,-publishedAt`

#### Filtering

Lists can be filtered with the `filter` query string parameter. Currently, filtering is only based on equality, but ranges (for dates) may be added if necessary.

`/api/rest/comments?filter[state]=approved`

### Item Detail Responses

If you have the `id` of a specific record, it can be loaded by `GET`ting the following url:

`/api/rest/:model/:id`

When requesting a single result, the `data` field will be a single object of the above format.

### Including Relationships

As mentioned above, relationships only include the `type` and `id` of the record, not the full record to avoid large payloads. There are two ways to load the full data of the records:

#### `include` the model in the List or Item response

Appending the `include` query string will fetch all the associated data for the the requested types and put those in the `included` array at the top-level of the document. For example:

`/api/rest/articles/1?include=comments`

However, this request is very likely to be too large to use efficiently.

#### The Relationships list route

Alternatively, you can get a list page of the relationships with all the features of a normal list available: `filter`, `sort`, and `page`.

`/api/rest/articles/1/comments`

## Creating Data (POST Requests)

`POST`ing to a model list will create a record and return a result that looks just as if you'd done a `GET` to the requested model. The `201` status code will be returned on success.

`/api/rest/articles`

When creating or updating a record, you must use the following format:

```javscript
{
  data: {
    // The type of the model, maps to the prefix in the URL.
    "type": "comments",

    // All database values.
    "attributes": {
      "key": "value"
    },

    // Linked model data,
    "relationships": {

      // The name of the relationship. Something like `article` or `author`
      "relationshipA": {

        // The relationships data.
        "data": { "type": "article", "id": "5" },
      }

    }
  }
}
```

Basically, exactly like a `GET` to the item detail, but without the `id` which will be generated by the server (and returned on successful create). **Do not forget the `type` value.**

### Creating Relationships

Using a `POST` you can add a single relationship to a `hasMany` relationship. `hasOne` will be accomplished via `PUT` below.

Use the `links.self` value of the relationship to add one, or more, relations. If you don't have the record to get the links, simply POST to:

`/api/rest/:model/relationships/:relationship`

Like creating a record, the form is:

```javscript
{
  data: [
    { id: '1', type: 'comments' },
    { id: '1', type: 'comments' }
  ]
}
```

Even if only adding 1 item, the `data` value **MUST** be an array.

Creating a relationship successfully with return a status code of `204` and no other data.

## Updating Data (PATCH Requests)

`PATCH`ing to an item detail will update the record and return a result that looks just as if you'd done a `GET` to the requested model. The `200` status code will be returned on success.

`/api/rest/articles/1`

When updating a record, you must include `sourceId` and `type`, but only include the columns you want to change:

```javscript
{
  data: {
    // The source id of the model
    "id": 1,

    // The type of the model, maps to the prefix in the URL.
    "type": "comments",

    "attributes": {
      // All database values.
      "key": "value"
    },

    // Linked model data,
    "relationships": {

      "article": {

        // The relationships data.
        "data": { "type": "article", "id": "5" },
      }
    }
  }
}
```

### Updating Relationships

Updating a relationship will replace its value on the model. You can update both `hasOne` and `hasMany` relationships in the `PATCH` to the item detail.

The format is exactly as above, just include the `relationships` you want to update.

You can also `PATCH` to the relationships endpoint to update `hasMany` relationships.

`/api/rest/:model/relationships/:relationship`

Unlike relationship creation, updating will replace the current data with the list given:

```javscript
{
  data: [
    { id: '1', type: 'comments' },
    { id: '1', type: 'comments' }
  ]
}
```

The `204` status code will be returned on success.

## Deleting Data (DELETE Requests)

`DELETE`ing to an item detail will delete the record. The `204` status code will be returned on success.

`/api/rest/articles/1`

No post body is required when deleting a record.

### Deleting Relationships

`hasOne` relationships are "deleted" by `PATCH`ing their value to `null` above.

You can `DELETE` to the relationships endpoint to update `hasMany` relationships.

`/api/rest/:model/relationships/:relationship`

Like relationship creation, the list of relationships are subtracted from the current list. You can delete multiple relationships in a single request.

```javscript
{
  data: [
    { id: '1', type: 'comments' },
    { id: '1', type: 'comments' }
  ]
}
```

The `204` status code will be returned on success.
