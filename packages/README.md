# The Osmod Packages

There are several parts to Osmod:

* `cli`: Local command line tooling for development, e.g. creating users.
  * Uses `moderator-backend-core`
* `backend-api`: the codebase of the API server for Osmod.
  * Uses: `moderator-backend-core`, `config`, `frontend-web`, `jsonapi`
* `config`: common project configure files.
* `jsonapi`: common libraries for working with the API.
* `frontend-web`: the web frontend for Osmod.
