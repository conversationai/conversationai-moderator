# OS Moderator Worker/Task Queue

We have a worker/task queue using [Kue](https://github.com/Automattic/kue) and [Kue Scheduler](https://github.com/lykmapipo/kue-scheduler) for repeating tasks, which uses [Redis](http://redis.io/) as its backend.

## Running the worker

### In Development

#### With Docker

You can run all services from the root of the project like so:

```bash
docker-compose up
```

This will run the client, server, MySQL, Redis, and the worker.

#### Running Ad-Hoc

You'll need to make [Redis](http://redis.io/) is installed, which you can do with [Homebrew](http://brew.sh/):

```bash
brew install redis
```

And you can run it like so:

```bash
redis-server /usr/local/etc/redis.conf
```

There's a watch command to compile Typescript and run the worker:

```bash
cd server
npm run watch:worker
```

### In Real Life

For production the worker should be run like so:

```bash
cd server
npm run compile
node dist/worker/index.js
```

## Tasks

### Adding New Tasks

All tasks are conventionally organized into their own files under `server/worker/tasks/` and loaded passively by `server/worker/tasks/index.ts`, which is loaded by the worker entrypoint file at `server/worker/index.ts`.

### Queuing Tasks

When queuing a task, all that's happening is that meta information around the task is being logged to Redis, to be picked up by a running worker. This means that you can queue tasks as long as Redis is running, but they will not actually be executed unless a worker is also running to pick them up. Keep this in mind if you're queuing up lots of tasks without a worker running, as when you spin it up it will start processing them immediately.

To avoid this, particularly for local development, sometimes it's best to flush Redis (WARNING: This removes _everything_ from Redis):

```bash
# Spin up a Redis REPL and enter the 'FLUSHALL' command to delete everything
redis-cli
127.0.0.1:6379> FLUSHALL
```

To programmatically queue up a task, do the following:

```js
import { queue } from './worker/queue';

queue
    .create('nameOfTask', {someArgument1: 5, someArgument: 'Hello'})
    .save();
```

### Repeating/Scheduled Tasks

[kue-scheduler](https://github.com/lykmapipo/kue-scheduler) is in place to support repeating/scheduled tasks. To create a repeating task, you must define one, then in the main worker entry point, `worker/index.ts`, inside of the conditional checking whether to run scheduled tasks or not (`if (config.get('worker.run_scheduled_tasks')) { ... }`) you'll add your schedule and it should look something like this:

```js
const repeatingJob = queue
    // This is standard a Kue function to create a run of a task

    .create('nameOfYourTask')

    // This makes your repeating task unique, so that the runs of
    // it won't overlap
    // Uses: https://github.com/lykmapipo/kue-unique

    .unique(true)

    // This makes sure your job is removed on completion and that it
    // will repeat. Without this, the job run information will stay in
    // Redis and the `.unique` call will make it so it doesn't run again

    .removeOnComplete(true)

    // Time to live in milliseconds. This is a standard Kue function and
    // is a good idea so your job runs don't hang if there are issues with it

    .ttl(1000 * 60);

// This schedules your task, the time syntax accepts a cron-ish syntax:
// https://github.com/ncb000gt/node-cron
// ... as well as human readable intervals:
// https://github.com/rschmukler/human-interval

queue.every('6 hours', repeatingJob);
```

#### Issues with changing intervals

Kue scheduer is pretty finnicky and if you change the time interval, it seems to have issues picking it up, as it seems to store bits of data about the repeating data in various spots in the Redis DB that it doesn't resolve intuitively. You can fix this by running a FLUSHALL on Redis in your local environment if you don't care about deleting everything, but this should probably not happen in production. You can rename the task (maybe even the unique key...) and that would solve it.

