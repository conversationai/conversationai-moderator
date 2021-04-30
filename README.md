OSMod - The ConversationAI Moderator App
========================================

Deploying an OSMod instance
---------------------------

### Configuration

The configuration is found in packages/config/index.js.  It is pretty self explanatory.
All settings can be overridden via environment variables.

Of particular note, the following have no sensible defaults, and
must be set in the environment before anything will work.

* `DATABASE_NAME`: The MySQL database name, e.g., 'os_moderator'.
* `DATABASE_USER`: The MySQL database user, e.g., 'os_moderator'.
* `DATABASE_PASSWORD`: The MySQL database password.

In a production setting, you'll also have to set the following:

* `MODERATOR_URL`: URL (including protocol, host and port) that OSMOD will listen on.

### System setup:

Install mysql, node (v10 or better), npm (v6 or better) and redis.  Instructions for Ubuntu:

```bash
sudo apt install mysql-server nodejs npm redis
sudo apt install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
sudo npm install -g npm n
sudo n v10
hash -r
```

#### System setup -- Docker

If you want to run your moderator instances in one of the preconfigured docker containers,
you'll need to install docker.  E.g., to install on Ubuntu 18.04 using apt

```bash
sudo apt install docker.io

# Add docker group to your account so you can talk to the local docker server.
# You probably need to log out and back in for groups to take effect.
sudo usermod -a -G docker `whoami`

sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# check things work
docker version
docker-compose --version.
```

### Install dependencies and run the server

Install all node dependencies and run initial typescript compile.

```bash
./bin/install
```

Setup local MySQL:

```bash
sudo mysql << EOF
CREATE DATABASE $DATABASE_NAME;
CREATE USER IF NOT EXISTS '$DATABASE_USER' IDENTIFIED BY '$DATABASE_PASSWORD';
GRANT ALL on $DATABASE_NAME.* to $DATABASE_USER;
EOF

sudo mysql $DATABASE_NAME < seed/initial-database.sql
cd packages/backend-api
npx sequelize db:migrate
cd -

# Add a service user that can talk to the Perspective API:
bin/osmod users:create --group moderator --name "PerspectiveAPI" \
  --moderator-type "perspective-api" --api-key $YOUR_PERSPECTIVE_API_KEY

# Run the server
bin/watch
```

#### Alternatively, run in a docker container

To run the service in a local docker container, run the following commands:

```bash
# Make sure any local instances of MySQL and Redis are not running
# E.g., on Ubuntu, stop the services
sudo systemctl stop mysql.service redis_6379.service redis-server.service

# Create docker images and launch the service
docker-compose -f deployments/local/docker-compose.yml up -d
```

The docker-compose scripts will initialise the database and create an API service user,
so you don't need to do those steps manually.

To shut down the service and delete all your containers:

```bash
docker-compose -f deployments/local/docker-compose.yml down
```

And to see what the container is doing:

```bash
docker-compose -f deployments/local/docker-compose.yml logs
```

The `osmod` CLI
---------------

You can manage your OSMod system using the osmod commandline tool:

```bash
./bin/osmod <command> <options>
```

where `command` is one of

* `users:create`                     Create new OS Moderator users
* `users:get-token`                  Get a JWT token for a user specified by id or email
* `comments:rescore`                 Rescore comment.
* `comments:send-to-scorer`          Send comments to Endpoint of user object to get scored.
* `comments:calculate-text-size`     Using node-canvas, calculate a single comment height at a given width.
* `comments:recalculate-text-sizes`  Using node-canvas, recalculate comment heights at a given width.
* `comments:recalculate-top-scores`  Recalculate comment top scores.
* `comments:flag`                    Flag comments.
* `comments:delete`                  Delete all comments from the database.
* `denormalize`                      Re-run denormalize counts


#### Managing Users

If you are an administrator, you can create other administrators, general moderator users,
and service users via the settings pages in the OSMod UI.  Also, if there are no admin users,
the UI will turn the first user to log in into an admin.  But you can also create users via the commandline.

Create a human user:

```bash
./bin/osmod users:create --group general --name "Name" --email "$EMAIL_OF_USER"
```

Replace `general` with `admin` if you want to create an administrator.


To create a service user - i.e., one that can connect via the API but not via the UI:

```bash
./bin/osmod users:create --group service --name "Robot"
```

Service users will require a JWT token.  You can get this via the UI, or via running the following command:

```bash
./bin/osmod users:get-token --id 4
```

### Management commands

To run a local server on `:8080` and front-end on `:8000`

```bash
./bin/watch
```

### Lint

```bash
./bin/lint
```

optionally you can run lint-fix to attempt auto-fixing most lint errors

```bash
./bin/lint-fix
```

### Storybook

To preview individual widgets and components used by the the OSMod UI:

```bash
./bin/storybook
```

The frontend unit tests also use storybook to generate a HTML snapshot of the resulting widgets.  
It then compares this snapshot to a stored version, allowing you to review and approve any changes. 

To update stories that need new snapshots, go to `packages/frontend-web` and run

```bash
npm run storybook:test -- -u
```

## Development

The project uses [lerna](https://www.npmjs.com/package/lerna) to help manage
development [the several npm packages](packages/README.md) that are in this
repository. Lerna sym-links package dependencies within this repository. Lerna
is also used to publish updates to all these packages at once.

## Running tests

To run the tests, you'll need to tweak your enviornment:

```bash
# Some tests need admin privileges to clean out the database
export DATABASE_NAME=os_moderator_test
export DATABASE_USER=root

# Run all the tests
NODE_ENV=test bin/test

# or you can run individual tests:
cd packages/backend-api
NODE_ENV=test npm run test
NODE_ENV=test ../../node_modules/.bin/ts-mocha 'src/test/domain/comments/*.spec.js' --recursive --timeout 10000
```

The `bin/test` script uses lerna to first compile all the typescript to javascript,
then runs all the tests.

Deleting and recreating the database schema can take a very long time, hence the long timeout above.
You may need to increase this even further if your system is particularly slow.

If you want to run a test in the debugger, add the --inspect-brk flag to the mocha invocation,
then connect using the chrome inspector (URL: `chrome://inspect`).

## What a running service looks like

While there can be many ways to setup a service, in general a deployment will
typically be a single VM instance running these services:

A MySQL database that holds all of the applications state (See
[the data model doc](docs/modelling.md)).

*  Frontend-Webserver service hosting the static ReactJS site. This sends
   messages to the Backend API service.
*  Backend API service responsible for querying the SQL database and sending
   data to the front-end service. This is also the endpoint that receives
   requests from the commenting platform it is supporting moderation of; and
   it sends requests back to the commenting platform with user actions (e.g. to
   reject or approve comments).
*  Backend Work Queue service responsible for managing concurrent queue of
   asynchronous work. TODO(ldixon): add reddis stuff?
*  Some number of assistant services responsible for automating tasks.
   Typically this is just calling ML services like
   [the Perspective API](https://perspectiveapi.com/)
   
