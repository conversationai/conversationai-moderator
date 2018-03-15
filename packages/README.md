# The Osmod Packages

There are several parts to Osmod:

* `cli`: Local command line tooling for development, e.g. creating users.
  * Uses `moderator-backend-core`
* `backend-api`: the codebase of the API server for Osmod.
  * Uses: `moderator-backend-core`, `backend-queue`, `config`, `frontend-web`, `jsonapi`
* `backend-queue`: the work-queue management code.
  * Uses `moderator-backend-core`, `config`
* `config`: common project configure files.
* `jsonapi`: common libraries for working with the API.
* `frontend-web`: the web frontend for Osmod.
  * Uses `moderator-backend-core`
