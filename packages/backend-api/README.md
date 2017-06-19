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

## Development Server

Assuming you have Docker and Docker Compose installed, you should be able to `cd` into this directory and run:

```bash
docker-compose up
```

This will build or download Docker images and get them up and running locally. The API server should be accessible at [http://localhost:3000](http://localhost:3000). You can also daemonize the process so that you don't have to keep a tab open with the `-d` flag:

```bash
docker-compose -d up
```

To stop it:

```bash
docker-compose down
```

### Docker Development Commands

Inside the Docker container, `npm run watch` will watch for Typescript changes, recompile them and those will trigger a node restart via Nodemon. Inside Docker, this will run on `http://localhost:8080`, but it is proxied to `http://localhost:3000` by `docker-compose`.

### Building the Docker Image

Since the server is running using Typescript and we don't want the production version running with Typescript, it needs to be compiled before build. A simple script has been put in `bin/` to do so, which will compile the Typescript to a `build/` directory, then build the Docker container:

```bash
bin/build
```

## Testing

We use Mocha.js and Chai for testing. Tests will be run automatically on the continuous integration server automatically before deployment, so make sure you run tests locally before pushing anything.

To run the tests locally, simple run the following from the `server` directory on your VM:

```
npm test
```

### Testing Via Docker

You can run tests via Docker so that you don't need to provision your own database:

```bash
npm run test-docker
```

## Linting

The easiest way to lint your work is to run the linting script! From `server` directory on your VM:

```
npm run lint
```

This will fire off all the linters and fail if any code doesn't pass muster. Note that we run the linter script during the build, so if you're code doesn't pass linting the build *will* fail. Loudly.


### TSLint

We use [TSLint](https://palantir.github.io/tslint/) for linting backend Typescript.

## Troubleshooting

### Docker Compose error: `no space left on device`

The virtual machine is running out of memory. To fix this, you can manually provision a machine using Docker Machine and tell it to use more memory:

```bash

# Provision the virtual machine, change 2048 to something larger (n * 1024) if you still have issues

docker-machine create --driver virtualbox --virtualbox-memory 2048 some-machine-name

# Set environment variables to use it

eval "$(docker-machine env some-machine-name)"

# Run Docker Compose again

docker-compose up

```
