# Moderator Backend
The Moderator Backend is a Node.js/Express-backed service that provides several APIs for both the front end as well as interactions with external services.

## Table of Contents
* [Installation](#installation)
* [Scripts](#scripts)
* [Worker/Task Queue](docs/worker.md)
* [Modeling](docs/modeling.md)
* [Auth](docs/auth.md)
* [OS Mod](docs/osmod_rest_api.md)
* [Troubleshooting](troubleshooting)

# Installation
Adding docs on auth, adding table of contents to README
This section will get the project running with all of its setup and dependencies.

## Requirements

* OS X
* [Docker Engine 1.12+](https://docs.docker.com/engine/installation/)
* [Docker Compose 1.8+](https://docs.docker.com/compose/install/) (this gets installed with "Docker for Mac", but you can also install it piece-meal)

## Deployment

See [docs/deployment.md](docs/deployment.md).

## Testing

We use Mocha.js and Chai for testing. Tests will be run automatically on the continuous integration server automatically before deployment, so make sure you run tests locally before pushing anything.

To run the tests locally, simple run the following from the `server` directory on your VM:

```
npm test
```

## Linting

The easiest way to lint your work is to run the linting script! From `server` directory on your VM:

```
npm run lint
```

This will fire off all the linters and fail if any code doesn't pass muster. Note that we run the linter script during the build, so if you're code doesn't pass linting the build *will* fail. Loudly.


### TSLint

We use [TSLint](https://palantir.github.io/tslint/) for linting backend Typescript.

## Running the server in HTTPS mode

Create a test certificate via the following command

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

copy the resulting files to the directory `packages/backend-api/sslcert`.
