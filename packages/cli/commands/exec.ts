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

import {
  logger,
} from '@conversationai/moderator-backend-core';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { pickBy } from 'lodash';
import * as yargs from 'yargs';

export const command = 'exec';
export const describe = 'Run a subcommand with app.yaml environment';

export function builder(yargs: yargs.Argv) {
  return yargs
      .usage('Usage: node $0 exec --yaml=app.yaml --command="osmod comments:calculate-text-size"')
      .demand('yaml')
      .string('yaml')
      .describe('yaml', 'The YAML path')
      .demand('command')
      .string('command')
      .describe('command', 'The subcommand');
}

function getYAMLEnvironment(path: string): object {
  const doc = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
  const env = (doc && doc['env_variables']) || {};

  const ignoreSocket = !fs.existsSync('/cloudsql');

  return pickBy(env, (_value, key: string) => {
    return !(ignoreSocket && key === 'DATABASE_SOCKET');
  });
}

export async function handler({ yaml, command: commandString }: any) {
  try {
    const env = getYAMLEnvironment(yaml);

    logger.info(`exec: Loaded YAML: ${yaml}`);
    logger.info(env);

    logger.info(`exec: Running Command: ${commandString}`);
    const cmd = exec(commandString, {
      env: Object.assign({}, process.env, env),
    });

    cmd.stdout.on('data', (data) => {
      logger.info(`exec: ${data.toString().replace(/(\r\n)*$/g, '').replace(/(\n)*$/g, '')}`);
    });

    cmd.stderr.on('data', (data) => {
      logger.error(`exec: ${data.toString().replace(/(\r\n)*$/g, '').replace(/(\n)*$/g, '')}`);
    });

    cmd.on('close', () => {
      process.exit(0);
    });
  } catch (e) {
    process.exit(1);
  }
}
