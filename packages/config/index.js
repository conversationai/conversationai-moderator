/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const path = require('path');
const convict = require('convict');

/**
 * Default/base configuration settings for OS Moderator
 */
const config = convict({
  env: {
    doc: 'The current application environment',
    format: ['production', 'local', 'test', 'circle_ci'],
    default: 'local',
    env: 'NODE_ENV'
  },

  port: {
    doc: 'The port to bind to',
    format: 'port',
    default: 8080,
    env: 'PORT'
  },

  app_name: {
    doc: 'The name of the project displayed on the frontend.',
    format: String,
    default: 'Moderator',
    env: 'APP_NAME'
  },

  api_url: {
    doc: 'The public URL for the API',
    format: String,
    default: 'http://localhost:8080',
    env: 'API_URL'
  },

  frontend_url: {
    doc: 'The public URL for the web frontend',
    format: String,
    default: 'http://localhost:8000',
    env: 'FRONTEND_URL'
  },

  database_host: {
    doc: 'Database host',
    format: String,
    default: 'localhost',
    env: 'DATABASE_HOST'
  },

  database_port: {
    doc: 'Database port',
    format: Number,
    default: 3306,
    env: 'DATABASE_PORT'
  },

  database_name: {
    doc: 'Database name',
    format: String,
    default: 'os_moderator',
    env: 'DATABASE_NAME'
  },

  database_user: {
    doc: 'Database user',
    format: String,
    default: 'os_moderator',
    env: 'DATABASE_USER'
  },

  database_password: {
    doc: 'Database password',
    format: String,
    default: undefined,
    env: 'DATABASE_PASSWORD'
  },

  database_socket: {
    doc: 'Database socket',
    format: String,
    default: 'nevermind',
    env: 'DATABASE_SOCKET'
  },

  current_git_sha: {
    doc: 'The SHA1 of the most recent git commit',
    format: String,
    default: 'unknown-sha',
    env: 'CURRENT_GIT_SHA'
  },

  redis_url: {
    doc: 'The Redis config URL used by the worker queue',
    format: String,
    default: 'redis://localhost:6379',
    env: 'REDIS_URL'
  },

  worker: {
    run_immediately: {
      doc: 'If true, we skip redis and run all tasks synchronously',
      format: Boolean,
      default: true,
      env: 'WORKER_RUN_IMMEDIATELY',
    },
    run_scheduled_tasks: {
      doc: 'Whether to run scheduled worker tasks or not',
      format: Boolean,
      default: true,
      env: 'WORKER_RUN_SCHEDULED_TASKS',
    },
    remove_task_on_complete: {
      doc: 'Whether to remove successful tasks from kue history to save memory',
      format: Boolean,
      default: true,
      env: 'WORKER_REMOVE_TASK_ON_COMPLETE',
    },
    task_ttl: {
      doc: 'Task Time To Live (in milliseconds)',
      format: Number,
      default: (5 * 60) * 1000, // 5 minutes.
      env: 'WORKER_TASK_TTL',
    }
  },

  httpsLinksOnly: {
    doc: 'Always return HTTPS links',
    format: Boolean,
    default: false,
    env: 'HTTPS_LINKS_ONLY'
  },

  redirect_oauth_to: {
    doc: 'Where to redirect successful OAUTH',
    format: String,
    default: 'referrer',
    env: 'REDIRECT_OAUTH_TO'
  },

  token_secret: {
    doc: 'Secret key used in encoding JWT tokens, should be unique to each environment',
    format: String,
    default: 'token',
    env: 'TOKEN_SECRET'
  },

  token_issuer: {
    doc: 'Simple text identifier of where a JWT was issued from',
    format: String,
    default: 'Open Source Moderator',
    env: 'TOKEN_ISSUER'
  },

  token_expiration_minutes: {
    doc: 'The number of minutes before a token expires',
    format: Number,
    default: 60 * 12, // 12 hours
  },

  publisher_notification_mode: {
    doc: 'Whether to post back to the publisher, or wait to be polled.',
    format: String,
    default: 'push',
    env: 'PUBLISHER_NOTIFICATION_MODE'
  },

  google_client_id: {
    doc: 'The Google OAuth web client id, found at https://console.developers.google.com',
    format: String,
    default: undefined,
    env: 'GOOGLE_CLIENT_ID'
  },

  google_client_secret: {
    doc: 'The Google OAuth web client secret, found at https://console.developers.google.com',
    format: String,
    default: undefined,
    env: 'GOOGLE_CLIENT_SECRET'
  },

  require_reason_to_reject: {
    doc: 'Flag to require moderator to select a reason (tag) to reject a comment',
    format: Boolean,
    default: true,
    env: 'REQUIRE_REASON_TO_REJECT'
  },

  restrict_to_session: {
    doc: 'Flag to restrict auth to the user session',
    format: Boolean,
    default: true,
    env: 'RESTRICT_TO_SESSION'
  },

  moderator_guidelines_url: {
    doc: 'URL for moderator guidelines',
    format: String,
    default: '',
    env: 'MODERATOR_GUIDELINES_URL'
  },

  submit_feedback_url: {
    doc: 'URL for submit feedback mechanism',
    format: String,
    default: '',
    env: 'SUBMIT_FEEDBACK_URL'
  },
});

// Try to load (env name).json config file (defaults to 'local.json')

const env = config.get('env');

try {
  config.loadFile(path.join(__dirname, env + '.json'));
} catch(e) { }

config.validate({ allowed: 'strict' });

module.exports = { config: config };
