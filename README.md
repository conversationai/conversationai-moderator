# OSMod

## Scripts

### Configuration

The configuration is found in packages/config/index.js.  It is pretty self explanatory.
All settings can be overridden via environment variables.

Of particular note, the following have no sensible defaults, and
must be set in the enviromnent before anything will work.

* `DATABASE_PASSWORD`: The MySQL database password.  (See below)
* `GOOGLE_SCORE_AUTH`: The API key.  You need to [ask someone on the team](https://www.perspectiveapi.com/#/) for a key.
* `GOOGLE_CLIENT_ID`: Google OAuth API client id.
* `GOOGLE_CLIENT_SECRET`:  Google OAuth API secret.

To get values for the latter two items, create an OAuth2.0 Client ID
entry for your app in the [Google API console](https://console.developers.google.com/apis/credentials).
Set the Authorised redirect URI to `http://localhost:8080/auth/callback/google`.
(Replace localhost with the address of your server if you are not running
locally.)

By default, the database name and database user is `os_moderator`.
The instructions below assume these settings.

### System setup:

Install mysql, node, npm and redis.  Instructions for Ubuntu:

```bash
sudo apt install mysql-server nodejs npm redis
sudo npm install -g npm

# On older versions of ubuntu, you can use `n` to ensure you get the correct version
# of node.js installed.
sudo npm install -g n
sudo n stable
rehash
```

### Install

Install all node dependencies and run initial typescript compile.

```bash
./bin/install
```

Setup local MySQL:

```bash
mysql -u root -p << EOF
CREATE DATABASE os_moderator;
CREATE USER 'os_moderator' IDENTIFIED BY '$DATABASE_PASSWORD';
GRANT ALL on os_moderator.* to os_moderator;
EOF

mysql -u root -p os_moderator < packages/backend-core/seed/initial-database.sql

./bin/osmod migrate
```

See [the SQL Data Model docs](docs/modeling.md) for more info.

You'll also need to create some (human) users.  The email address of the new users
should match the Google account address used to log in.  See below for instructions
on how to do this via the commandline.

### OSMOD commands

```bash
./bin/osmod ...
```

* `migrate`                          Migrate the database up
* `migrate:undo`                     Reverse a database migration
* `users:create`                     Create new OS Moderator users
* `users:get-token`                  Get a JWT token for a user specified by id or email
* `denormalize`                      Re-run denormalize counts
* `exec`                             Run a subcommand with app.yaml environment
* `comments:recalculate-text-sizes`  Using node-canvas, recalculate comment heights at a given width.
* `comments:calculate-text-size`     Using node-canvas, calculate a single comment height at a given width.
* `comments:recalculate-top-scores`  Recalculate comment top scores.
* `comments:rescore`                 Rescore comment.

#### Users

##### Create

Create OS Moderator users via the command line.

Create a human user:

```bash
./bin/osmod users:create --group general --name "Name" --email "email@example.com"
```

Create a service user:

```bash
./bin/osmod users:create --group service --name "Robot"
```

##### Get Token

Get JWT tokens for existing users via the command line:

By user id:

```bash
./bin/osmod users:get-token --id 4
```

By email:

```bash
./bin/osmod users:get-token --email "email@example.com"
```

### Local Dev

Runs local server on `:8080` and front-end on `:8000`

```bash
./bin/watch
```

### Publish

Uses Lerna to publish to the different npm packages

```bash
./bin/publish
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

Diffs storyshots of the current code against the last saved.

```bash
./bin/storybook
```

To update stories that need new snapshots, go to `packages/frontend-web` and run

```bash
npm run storybook:test -- -u
```

## Development

The project uses [lerna](https://www.npmjs.com/package/lerna) to help manage
development [the several npm packages](packages/README.md) that are in this
repository. Lerna sym-links package dependencies within this repository. Lerna
is also used to publish updates to all these packages at once.

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

