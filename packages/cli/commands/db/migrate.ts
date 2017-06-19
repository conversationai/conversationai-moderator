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

import { execFile } from 'child_process';
import * as path from 'path';
import * as yargs from 'yargs';
const findup = require('find-up');
import * as fs from 'fs';

function getPackagePath(packageName: string) {
  let packagePath: string;

  try {
    packagePath = require.resolve(packageName);
  } catch (e) {
    packagePath = path.join(__dirname, '..', '..', 'node_modules', packageName);
  }

  const parts = packagePath.split(path.sep);
  if (parts[parts.length - 1].includes('.')) {
    packagePath = path.dirname(packagePath);
  }

  const packageFolder = findup.sync('package.json', { cwd: packagePath });

  return path.dirname(packageFolder);
}

const corePath = getPackagePath('@conversationai/moderator-backend-core');
const configPath = getPackagePath('@conversationai/moderator-config');
const sequelizeCli = path.join(getPackagePath('sequelize-cli'),  'bin', 'sequelize');
// Default to the npm bin format installed by sequelize-cli
let sequelizeCmdPath = 'sequelize';
if (fs.existsSync(sequelizeCli)) {
  // but prefer the local path to the sequelize bin, if it exists in node_modules
  sequelizeCmdPath = sequelizeCli;
}

const sequelizeArgs = [
  '--config',          path.join(configPath, 'sequelize.js'),
  '--migrations-path', path.join(corePath, 'dist/migrations'),
  '--models-path',     path.join(corePath, 'dist/models'),
  '--seeders-path',    path.join(corePath, 'dist/seeders'),
];

function callSequelizeCommand(command: string, env: { [key: string]: string }): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const subCommand = [
      command,
      ...sequelizeArgs,
    ];

    const envInfo = Object.keys(env).map((key) => {
      return `${key}="${env[key]}"`;
    }).join(' ');

    console.info(`Running: ${envInfo} ${sequelizeCmdPath} ${subCommand.join(' ')}`);

    const cmd = execFile(
      sequelizeCmdPath,
      subCommand,
      {
        env: Object.assign({}, process.env, env),
      },
    );

    cmd.stdout.on('data', (data) => {
      console.log(data);
    });

    cmd.stderr.on('data', (data) => {
      console.error(data);
      reject();
    });

    cmd.on('close', () => {
      resolve();
    });
  });
}

export const migrateCommand = {
  command: 'migrate',
  describe: 'Migrate the database up',

  builder(yargs: yargs.Argv) {
    return yargs
        .usage('Usage: osmod migrate');
  },

  async handler() {
    try {
      await callSequelizeCommand('db:migrate', {});
      process.exit(0);
    } catch (e) {
      process.exit(1);
    }
  },
};

export const migrateUndoCommand = {
  command: 'migrate:undo',
  describe: 'Reverse a database migration',

  builder(yargs: yargs.Argv) {
    return yargs
        .usage('Usage: osmod migrate:undo');
  },

  async handler() {
    try {
      await callSequelizeCommand('db:migrate:undo', {});
      process.exit(0);
    } catch (e) {
      process.exit(1);
    }
  },
};
